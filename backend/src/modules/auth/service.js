import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../../database/connection.js';
import * as authRepository from './repository.js';
import * as notificationService from '../../services/notificationService.js';
import * as adminRepository from '../admin/repository.js';
import { arePhonesEqual } from '../../utils/phone.js';

const SALT_ROUNDS = 10;


export async function registerUser({ name, email, phone, password }) {
  // Check if email or phone already exists
  const existingUsers = await authRepository.checkUserExistsByEmailOrPhone(email, phone);
  if (existingUsers.length > 0) {
    const isEmail = existingUsers.some(u => u.email === email);
    const isPhone = existingUsers.some(u => u.phone === phone);
    const field = isEmail && isPhone ? 'email and phone' : isEmail ? 'email' : 'phone';
    const err = new Error(`User with this ${field} already exists`);
    err.statusCode = 409;
    throw err;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  return await authRepository.createUser(name, email, phone, passwordHash);
}

export async function loginUser({ email, password }) {
  // Find user by email or phone (identifier)
  const user = await authRepository.getUserByIdentifier(email);
  if (!user) {
    const err = new Error('Invalid email/phone or password');
    err.statusCode = 401;
    throw err;
  }

  // Verify password
  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    const err = new Error('Invalid email/phone or password');
    err.statusCode = 401;
    throw err;
  }

  // Fetch roles
  const roles = await authRepository.getUserRoles(user.id);

  // Check if account suspended/inactive
  if (user.status !== 'ACTIVE') {
    if (roles.includes('ADMIN')) {
      const err = new Error('Your administrator account has been approved but is not activated yet. Please contact an active administrator.');
      err.statusCode = 403;
      throw err;
    }
    const err = new Error(`User account is ${user.status.toLowerCase()}`);
    err.statusCode = 403;
    throw err;
  }

  // Check if first login
  const isFirstLogin = !user.first_login_at;

  // Update last login
  await authRepository.updateLastLogin(user.id);

  // Audit log for privileged staff logins (SUPER_ADMIN, ADMIN, COORDINATOR, BLOOD_BANK_ADMIN)
  const isPrivilegedStaff = roles.some(r => ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'BLOOD_BANK_ADMIN'].includes(r));
  if (isPrivilegedStaff) {
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'USER', $1, $3)`,
      [user.id, isFirstLogin ? 'STAFF_FIRST_LOGIN' : 'STAFF_LOGIN', JSON.stringify({ email: user.email, roles })]
    );
  }


  // Generate JWT token
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET env variable not set');
  }

  const token = jwt.sign(
    { id: user.id, roles, is_verified: user.is_verified, token_version: user.token_version },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      is_verified: user.is_verified,
      roles
    }
  };
}

export async function getCurrentUser(userId) {
  const user = await authRepository.getUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const roles = await authRepository.getUserRoles(userId);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    status: user.status,
    is_verified: user.is_verified,
    created_at: user.created_at,
    last_login_at: user.last_login_at,
    roles
  };
}

export async function becomeDonor(userId, donorData) {
  // 1. Verify user exists
  const user = await authRepository.getUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  // Prevent privileged accounts from becoming donors
  const existingRoles = await authRepository.getUserRoles(userId);
  const isPrivileged = existingRoles.some(r => ['SUPER_ADMIN', 'COORDINATOR', 'BLOOD_BANK_ADMIN'].includes(r));
  if (isPrivileged) {
    const err = new Error('Privileged operational accounts are not permitted to register as donors.');
    err.statusCode = 403;
    throw err;
  }

  // Enforce account verification
  if (!user.is_verified) {
    const err = new Error('Account verification is required before selecting a role.');
    err.statusCode = 403;
    err.code = 'ACCOUNT_UNVERIFIED';
    throw err;
  }

  // 2. Verify blood group exists
  const bloodGroup = await authRepository.getBloodGroupById(donorData.blood_group_id);
  if (!bloodGroup) {
    const err = new Error('Invalid blood group ID');
    err.statusCode = 400;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add Donor role
    await authRepository.addRole(userId, 'DONOR', client);

    // Validate secondary phone if provided; do NOT default to primary phone
    const secondaryPhone = donorData.phone && donorData.phone.trim() ? donorData.phone.trim() : null;
    if (secondaryPhone && arePhonesEqual(secondaryPhone, user.phone)) {
      const err = new Error('Secondary phone number cannot be the same as your primary phone number.');
      err.statusCode = 400;
      throw err;
    }

    // Create profile with null secondary phone if not explicitly provided
    await authRepository.createDonorProfile(
      userId,
      donorData.blood_group_id,
      donorData.date_of_birth,
      donorData.gender,
      secondaryPhone,
      donorData.address,
      donorData.area,
      donorData.district,
      donorData.state,
      donorData.pincode,
      client
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Generate refreshed token to include new roles
  const roles = await authRepository.getUserRoles(userId);
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign({ id: userId, roles, is_verified: true, token_version: user.token_version }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });

  return {
    token,
    roles
  };
}

export async function becomeReceiver(userId, receiverData) {
  // 1. Verify user exists
  const user = await authRepository.getUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  // Prevent privileged accounts from becoming receivers
  const existingRoles = await authRepository.getUserRoles(userId);
  const isPrivileged = existingRoles.some(r => ['SUPER_ADMIN', 'COORDINATOR', 'BLOOD_BANK_ADMIN'].includes(r));
  if (isPrivileged) {
    const err = new Error('Privileged operational accounts are not permitted to register as receivers.');
    err.statusCode = 403;
    throw err;
  }

  // Enforce account verification
  if (!user.is_verified) {
    const err = new Error('Account verification is required before selecting a role.');
    err.statusCode = 403;
    err.code = 'ACCOUNT_UNVERIFIED';
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add Receiver role
    await authRepository.addRole(userId, 'RECEIVER', client);

    // Create profile
    await authRepository.createReceiverProfile(
      userId,
      receiverData.name || user.name,
      receiverData.phone || user.phone,
      receiverData.address,
      receiverData.area,
      receiverData.district,
      receiverData.state,
      receiverData.pincode,
      receiverData.receiver_type || 'INDIVIDUAL',
      client
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  // Refreshed token to include new roles
  const roles = await authRepository.getUserRoles(userId);
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign({ id: userId, roles, is_verified: true, token_version: user.token_version }, secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  });

  return {
    token,
    roles
  };
}

export async function requestPasswordReset({ identifier }) {
  const user = await authRepository.getUserByIdentifier(identifier);
  if (!user || user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
    // Avoid revealing user existence or deactivation state
    return { message: 'If an account exists with this information, recovery instructions will be sent.' };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const minutes = parseInt(process.env.PASSWORD_RESET_TOKEN_MINUTES, 10) || 30;
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);

  // Invalidate any existing active tokens for this user
  await authRepository.invalidateUserResetTokens(user.id);

  // Create new active token
  await authRepository.createResetToken(user.id, tokenHash, expiresAt);

  // Deliver token using corresponding channel
  const isEmail = identifier.includes('@');
  try {
    if (isEmail) {
      await notificationService.sendPasswordResetNotification(user, rawToken);
    } else {
      await notificationService.sendPasswordResetSMS(user, rawToken);
    }
  } catch (error) {
    const err = new Error(`Recovery service is temporarily unavailable: ${error.message}`);
    err.statusCode = 503;
    throw err;
  }

  return { message: 'If an account exists with this information, recovery instructions will be sent.' };
}

export async function resetUserPassword({ token, password }) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const activeToken = await authRepository.getActiveResetToken(tokenHash);

  if (!activeToken) {
    const err = new Error('Invalid or expired reset token');
    err.statusCode = 400;
    throw err;
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Update password in DB
  await authRepository.updateUserPassword(activeToken.user_id, passwordHash);

  // Invalidate current JWT sessions across all devices
  await authRepository.incrementTokenVersion(activeToken.user_id);

  // Invalidate this token and other reset tokens for safety
  await authRepository.invalidateUserResetTokens(activeToken.user_id);
  await authRepository.markResetTokenAsUsed(activeToken.id);

  // Audit logging for password reset completion
  await pool.query(
    `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
     VALUES ($1, 'PASSWORD_RESET_COMPLETED', 'USER', $1, $2)`,
    [activeToken.user_id, JSON.stringify({ timestamp: new Date().toISOString() })]
  );

  return { message: 'Password reset successfully' };
}

export async function changeUserPassword(userId, { currentPassword, newPassword }) {
  const hash = await authRepository.getUserPasswordHash(userId);
  if (!hash) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  // Verify current password matches
  const match = await bcrypt.compare(currentPassword, hash);
  if (!match) {
    const err = new Error('Incorrect current password');
    err.statusCode = 400;
    throw err;
  }

  // Verify it is not identical to current password
  const isSame = await bcrypt.compare(newPassword, hash);
  if (isSame) {
    const err = new Error('New password cannot be the same as your current password');
    err.statusCode = 400;
    throw err;
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await authRepository.updateUserPassword(userId, passwordHash);

  // Invalidate current JWT sessions
  await authRepository.incrementTokenVersion(userId);

  // Audit logging
  const roles = await authRepository.getUserRoles(userId);
  const isPrivileged = roles.some(r => ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'BLOOD_BANK_ADMIN'].includes(r));
  if (isPrivileged) {
    await adminRepository.writeAuditLog(
      userId,
      'PASSWORD_CHANGED',
      'USER',
      userId,
      { timestamp: new Date().toISOString(), roles }
    );
  }

  return { message: 'Password changed successfully' };
}

export async function updateUserProfile(userId, { name, phone }) {
  const user = await authRepository.getUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  await authRepository.updateUserProfileDetails(userId, name, phone);

  // Audit logging
  const roles = await authRepository.getUserRoles(userId);
  const isPrivileged = roles.some(r => ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'BLOOD_BANK_ADMIN'].includes(r));
  if (isPrivileged) {
    await adminRepository.writeAuditLog(
      userId,
      'PROFILE_UPDATED',
      'USER',
      userId,
      { name, phone, roles }
    );
  }

  return { message: 'Profile updated successfully' };
}


export async function validateInvitationToken(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const result = await pool.query(
    `SELECT id, email, name, role, status, expires_at, created_by, link_opened_at 
     FROM internal_invitations 
     WHERE token_hash = $1`,
    [tokenHash]
  );
  const invitation = result.rows[0];

  if (!invitation) {
    const err = new Error('Invalid invitation token');
    err.statusCode = 400;
    throw err;
  }

  if (new Date(invitation.expires_at) < new Date()) {
    const err = new Error('Invitation token has expired');
    err.statusCode = 400;
    throw err;
  }

  if (invitation.status === 'DELETED') {
    const err = new Error('Invitation no longer available. This invitation has been revoked by the Trust administrator.');
    err.statusCode = 400;
    throw err;
  }

  if (invitation.status !== 'INVITED' && invitation.status !== 'EMAIL_FAILED') {
    const err = new Error(`Invitation has already been accepted or processed (Status: ${invitation.status})`);
    err.statusCode = 400;
    throw err;
  }

  // Update link_opened_at if not set and write audit log
  if (!invitation.link_opened_at) {
    await pool.query(
      `UPDATE internal_invitations 
       SET link_opened_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [invitation.id]
    );
    const isCoord = invitation.role === 'COORDINATOR';
    const actionStr = isCoord ? 'COORDINATOR_INVITATION_OPENED' : 'ADMIN_INVITATION_OPENED';
    await pool.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'INVITATION', $3, $4)`,
      [null, actionStr, invitation.id, JSON.stringify({ email: invitation.email, role: invitation.role })]
    );
  }

  return invitation;
}

export async function acceptInvitationAndSubmitVerification({ token, password, phone, employee_id, notes, id_card_image }) {
  const invitation = await validateInvitationToken(token);

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create or update user as INACTIVE initially
    const userExistRes = await client.query('SELECT id FROM users WHERE email = $1', [invitation.email]);
    let userId;

    if (userExistRes.rows.length > 0) {
      userId = userExistRes.rows[0].id;
      // Update details but keep status INACTIVE until Admin approves
      await client.query(
        `UPDATE users 
         SET name = $1, phone = $2, password_hash = $3, status = 'INACTIVE', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $4`,
         [invitation.name, phone, passwordHash, userId]
      );
    } else {
      const insertRes = await client.query(
        `INSERT INTO users (name, email, phone, password_hash, status)
         VALUES ($1, $2, $3, $4, 'INACTIVE')
         RETURNING id`,
        [invitation.name, invitation.email, phone, passwordHash]
      );
      userId = insertRes.rows[0].id;
    }

    // 2. Update invitation status and verification data
    const verificationData = {
      employee_id,
      notes,
      id_card_image,
      phone
    };

    await client.query(
      `UPDATE internal_invitations 
       SET status = 'VERIFICATION_SUBMITTED', accepted_by = $1, verification_data = $2, 
           accepted_at = CURRENT_TIMESTAMP, verification_submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3`,
      [userId, JSON.stringify(verificationData), invitation.id]
    );

    // 3. Log to audit log
    const isCoord = invitation.role === 'COORDINATOR';
    const acceptAction = isCoord ? 'COORDINATOR_INVITATION_ACCEPTED' : 'ADMIN_INVITATION_ACCEPTED';
    const submitAction = isCoord ? 'COORDINATOR_VERIFICATION_SUBMITTED' : 'ADMIN_VERIFICATION_SUBMITTED';

    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'INVITATION', $3, $4)`,
      [userId, acceptAction, invitation.id, JSON.stringify({ email: invitation.email, role: invitation.role })]
    );

    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'INVITATION', $3, $4)`,
      [userId, submitAction, invitation.id, JSON.stringify({ email: invitation.email, role: invitation.role })]
    );

    await client.query('COMMIT');
    return { message: 'Verification details submitted successfully. Please wait for administrator approval.' };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function logoutUser(userId) {
  // Invalidate current JWT sessions across all devices
  await authRepository.incrementTokenVersion(userId);

  const roles = await authRepository.getUserRoles(userId);
  const isPrivileged = roles.some(r => ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'BLOOD_BANK_ADMIN'].includes(r));
  if (isPrivileged) {
    await adminRepository.writeAuditLog(
      userId,
      'STAFF_LOGOUT',
      'USER',
      userId,
      { timestamp: new Date().toISOString(), roles }
    );
  }
}

export async function deleteUserAccount(userId, { password, reason, confirmText }) {
  if (confirmText !== 'DELETE') {
    const err = new Error('Confirmation text must be DELETE');
    err.statusCode = 400;
    throw err;
  }

  // 1. Verify user exists and is currently active
  const user = await authRepository.getUserById(userId);
  if (!user || user.status !== 'ACTIVE') {
    const err = new Error('Active user account not found');
    err.statusCode = 404;
    throw err;
  }

  // 2. Role authorization: ONLY DONOR and RECEIVER permitted
  const roles = await authRepository.getUserRoles(userId);
  const isPrivileged = roles.some(r => ['SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'BLOOD_BANK_ADMIN'].includes(r));
  if (isPrivileged) {
    const err = new Error('Staff and administrator accounts cannot be deleted through self-service. Please contact Trust Administration.');
    err.statusCode = 403;
    throw err;
  }

  const isDonorOrReceiver = roles.includes('DONOR') || roles.includes('RECEIVER');
  if (!isDonorOrReceiver) {
    const err = new Error('Only registered Donor or Receiver accounts are eligible for self-service account deletion.');
    err.statusCode = 403;
    throw err;
  }

  // 3. Verify current password
  const hash = await authRepository.getUserPasswordHash(userId);
  const passwordMatch = await bcrypt.compare(password, hash);
  if (!passwordMatch) {
    const err = new Error('Incorrect current password. Identity verification failed.');
    err.statusCode = 400;
    throw err;
  }

  // 4. Check for active operational commitments
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (roles.includes('DONOR')) {
      const activePledgesRes = await client.query(
        `SELECT COUNT(*) as count 
         FROM donor_responses dr
         JOIN blood_requests br ON dr.request_id = br.id
         JOIN donor_profiles dp ON dr.donor_id = dp.id
         WHERE dp.user_id = $1 
            AND dr.response_status IN ('ACCEPTED', 'PENDING')
            AND br.status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND')`,
        [userId]
      );
      if (parseInt(activePledgesRes.rows[0].count, 10) > 0) {
        const err = new Error('Cannot delete account while you have active or pending blood request responses. Please coordinate with the assigned coordinator or wait until the request is closed.');
        err.statusCode = 400;
        throw err;
      }

      const scheduledDonationsRes = await client.query(
        `SELECT COUNT(*) as count 
         FROM donations d
         JOIN donor_profiles dp ON d.donor_id = dp.id
         WHERE dp.user_id = $1 AND d.status = 'SCHEDULED'`,
        [userId]
      );
      if (parseInt(scheduledDonationsRes.rows[0].count, 10) > 0) {
        const err = new Error('Cannot delete account while you have scheduled donations pending completion. Please contact your coordinator.');
        err.statusCode = 400;
        throw err;
      }
    }

    if (roles.includes('RECEIVER')) {
      const activeRequestsRes = await client.query(
        `SELECT COUNT(*) as count 
         FROM blood_requests 
         WHERE created_by_user_id = $1 
           AND status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND')`,
        [userId]
      );
      if (parseInt(activeRequestsRes.rows[0].count, 10) > 0) {
        const err = new Error('Cannot delete account while you have active ongoing blood requests. Please cancel or fulfill your open requests first.');
        err.statusCode = 400;
        throw err;
      }
    }

    // 5. Safely deactivate account and invalidate all sessions
    await client.query(
      `UPDATE users 
       SET status = 'DEACTIVATED', 
           deleted_at = CURRENT_TIMESTAMP, 
           deletion_reason = $1, 
           token_version = token_version + 1, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [reason.trim(), userId]
    );

    if (roles.includes('DONOR')) {
      await client.query(
        `UPDATE donor_profiles 
         SET availability_status = 'NOT_AVAILABLE', updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = $1`,
        [userId]
      );
    }

    await client.query(
      `UPDATE password_reset_tokens 
       SET used_at = CURRENT_TIMESTAMP 
       WHERE user_id = $1 AND used_at IS NULL`,
      [userId]
    );
    await client.query(
      `DELETE FROM user_verifications WHERE user_id = $1`,
      [userId]
    );

    // 6. Audit logging (never logging the password)
    await client.query(
      `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'ACCOUNT_DEACTIVATED_BY_USER', 'USER', $1, $2)`,
      [userId, JSON.stringify({ reason: reason.trim(), roles, timestamp: new Date().toISOString() })]
    );

    await client.query('COMMIT');
    return {
      success: true,
      message: 'Your account has been successfully deleted and deactivated. All active sessions have been terminated.'
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}


export async function sendVerificationCode(userId, method) {
  if (!['EMAIL', 'SMS'].includes(method)) {
    const err = new Error('Invalid verification method. Select EMAIL or SMS.');
    err.statusCode = 400;
    throw err;
  }

  // 1. Verify user exists and is not already verified
  const user = await authRepository.getUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  if (user.is_verified) {
    const err = new Error('Account is already verified.');
    err.statusCode = 400;
    throw err;
  }

  // 2. If SMS method is selected, check provider configuration
  if (method === 'SMS') {
    const smsProvider = process.env.SMS_PROVIDER;
    if (!smsProvider) {
      const err = new Error('SMS verification is not configured in this environment.');
      err.statusCode = 400;
      throw err;
    }
  }

  // 3. Check for existing verification transaction and verify resend cooldown
  const existingVer = await authRepository.getUserVerification(userId);
  if (existingVer && existingVer.cooldown_until) {
    const cooldownTime = new Date(existingVer.cooldown_until).getTime();
    const nowTime = Date.now();
    if (cooldownTime > nowTime) {
      const secondsLeft = Math.ceil((cooldownTime - nowTime) / 1000);
      const err = new Error(`Please wait ${secondsLeft} second(s) before requesting another code.`);
      err.statusCode = 429;
      err.code = 'COOLDOWN_ACTIVE';
      err.cooldown_seconds = secondsLeft;
      throw err;
    }
  }

  // 4. Generate 6-digit numeric code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  
  // 5. Hash the code using SHA-256 for secure storage
  const otpHash = crypto.createHash('sha256').update(code).digest('hex');

  // 6. Set expiration (10 minutes) and cooldown (60 seconds)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const cooldownUntil = new Date(Date.now() + 60 * 1000);

  // 7. Upsert verification transaction
  await authRepository.upsertUserVerification(userId, method, otpHash, expiresAt, cooldownUntil);

  // 8. Deliver verification code
  try {
    if (method === 'EMAIL') {
      await notificationService.sendVerificationCodeEmail(user, code);
    } else {
      await notificationService.sendVerificationCodeSMS(user, code);
    }
  } catch (error) {
    const err = new Error(`Verification service is temporarily unavailable: ${error.message}`);
    err.statusCode = 503;
    throw err;
  }

  return { cooldown_seconds: 60 };
}

export async function verifyCode(userId, code) {
  if (!code || code.length !== 6) {
    const err = new Error('Invalid verification code format. Code must be 6 digits.');
    err.statusCode = 400;
    throw err;
  }

  // 1. Verify user exists and is not already verified
  const user = await authRepository.getUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  if (user.is_verified) {
    const err = new Error('Account is already verified.');
    err.statusCode = 400;
    throw err;
  }

  // 2. Fetch active verification transaction
  const ver = await authRepository.getUserVerification(userId);
  if (!ver) {
    const err = new Error('No active verification transaction found. Please request a new code.');
    err.statusCode = 400;
    throw err;
  }

  // 3. Check attempts limit (e.g. max 5 attempts)
  const MAX_ATTEMPTS = 5;
  if (ver.attempts >= MAX_ATTEMPTS) {
    const err = new Error('Too many incorrect verification attempts. Please request a new code.');
    err.statusCode = 400;
    err.code = 'ATTEMPTS_EXCEEDED';
    throw err;
  }

  // 4. Check expiration
  const expiresAtTime = new Date(ver.expires_at).getTime();
  if (expiresAtTime < Date.now()) {
    const err = new Error('Verification code has expired. Please request a new one.');
    err.statusCode = 400;
    err.code = 'OTP_EXPIRED';
    throw err;
  }

  // 5. Increment attempts in the DB
  const attempts = await authRepository.incrementVerificationAttempts(userId);

  // 6. Validate the code by comparing hashes
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  if (codeHash !== ver.otp_hash) {
    const attemptsRemaining = Math.max(0, MAX_ATTEMPTS - attempts);
    const err = new Error(`Incorrect verification code. ${attemptsRemaining} attempt(s) remaining.`);
    err.statusCode = 400;
    err.code = 'INVALID_CODE';
    err.attempts_remaining = attemptsRemaining;
    throw err;
  }

  // 7. Successful verification: toggle flag and clean up verification record
  await authRepository.setUserVerified(userId);
  await authRepository.deleteUserVerification(userId);

  // 8. Generate refreshed token including the is_verified status and current roles
  const roles = await authRepository.getUserRoles(userId);
  const secret = process.env.JWT_SECRET;
  const token = jwt.sign(
    { id: userId, roles, is_verified: true, token_version: user.token_version },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  return {
    token,
    user: {
      id: userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      is_verified: true,
      roles
    }
  };
}
