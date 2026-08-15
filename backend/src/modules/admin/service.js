import crypto from 'crypto';
import fs from 'fs';
import pool from '../../database/connection.js';
import * as adminRepository from './repository.js';
import * as authRepository from '../auth/repository.js';
import * as notificationService from '../../services/notificationService.js';

export async function getDashboardStats() {
  return await adminRepository.getSystemStats();
}

export async function getStaffAndInvitations() {
  const staff = await adminRepository.getStaffList();
  const invitations = await adminRepository.getInvitationsList();
  return { staff, invitations };
}

export async function inviteStaff(actorId, { name, email, role }) {
  // Check if user is already an admin/coordinator
  const existingInvRes = await pool.query(
    'SELECT id FROM internal_invitations WHERE email = $1 AND status IN (\'INVITED\', \'VERIFICATION_SUBMITTED\', \'APPROVED\')',
    [email]
  );
  if (existingInvRes.rows.length > 0) {
    const err = new Error('An active invitation or approved account already exists for this email');
    err.statusCode = 400;
    throw err;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const invitation = await adminRepository.createInvitation(name, email, role, tokenHash, expiresAt, actorId);

  // Write link to invite_link.txt for automated E2E tool verification
  const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${rawToken}`;
  fs.writeFileSync('invite_link.txt', invitationUrl, 'utf8');

  // Track email status: SENDING
  await adminRepository.updateInvitationEmailStatus(invitation.id, 'SENDING', null, null, null, null);

  const isCoord = role === 'COORDINATOR';
  const createdAction = isCoord ? 'COORDINATOR_INVITED' : 'ADMIN_INVITATION_CREATED';
  const sentAction = isCoord ? 'COORDINATOR_EMAIL_SENT' : 'ADMIN_INVITATION_EMAIL_SENT';
  const failedAction = isCoord ? 'COORDINATOR_EMAIL_FAILED' : 'ADMIN_INVITATION_EMAIL_FAILED';

  try {
    const res = await notificationService.sendStaffInvitationNotification(invitation, rawToken);
    const providerId = `${res?.provider || 'console'}-${Date.now()}`;
    await adminRepository.updateInvitationEmailStatus(invitation.id, 'SENT', new Date(), null, null, providerId);
    
    // Audit log for email sent
    await adminRepository.writeAuditLog(actorId, sentAction, 'INVITATION', invitation.id, { email, role });
  } catch (err) {
    console.error('SMTP email dispatch failure in service:', err.message);
    await adminRepository.updateInvitationEmailStatus(invitation.id, 'FAILED', null, new Date(), err.message, null);
    await adminRepository.updateInvitationStatus(invitation.id, 'EMAIL_FAILED');
    
    // Audit log for email failed
    await adminRepository.writeAuditLog(actorId, failedAction, 'INVITATION', invitation.id, { email, role, error: err.message });
  }

  // Audit log for invitation creation
  await adminRepository.writeAuditLog(actorId, createdAction, 'INVITATION', invitation.id, { email, role });

  return { invitation, rawToken };
}

export async function resendStaffInvitation(actorId, invitationId) {
  const invitation = await adminRepository.getInvitationById(invitationId);
  if (!invitation) {
    const err = new Error('Invitation not found');
    err.statusCode = 404;
    throw err;
  }

  if (['APPROVED', 'REVOKED'].includes(invitation.status)) {
    const err = new Error(`Cannot resend an invitation that is already ${invitation.status.toLowerCase()}`);
    err.statusCode = 400;
    throw err;
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Reset invitation lifecycle states
  await adminRepository.updateInvitationReissue(invitationId, tokenHash, expiresAt, 'INVITED');
  const updatedInv = await adminRepository.getInvitationById(invitationId);

  // Write link to invite_link.txt for automated E2E tool verification
  const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${rawToken}`;
  fs.writeFileSync('invite_link.txt', invitationUrl, 'utf8');

  // Track email status: SENDING
  await adminRepository.updateInvitationEmailStatus(invitationId, 'SENDING', null, null, null, null);

  const isCoord = updatedInv.role === 'COORDINATOR';
  const resentAction = isCoord ? 'COORDINATOR_INVITED' : 'ADMIN_INVITATION_RESENT';
  const sentAction = isCoord ? 'COORDINATOR_EMAIL_SENT' : 'ADMIN_INVITATION_EMAIL_SENT';
  const failedAction = isCoord ? 'COORDINATOR_EMAIL_FAILED' : 'ADMIN_INVITATION_EMAIL_FAILED';

  try {
    const res = await notificationService.sendStaffInvitationNotification(updatedInv, rawToken);
    const providerId = `${res?.provider || 'console'}-${Date.now()}`;
    await adminRepository.updateInvitationEmailStatus(invitationId, 'SENT', new Date(), null, null, providerId);
    await adminRepository.writeAuditLog(actorId, sentAction, 'INVITATION', invitationId, { email: updatedInv.email, role: updatedInv.role });
  } catch (err) {
    console.error('SMTP email dispatch failure in resend:', err.message);
    await adminRepository.updateInvitationEmailStatus(invitationId, 'FAILED', null, new Date(), err.message, null);
    await adminRepository.updateInvitationStatus(invitationId, 'EMAIL_FAILED');
    await adminRepository.writeAuditLog(actorId, failedAction, 'INVITATION', invitationId, { email: updatedInv.email, role: updatedInv.role, error: err.message });
  }

  // Audit log for resend
  await adminRepository.writeAuditLog(actorId, resentAction, 'INVITATION', invitationId, { email: updatedInv.email });

  return { message: 'Invitation resent successfully.', rawToken };
}

export async function revokeStaffInvitation(actorId, invitationId) {
  const invitation = await adminRepository.getInvitationById(invitationId);
  if (!invitation) {
    const err = new Error('Invitation not found');
    err.statusCode = 404;
    throw err;
  }

  if (['APPROVED', 'REVOKED'].includes(invitation.status)) {
    const err = new Error(`Cannot revoke an invitation that is already ${invitation.status.toLowerCase()}`);
    err.statusCode = 400;
    throw err;
  }

  await adminRepository.updateInvitationRevocation(invitationId, actorId);

  const isCoord = invitation.role === 'COORDINATOR';
  const revokeAction = isCoord ? 'COORDINATOR_DEACTIVATED' : 'ADMIN_INVITATION_REVOKED'; // COORDINATOR_DEACTIVATED is standard since they are revoked

  // Audit log
  await adminRepository.writeAuditLog(actorId, revokeAction, 'INVITATION', invitationId, { email: invitation.email });

  return { message: 'Invitation revoked successfully.' };
}

export async function deleteStaffInvitation(actorId, invitationId) {
  const invitation = await adminRepository.getInvitationById(invitationId);
  if (!invitation) {
    const err = new Error('Invitation not found');
    err.statusCode = 404;
    throw err;
  }

  const deletableStates = ['INVITED', 'EMAIL_FAILED', 'REVOKED', 'EXPIRED'];
  const isExpired = new Date(invitation.expires_at) < new Date();
  const isDeletable = deletableStates.includes(invitation.status) || (isExpired && !invitation.accepted_at);

  if (!isDeletable) {
    const err = new Error('Cannot delete an invitation that has already been accepted or processed');
    err.statusCode = 400;
    throw err;
  }

  await adminRepository.updateInvitationDeletion(invitationId, actorId);

  const isCoord = invitation.role === 'COORDINATOR';
  const deleteAction = isCoord ? 'COORDINATOR_INVITATION_DELETED' : 'ADMIN_INVITATION_DELETED';

  // Audit log
  await adminRepository.writeAuditLog(actorId, deleteAction, 'INVITATION', invitationId, { email: invitation.email });

  return { message: 'Invitation deleted successfully.' };
}

export async function reviewVerification(actorId, invitationId, { action, notes }) {
  const invitation = await adminRepository.getInvitationById(invitationId);
  if (!invitation) {
    const err = new Error('Invitation not found');
    err.statusCode = 404;
    throw err;
  }

  if (invitation.status !== 'VERIFICATION_SUBMITTED' && invitation.status !== 'UNDER_REVIEW') {
    const err = new Error(`Invitation is not pending verification (Status: ${invitation.status})`);
    err.statusCode = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const isCoord = invitation.role === 'COORDINATOR';
    const approveAction = isCoord ? 'COORDINATOR_VERIFICATION_APPROVED' : 'ADMIN_VERIFICATION_APPROVED';
    const rejectAction = isCoord ? 'COORDINATOR_VERIFICATION_REJECTED' : 'ADMIN_VERIFICATION_REJECTED';

    if (action === 'APPROVE') {
      // 1. Update invitation status, reviewed_by, reviewed_at. User status remains INACTIVE!
      await client.query(
        `UPDATE internal_invitations 
         SET status = 'APPROVED', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1, rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [actorId, invitationId]
      );

      // 2. Assign role to the user account
      await authRepository.addRole(invitation.accepted_by, invitation.role, client);

      // 3. Create profile if Coordinator
      if (invitation.role === 'COORDINATOR') {
        const vData = invitation.verification_data || {};
        await client.query(
          `INSERT INTO coordinator_profiles (user_id, area, district, state, status, availability_status)
           VALUES ($1, $2, $3, $4, 'ACTIVE', 'OFFLINE')
           ON CONFLICT (user_id) DO UPDATE SET area = $2, district = $3, state = $4, status = 'ACTIVE'`,
          [
            invitation.accepted_by,
            vData.area || 'Bhimavaram',
            vData.district || 'West Godavari',
            vData.state || 'Andhra Pradesh'
          ]
        );
      }

      // Write Audit Log
      await adminRepository.writeAuditLog(actorId, approveAction, 'INVITATION', invitationId, {
        email: invitation.email,
        role: invitation.role,
        notes
      }, client);

    } else if (action === 'REJECT') {
      // 1. Update invitation status, reviewed_by, reviewed_at, rejection_reason.
      await client.query(
        `UPDATE internal_invitations 
         SET status = 'REJECTED', reviewed_at = CURRENT_TIMESTAMP, reviewed_by = $1, rejection_reason = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [actorId, notes || 'Verification details rejected', invitationId]
      );

      // Write Audit Log
      await adminRepository.writeAuditLog(actorId, rejectAction, 'INVITATION', invitationId, {
        email: invitation.email,
        role: invitation.role,
        notes
      }, client);
    } else {
      const err = new Error('Invalid review action');
      err.statusCode = 400;
      throw err;
    }

    await client.query('COMMIT');
    return { message: `Staff verification has been successfully ${action.toLowerCase()}d.` };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function updateStaffStatus(actorId, targetUserId, { status }) {
  if (!['ACTIVE', 'INACTIVE'].includes(status)) {
    const err = new Error('Invalid status value');
    err.statusCode = 400;
    throw err;
  }

  // If deactivating, run safety check
  if (status === 'INACTIVE') {
    // Check if target is Admin
    const rolesRes = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [targetUserId]);
    const isTargetAdmin = rolesRes.rows.some(r => r.role === 'ADMIN');

    if (isTargetAdmin) {
      const activeAdminsCount = await adminRepository.countActiveAdmins();
      if (activeAdminsCount <= 1) {
        const err = new Error('Cannot deactivate the last active administrator. Enduring system access requires at least one active Admin.');
        err.statusCode = 400;
        throw err;
      }
    }
  }

  // Fetch user to match invitation
  const userRes = await pool.query('SELECT email FROM users WHERE id = $1', [targetUserId]);
  const userEmail = userRes.rows[0]?.email;

  const targetRolesRes = await pool.query('SELECT role FROM user_roles WHERE user_id = $1', [targetUserId]);
  const targetRoles = targetRolesRes.rows.map(r => r.role);
  const isCoordinator = targetRoles.includes('COORDINATOR');

  await adminRepository.updateUserStatus(targetUserId, status);

  // If deactivating a coordinator, make sure their profile status is updated as well!
  if (isCoordinator) {
    await pool.query(
      "UPDATE coordinator_profiles SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2",
      [status, targetUserId]
    );
  }

  if (userEmail) {
    const invitation = await adminRepository.getInvitationByEmail(userEmail);
    if (invitation) {
      if (status === 'ACTIVE') {
        await adminRepository.updateInvitationActivation(invitation.id, new Date(), actorId);
        
        const activateAction = isCoordinator ? 'COORDINATOR_ACTIVATED' : 'ADMIN_ACCOUNT_ACTIVATED';
        await adminRepository.writeAuditLog(actorId, activateAction, 'USER', targetUserId, { email: userEmail });
      } else {
        await adminRepository.updateInvitationDeactivation(invitation.id, new Date(), actorId);
        
        const deactivateAction = isCoordinator ? 'COORDINATOR_DEACTIVATED' : 'ADMIN_ACCOUNT_DEACTIVATED';
        await adminRepository.writeAuditLog(actorId, deactivateAction, 'USER', targetUserId, { email: userEmail });
      }
    }
  }

  return { message: `User status successfully updated to ${status.toLowerCase()}.` };
}

export async function getCoordinatorDetails(actorId, targetUserId) {
  // 1. Fetch user and check if coordinator
  const userRes = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at, u.last_login_at, u.first_login_at
     FROM users u
     JOIN user_roles ur ON u.id = ur.user_id
     WHERE u.id = $1 AND ur.role = 'COORDINATOR'`,
    [targetUserId]
  );
  if (userRes.rows.length === 0) {
    const err = new Error('Coordinator user account not found');
    err.statusCode = 404;
    throw err;
  }
  const user = userRes.rows[0];

  // 2. Fetch coordinator profile details
  const profileRes = await pool.query(
    "SELECT id, area, district, state, status, availability_status, last_active_at FROM coordinator_profiles WHERE user_id = $1",
    [targetUserId]
  );
  const profile = profileRes.rows[0] || null;
  const coordinatorProfileId = profile?.id;

  // 3. Fetch invitation details if exists
  const invitationRes = await pool.query(
    "SELECT * FROM internal_invitations WHERE email = $1 AND role = 'COORDINATOR'",
    [user.email]
  );
  const invitation = invitationRes.rows[0] || null;

  // 4. Fetch stats, active coordinations, activity, donations and audits
  const stats = await adminRepository.getCoordinatorStats(targetUserId, coordinatorProfileId);
  const currentRequests = await adminRepository.getCoordinatorActiveCoordination(coordinatorProfileId);
  const recentActivity = await adminRepository.getCoordinatorRecentActivity(targetUserId);
  const donationHistory = await adminRepository.getCoordinatorDonationHistory(targetUserId);
  const auditHistory = await adminRepository.getCoordinatorAuditHistory(targetUserId);

  return {
    user,
    profile,
    invitation,
    stats,
    currentRequests,
    recentActivity,
    donationHistory,
    auditHistory
  };
}

export async function getLogs() {
  return await adminRepository.getAuditLogs();
}

export async function getDonors({ search, bloodGroup, availability, sort }) {
  const registeredCountRes = await pool.query('SELECT COUNT(*) FROM donor_profiles');
  const activeCountRes = await pool.query("SELECT COUNT(*) FROM donor_profiles dp JOIN users u ON dp.user_id = u.id WHERE u.status = 'ACTIVE'");
  const readyCountRes = await pool.query("SELECT COUNT(*) FROM donor_profiles WHERE availability_status = 'AVAILABLE'");
  const donationsCountRes = await pool.query("SELECT COUNT(*) FROM donations WHERE status = 'COMPLETED'");
  
  const metrics = {
    registered: parseInt(registeredCountRes.rows[0].count, 10),
    active: parseInt(activeCountRes.rows[0].count, 10),
    ready: parseInt(readyCountRes.rows[0].count, 10),
    donations: parseInt(donationsCountRes.rows[0].count, 10)
  };

  const donors = await adminRepository.getDonorsList(search, bloodGroup, availability, sort);
  return { metrics, donors };
}

export async function getDonorDetails(actorId, donorUserId) {
  const donor = await adminRepository.getDonorAccountAndProfile(donorUserId);
  if (!donor) {
    const err = new Error('Donor account not found');
    err.statusCode = 404;
    throw err;
  }

  const donationHistory = await adminRepository.getDonorDonationHistory(donor.donor_profile_id);
  const responsesHistory = await adminRepository.getDonorResponsesHistory(donor.donor_profile_id);

  return {
    donor,
    donationHistory,
    responsesHistory
  };
}

export async function getRequests({ search, bloodGroup, urgency, status, location, dateFrom, dateTo, sort }) {
  const openRes = await pool.query("SELECT COUNT(*) FROM blood_requests WHERE status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND')");
  const emergencyRes = await pool.query("SELECT COUNT(*) FROM blood_requests WHERE urgency_level = 'EMERGENCY' AND status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND')");
  const awaitingDonorRes = await pool.query("SELECT COUNT(*) FROM blood_requests WHERE status IN ('PENDING', 'APPROVED', 'DONORS_ALERTED')");
  const acceptedRes = await pool.query("SELECT COUNT(*) FROM blood_requests WHERE status = 'DONOR_RESPONDED'");
  const coordinationRes = await pool.query("SELECT COUNT(*) FROM blood_requests WHERE status IN ('COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED')");
  const completedRes = await pool.query("SELECT COUNT(*) FROM blood_requests WHERE status = 'FULFILLED'");
  const attentionRes = await pool.query(
    `SELECT COUNT(*) FROM blood_requests br 
     LEFT JOIN request_assignments ra ON br.id = ra.request_id AND ra.status = 'ASSIGNED' 
     WHERE br.status = 'DONOR_RESPONDED' AND (ra.id IS NULL OR ra.assigned_at < CURRENT_TIMESTAMP - INTERVAL '2 hours')`
  );

  const metrics = {
    open: parseInt(openRes.rows[0].count, 10),
    emergency: parseInt(emergencyRes.rows[0].count, 10),
    awaitingDonor: parseInt(awaitingDonorRes.rows[0].count, 10),
    accepted: parseInt(acceptedRes.rows[0].count, 10),
    coordination: parseInt(coordinationRes.rows[0].count, 10),
    completed: parseInt(completedRes.rows[0].count, 10),
    attentionNeeded: parseInt(attentionRes.rows[0].count, 10)
  };

  const requests = await adminRepository.getRequestsList({ search, bloodGroup, urgency, status, location, dateFrom, dateTo, sort });
  return { metrics, requests };
}

export async function getRequestDetails(actorId, requestId) {
  const request = await adminRepository.getRequestDetailsById(requestId);
  if (!request) {
    const err = new Error('Blood request not found');
    err.statusCode = 404;
    throw err;
  }

  const assignment = await adminRepository.getRequestActiveAssignment(requestId) || null;
  const compatibleDonors = await adminRepository.getCompatibleDonors(request.blood_group, requestId);

  return {
    request,
    assignment,
    compatibleDonors
  };
}

export async function getActiveCoordinatorsList() {
  return await adminRepository.getActiveCoordinators();
}

export async function assignRequestCoordinator(actorId, requestId, { coordinatorId }) {
  const request = await adminRepository.getRequestDetailsById(requestId);
  if (!request) {
    const err = new Error('Blood request not found');
    err.statusCode = 404;
    throw err;
  }

  const terminalStatuses = ['FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND'];
  if (terminalStatuses.includes(request.status)) {
    const err = new Error(`Cannot assign coordinator to a ${request.status.toLowerCase()} request`);
    err.statusCode = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await adminRepository.deactivateActiveAssignments(requestId, client);
    await adminRepository.createAssignment(requestId, coordinatorId, client);
    await adminRepository.updateRequestStatus(requestId, 'COORDINATOR_ASSIGNED', client);
    
    await adminRepository.writeAuditLog(actorId, 'ADMIN_ASSIGNED_COORDINATOR', 'BLOOD_REQUEST', requestId, {
      coordinator_id: coordinatorId
    }, client);

    await client.query('COMMIT');
    return { success: true, message: 'Coordinator successfully assigned to request.' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function cancelBloodRequest(actorId, requestId) {
  const request = await adminRepository.getRequestDetailsById(requestId);
  if (!request) {
    const err = new Error('Blood request not found');
    err.statusCode = 404;
    throw err;
  }

  const terminalStatuses = ['FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND'];
  if (terminalStatuses.includes(request.status)) {
    const err = new Error(`Request is already in terminal state: ${request.status}`);
    err.statusCode = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await adminRepository.deactivateActiveAssignments(requestId, client);
    await adminRepository.updateRequestStatus(requestId, 'CANCELLED', client);
    
    await adminRepository.writeAuditLog(actorId, 'ADMIN_CANCELLED_REQUEST', 'BLOOD_REQUEST', requestId, {}, client);

    await client.query('COMMIT');
    return { success: true, message: 'Blood request successfully cancelled.' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
