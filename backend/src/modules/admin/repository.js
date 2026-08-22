import pool from '../../database/connection.js';

export async function getActiveStaff() {
  const adminsRes = await pool.query(`
    SELECT u.id, u.name, u.email 
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    WHERE (ur.role = 'SUPER_ADMIN' OR ur.role = 'ADMIN') AND u.status = 'ACTIVE'
    ORDER BY u.name ASC
  `);
  
  const coordinatorsRes = await pool.query(`
    SELECT u.id, u.name, u.email 
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    WHERE ur.role = 'COORDINATOR' AND u.status = 'ACTIVE'
    ORDER BY u.name ASC
  `);
  
  return {
    admins: adminsRes.rows,
    coordinators: coordinatorsRes.rows
  };
}

export async function getSystemStats() {
  const queries = {
    totalDonors: 'SELECT COUNT(*) FROM donor_profiles',
    totalReceivers: 'SELECT COUNT(*) FROM receiver_profiles',
    activeCoordinators: `
      SELECT COUNT(*) FROM coordinator_profiles cp 
      JOIN users u ON cp.user_id = u.id 
      WHERE cp.status = 'ACTIVE' AND u.status = 'ACTIVE'
    `,
    activeAdmins: `
      SELECT COUNT(*) FROM user_roles ur 
      JOIN users u ON ur.user_id = u.id 
      WHERE ur.role IN ('SUPER_ADMIN', 'ADMIN') AND u.status = 'ACTIVE'
    `,
    inactiveAdmins: `
      SELECT COUNT(*) FROM user_roles ur 
      JOIN users u ON ur.user_id = u.id 
      WHERE ur.role IN ('SUPER_ADMIN', 'ADMIN') AND u.status = 'INACTIVE'
    `,
    pendingVerifications: `
      SELECT COUNT(*) FROM internal_invitations 
      WHERE status = 'VERIFICATION_SUBMITTED'
    `,
    activeRequests: `
      SELECT COUNT(*) FROM blood_requests 
      WHERE status IN ('PENDING', 'APPROVED', 'DONORS_ALERTED', 'DONOR_RESPONDED', 'COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED')
    `,
    pendingResponses: `
      SELECT COUNT(*) FROM donor_responses dr
      JOIN blood_requests br ON dr.request_id = br.id
      WHERE dr.response_status = 'ACCEPTED' AND br.status = 'DONOR_RESPONDED'
    `,
    visitsCoordination: `
      SELECT COUNT(*) FROM blood_requests 
      WHERE status = 'COORDINATOR_ASSIGNED'
    `,
    donationsRecorded: 'SELECT COUNT(*) FROM donations WHERE status = \'COMPLETED\'',
    completedRequests: "SELECT COUNT(*) FROM blood_requests WHERE status = 'FULFILLED'",
    cancelledRequests: "SELECT COUNT(*) FROM blood_requests WHERE status = 'CANCELLED'",
    
    // Lifecycle metrics
    pendingInvitations: "SELECT COUNT(*) FROM internal_invitations WHERE status = 'INVITED' AND expires_at > CURRENT_TIMESTAMP",
    emailIssues: "SELECT COUNT(*) FROM internal_invitations WHERE email_status = 'FAILED'",
    awaitingVerification: "SELECT COUNT(*) FROM internal_invitations WHERE status = 'VERIFICATION_SUBMITTED'",
    underReview: "SELECT COUNT(*) FROM internal_invitations WHERE status = 'UNDER_REVIEW'",
    awaitingActivation: `
      SELECT COUNT(*) FROM internal_invitations ii 
      JOIN users u ON ii.email = u.email 
      WHERE ii.status = 'APPROVED' AND u.status = 'INACTIVE'
    `,

    // Coordinator Specific stats for Admin Dashboard
    coordinatorsAvailable: `
      SELECT COUNT(*) FROM coordinator_profiles cp 
      JOIN users u ON cp.user_id = u.id 
      WHERE cp.availability_status = 'AVAILABLE' AND cp.status = 'ACTIVE' AND u.status = 'ACTIVE'
    `,
    coordinatorsBusy: `
      SELECT COUNT(*) FROM coordinator_profiles cp 
      JOIN users u ON cp.user_id = u.id 
      WHERE cp.availability_status = 'BUSY' AND cp.status = 'ACTIVE' AND u.status = 'ACTIVE'
    `,
    coordinatorsOffline: `
      SELECT COUNT(*) FROM coordinator_profiles cp 
      JOIN users u ON cp.user_id = u.id 
      WHERE cp.availability_status = 'OFFLINE' AND cp.status = 'ACTIVE' AND u.status = 'ACTIVE'
    `,
    requestsBeingCoordinated: `
      SELECT COUNT(*) FROM blood_requests 
      WHERE status IN ('COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED')
    `,
    donationsCoordinatedToday: `
      SELECT COUNT(*) FROM donations 
      WHERE donation_date = CURRENT_DATE AND status = 'COMPLETED'
    `
  };

  const results = {};
  for (const [key, sql] of Object.entries(queries)) {
    const res = await pool.query(sql);
    results[key] = parseInt(res.rows[0].count, 10);
  }
  return results;
}

export async function getStaffList() {
  const staffRes = await pool.query(`
    SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at, u.last_login_at, u.first_login_at,
           ARRAY_AGG(ur.role) as roles,
           cp.id as coordinator_profile_id, cp.area as coordinator_area, cp.district as coordinator_district, cp.state as coordinator_state,
           cp.availability_status as coordinator_availability, cp.last_active_at as coordinator_last_active,
           (
             SELECT COUNT(DISTINCT ra.request_id) FROM request_assignments ra
             JOIN blood_requests br ON ra.request_id = br.id
             WHERE ra.coordinator_id = cp.id
               AND ra.status IN ('ASSIGNED', 'IN_PROGRESS')
               AND br.status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND')
           ) as active_cases_count,
           (
             SELECT COUNT(DISTINCT ra.request_id) FROM request_assignments ra
             JOIN blood_requests br ON ra.request_id = br.id
             WHERE ra.coordinator_id = cp.id
               AND (ra.status = 'COMPLETED' OR br.status = 'FULFILLED')
           ) as completed_cases_count
    FROM users u
     JOIN user_roles ur ON u.id = ur.user_id
     LEFT JOIN coordinator_profiles cp ON u.id = cp.user_id AND cp.status = 'ACTIVE'
     WHERE ur.role IN ('SUPER_ADMIN', 'ADMIN', 'COORDINATOR', 'BLOOD_BANK_ADMIN')
     GROUP BY u.id, cp.id, cp.area, cp.district, cp.state, cp.availability_status, cp.last_active_at
     ORDER BY u.created_at DESC
  `);
  return staffRes.rows;
}

export async function getInvitationsList() {
  const res = await pool.query(`
    SELECT ii.id, ii.email, ii.name, ii.role, ii.status, ii.expires_at, ii.verification_data, ii.created_at, ii.accepted_by,
           ii.email_status, ii.sent_at, ii.failed_at, ii.failure_reason, ii.provider_message_id,
           ii.link_opened_at, ii.accepted_at, ii.verification_submitted_at, ii.reviewed_at, ii.reviewed_by,
           ii.activated_at, ii.activated_by, ii.revoked_at, ii.revoked_by, ii.deactivated_at, ii.deactivated_by, ii.rejection_reason,
           ii.deleted_at, ii.deleted_by, u_del.name as deleted_by_name
    FROM internal_invitations ii
    LEFT JOIN users u_del ON ii.deleted_by = u_del.id
    ORDER BY ii.created_at DESC
  `);
  return res.rows;
}

export async function updateInvitationDeletion(id, deletedBy) {
  await pool.query(
    `UPDATE internal_invitations 
     SET status = 'DELETED', deleted_at = CURRENT_TIMESTAMP, deleted_by = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2`,
    [deletedBy, id]
  );
}

export async function createInvitation(name, email, role, tokenHash, expiresAt, creatorId) {
  const result = await pool.query(
    `INSERT INTO internal_invitations (name, email, role, token_hash, expires_at, created_by, email_status)
     VALUES ($1, $2, $3, $4, $5, $6, 'NOT_SENT')
     RETURNING id, name, email, role, status, expires_at`,
    [name, email, role, tokenHash, expiresAt, creatorId]
  );
  return result.rows[0];
}

export async function getInvitationById(id) {
  const res = await pool.query('SELECT * FROM internal_invitations WHERE id = $1', [id]);
  return res.rows[0];
}

export async function getInvitationByTokenHash(tokenHash) {
  const res = await pool.query('SELECT * FROM internal_invitations WHERE token_hash = $1', [tokenHash]);
  return res.rows[0];
}

export async function updateInvitationStatus(id, status) {
  await pool.query(
    'UPDATE internal_invitations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [status, id]
  );
}

export async function updateInvitationEmailStatus(id, emailStatus, sentAt, failedAt, failureReason, providerMessageId) {
  await pool.query(
    `UPDATE internal_invitations 
     SET email_status = $1, sent_at = $2, failed_at = $3, failure_reason = $4, provider_message_id = $5, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $6`,
    [emailStatus, sentAt, failedAt, failureReason, providerMessageId, id]
  );
}

export async function updateInvitationLinkOpened(id) {
  await pool.query(
    `UPDATE internal_invitations 
     SET link_opened_at = COALESCE(link_opened_at, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP 
     WHERE id = $1`,
    [id]
  );
}

export async function updateInvitationAcceptance(id, acceptedBy, status) {
  await pool.query(
    `UPDATE internal_invitations 
     SET accepted_by = $1, status = $2, accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $3`,
    [acceptedBy, status, id]
  );
}

export async function updateInvitationVerificationSubmitted(id, verificationData) {
  await pool.query(
    `UPDATE internal_invitations 
     SET status = 'VERIFICATION_SUBMITTED', verification_data = $1, verification_submitted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2`,
    [verificationData, id]
  );
}

export async function updateInvitationStatusAndReview(id, status, reviewedAt, reviewedBy, rejectionReason) {
  await pool.query(
    `UPDATE internal_invitations 
     SET status = $1, reviewed_at = $2, reviewed_by = $3, rejection_reason = $4, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $5`,
    [status, reviewedAt, reviewedBy, rejectionReason, id]
  );
}

export async function updateInvitationActivation(id, activatedAt, activatedBy) {
  await pool.query(
    `UPDATE internal_invitations 
     SET activated_at = $1, activated_by = $2, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $3`,
    [activatedAt, activatedBy, id]
  );
}

export async function updateInvitationDeactivation(id, deactivatedAt, deactivatedBy) {
  await pool.query(
    `UPDATE internal_invitations 
     SET deactivated_at = $1, deactivated_by = $2, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $3`,
    [deactivatedAt, deactivatedBy, id]
  );
}

export async function updateInvitationRevocation(id, revokedBy) {
  await pool.query(
    `UPDATE internal_invitations 
     SET status = 'REVOKED', revoked_at = CURRENT_TIMESTAMP, revoked_by = $1, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $2`,
    [revokedBy, id]
  );
}

export async function updateInvitationReissue(id, tokenHash, expiresAt, status) {
  await pool.query(
    `UPDATE internal_invitations 
     SET token_hash = $1, expires_at = $2, status = $3, email_status = 'NOT_SENT', 
         link_opened_at = NULL, accepted_at = NULL, verification_submitted_at = NULL, 
         reviewed_at = NULL, reviewed_by = NULL, activated_at = NULL, activated_by = NULL, 
         rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP 
     WHERE id = $4`,
    [tokenHash, expiresAt, status, id]
  );
}

export async function getInvitationByEmail(email) {
  const res = await pool.query('SELECT * FROM internal_invitations WHERE email = $1', [email]);
  return res.rows[0];
}

export async function updateUserStatus(userId, status) {
  await pool.query(
    'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [status, userId]
  );
}

export async function countActiveAdmins() {
  const res = await pool.query(`
    SELECT COUNT(*) FROM user_roles ur
    JOIN users u ON ur.user_id = u.id
    WHERE ur.role IN ('SUPER_ADMIN', 'ADMIN') AND u.status = 'ACTIVE'
  `);
  return parseInt(res.rows[0].count, 10);
}

export async function getAuditLogs({ limit = 10, offset = 0, search = '', action = '', actor = '', category = '', entityType = '', dateFrom = null, dateTo = null }) {
  const queryParams = [];
  const whereClauses = [];

  whereClauses.push("a.status = 'ACTIVE'");

  if (action) {
    queryParams.push(action);
    whereClauses.push(`a.action = $${queryParams.length}`);
  }

  if (actor) {
    if (actor === 'system') {
      whereClauses.push(`a.actor_id IS NULL`);
    } else {
      queryParams.push(actor);
      whereClauses.push(`a.actor_id = $${queryParams.length}`);
    }
  }

  if (category) {
    const categoryActions = {
      'Coordinator': [
        'COORDINATOR_ACTIVATED', 'COORDINATOR_DEACTIVATED', 'COORDINATOR_VERIFICATION_SUBMITTED',
        'COORDINATOR_VERIFICATION_APPROVED', 'COORDINATOR_VERIFICATION_REJECTED'
      ],
      'Request': [
        'RECEIVER_REQUEST_CREATED', 'RECEIVER_REQUEST_CANCELLED', 'ADMIN_ASSIGNED_COORDINATOR',
        'ADMIN_REASSIGNED_COORDINATOR', 'ADMIN_CANCELLED_REQUEST'
      ],
      'Donation': [
        'DONATION_COMPLETED'
      ],
      'Administrator': [
        'ADMIN_ACCOUNT_ACTIVATED', 'ADMIN_ACCOUNT_DEACTIVATED', 'BOOTSTRAP_ADMIN'
      ],
      'Invitation': [
        'ADMIN_INVITATION_CREATED', 'COORDINATOR_INVITED', 'ADMIN_INVITATION_EMAIL_SENT',
        'COORDINATOR_EMAIL_SENT', 'ADMIN_INVITATION_EMAIL_FAILED', 'COORDINATOR_EMAIL_FAILED',
        'ADMIN_INVITATION_OPENED', 'COORDINATOR_INVITATION_OPENED', 'ADMIN_INVITATION_ACCEPTED',
        'COORDINATOR_INVITATION_ACCEPTED', 'ADMIN_INVITATION_DELETED', 'COORDINATOR_INVITATION_DELETED',
        'ADMIN_INVITATION_REVOKED'
      ],
      'Notification': [
        'ADMIN_SENT_REMINDER', 'ADMIN_SENT_EMERGENCY_NOTIFICATION', 'ADMIN_DELETED_NOTIFICATION'
      ],
      'Authentication': [
        'ADMIN_LOGIN', 'ADMIN_FIRST_LOGIN'
      ]
    };
    
    const actions = categoryActions[category] || [];
    if (actions.length > 0) {
      const placeholders = actions.map(act => {
        queryParams.push(act);
        return `$${queryParams.length}`;
      }).join(', ');
      whereClauses.push(`a.action IN (${placeholders})`);
    } else {
      whereClauses.push('1 = 0');
    }
  }

  if (entityType) {
    queryParams.push(entityType);
    whereClauses.push(`a.entity_type = $${queryParams.length}`);
  }

  if (dateFrom) {
    queryParams.push(dateFrom);
    whereClauses.push(`a.created_at >= $${queryParams.length}`);
  }

  if (dateTo) {
    queryParams.push(dateTo);
    whereClauses.push(`a.created_at <= $${queryParams.length}`);
  }

  if (search) {
    queryParams.push(`%${search}%`);
    const searchIdx = queryParams.length;
    whereClauses.push(`(
      u.name ILIKE $${searchIdx} OR
      u.email ILIKE $${searchIdx} OR
      a.action ILIKE $${searchIdx} OR
      a.entity_type ILIKE $${searchIdx} OR
      a.entity_id::text ILIKE $${searchIdx} OR
      a.metadata::text ILIKE $${searchIdx}
    )`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  queryParams.push(limit);
  const limitIdx = queryParams.length;
  queryParams.push(offset);
  const offsetIdx = queryParams.length;

  const sql = `
    SELECT a.id, a.action, a.entity_type, a.entity_id, a.metadata, a.created_at,
           u.name as actor_name, u.email as actor_email
    FROM audit_logs a
    LEFT JOIN users u ON a.actor_id = u.id
    ${whereSql}
    ORDER BY a.created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const res = await pool.query(sql, queryParams);
  return res.rows;
}

export async function getAuditLogsCount({ search = '', action = '', actor = '', category = '', entityType = '', dateFrom = null, dateTo = null }) {
  const queryParams = [];
  const whereClauses = [];

  whereClauses.push("a.status = 'ACTIVE'");

  if (action) {
    queryParams.push(action);
    whereClauses.push(`a.action = $${queryParams.length}`);
  }

  if (actor) {
    if (actor === 'system') {
      whereClauses.push(`a.actor_id IS NULL`);
    } else {
      queryParams.push(actor);
      whereClauses.push(`a.actor_id = $${queryParams.length}`);
    }
  }

  if (category) {
    const categoryActions = {
      'Coordinator': [
        'COORDINATOR_ACTIVATED', 'COORDINATOR_DEACTIVATED', 'COORDINATOR_VERIFICATION_SUBMITTED',
        'COORDINATOR_VERIFICATION_APPROVED', 'COORDINATOR_VERIFICATION_REJECTED'
      ],
      'Request': [
        'RECEIVER_REQUEST_CREATED', 'RECEIVER_REQUEST_CANCELLED', 'ADMIN_ASSIGNED_COORDINATOR',
        'ADMIN_REASSIGNED_COORDINATOR', 'ADMIN_CANCELLED_REQUEST'
      ],
      'Donation': [
        'DONATION_COMPLETED'
      ],
      'Administrator': [
        'ADMIN_ACCOUNT_ACTIVATED', 'ADMIN_ACCOUNT_DEACTIVATED', 'BOOTSTRAP_ADMIN'
      ],
      'Invitation': [
        'ADMIN_INVITATION_CREATED', 'COORDINATOR_INVITED', 'ADMIN_INVITATION_EMAIL_SENT',
        'COORDINATOR_EMAIL_SENT', 'ADMIN_INVITATION_EMAIL_FAILED', 'COORDINATOR_EMAIL_FAILED',
        'ADMIN_INVITATION_OPENED', 'COORDINATOR_INVITATION_OPENED', 'ADMIN_INVITATION_ACCEPTED',
        'COORDINATOR_INVITATION_ACCEPTED', 'ADMIN_INVITATION_DELETED', 'COORDINATOR_INVITATION_DELETED',
        'ADMIN_INVITATION_REVOKED'
      ],
      'Notification': [
        'ADMIN_SENT_REMINDER', 'ADMIN_SENT_EMERGENCY_NOTIFICATION', 'ADMIN_DELETED_NOTIFICATION'
      ],
      'Authentication': [
        'ADMIN_LOGIN', 'ADMIN_FIRST_LOGIN'
      ]
    };
    
    const actions = categoryActions[category] || [];
    if (actions.length > 0) {
      const placeholders = actions.map(act => {
        queryParams.push(act);
        return `$${queryParams.length}`;
      }).join(', ');
      whereClauses.push(`a.action IN (${placeholders})`);
    } else {
      whereClauses.push('1 = 0');
    }
  }

  if (entityType) {
    queryParams.push(entityType);
    whereClauses.push(`a.entity_type = $${queryParams.length}`);
  }

  if (dateFrom) {
    queryParams.push(dateFrom);
    whereClauses.push(`a.created_at >= $${queryParams.length}`);
  }

  if (dateTo) {
    queryParams.push(dateTo);
    whereClauses.push(`a.created_at <= $${queryParams.length}`);
  }

  if (search) {
    queryParams.push(`%${search}%`);
    const searchIdx = queryParams.length;
    whereClauses.push(`(
      u.name ILIKE $${searchIdx} OR
      u.email ILIKE $${searchIdx} OR
      a.action ILIKE $${searchIdx} OR
      a.entity_type ILIKE $${searchIdx} OR
      a.entity_id::text ILIKE $${searchIdx} OR
      a.metadata::text ILIKE $${searchIdx}
    )`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sql = `
    SELECT COUNT(*) 
    FROM audit_logs a
    LEFT JOIN users u ON a.actor_id = u.id
    ${whereSql}
  `;

  const res = await pool.query(sql, queryParams);
  return parseInt(res.rows[0].count, 10);
}

export async function writeAuditLog(actorId, action, entityType, entityId, metadata, client = pool) {
  await client.query(
    `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [actorId, action, entityType, entityId, metadata ? JSON.stringify(metadata) : null]
  );
}

export async function deleteAuditLogs(ids, deletedBy, client = pool) {
  const res = await client.query(
    `UPDATE audit_logs
     SET status = 'DELETED', deleted_at = CURRENT_TIMESTAMP, deleted_by = $1
     WHERE id = ANY($2) AND status = 'ACTIVE' AND action != 'ADMIN_DELETED_AUDIT_LOGS'
     RETURNING id`,
    [deletedBy, ids]
  );
  return res.rows.map(row => row.id);
}

export async function getCoordinatorStats(userId, coordinatorProfileId) {
  const stats = {
    requestsReviewed: 0,
    responsesHandled: 0,
    visitsCoordinated: 0,
    donationsRecorded: 0,
    requestsCompleted: 0,
    requestsCancelled: 0,
    lastActivityAt: null
  };

  // Donations verified count
  const donationsRes = await pool.query(
    "SELECT COUNT(*) FROM donations WHERE verified_by = $1 AND status = 'COMPLETED'",
    [userId]
  );
  stats.donationsRecorded = parseInt(donationsRes.rows[0].count, 10);

  // Completed request assignments count
  if (coordinatorProfileId) {
    const completedAssignmentsRes = await pool.query(
      `SELECT COUNT(DISTINCT ra.id) FROM request_assignments ra
       JOIN blood_requests br ON ra.request_id = br.id
       WHERE ra.coordinator_id = $1 AND (ra.status = 'COMPLETED' OR br.status = 'FULFILLED')`,
      [coordinatorProfileId]
    );
    stats.requestsCompleted = parseInt(completedAssignmentsRes.rows[0].count, 10);

    // Cancelled requests assigned to coordinator
    const cancelledRequestsRes = await pool.query(
      `SELECT COUNT(DISTINCT ra.request_id) FROM request_assignments ra
       JOIN blood_requests br ON ra.request_id = br.id
       WHERE ra.coordinator_id = $1 AND br.status = 'CANCELLED'`,
      [coordinatorProfileId]
    );
    stats.requestsCancelled = parseInt(cancelledRequestsRes.rows[0].count, 10);
  }

  // Audit actions distinct counts to prevent reload double-counting
  const reqReviewedRes = await pool.query(
    `SELECT COUNT(DISTINCT entity_id) FROM audit_logs 
     WHERE actor_id = $1 AND action IN ('COORDINATOR_VIEWED_REQUEST', 'COORDINATOR_REVIEWED_REQUEST')`,
    [userId]
  );
  stats.requestsReviewed = parseInt(reqReviewedRes.rows[0].count, 10);

  const respHandledRes = await pool.query(
    `SELECT COUNT(DISTINCT entity_id) FROM audit_logs 
     WHERE actor_id = $1 AND action IN ('COORDINATOR_REVIEWED_DONOR', 'COORDINATOR_CONTACTED_DONOR')`,
    [userId]
  );
  stats.responsesHandled = parseInt(respHandledRes.rows[0].count, 10);

  const visitsRes = await pool.query(
    `SELECT COUNT(DISTINCT entity_id) FROM audit_logs 
     WHERE actor_id = $1 AND action = 'COORDINATOR_CONFIRMED_VISIT'`,
    [userId]
  );
  stats.visitsCoordinated = parseInt(visitsRes.rows[0].count, 10);

  // Last activity timestamp
  const lastActivityRes = await pool.query(
    "SELECT created_at FROM audit_logs WHERE actor_id = $1 ORDER BY created_at DESC LIMIT 1",
    [userId]
  );
  if (lastActivityRes.rows.length > 0) {
    stats.lastActivityAt = lastActivityRes.rows[0].created_at;
  }

  return stats;
}

export async function getCoordinatorRecentActivity(userId) {
  const res = await pool.query(
    `SELECT action, created_at, metadata FROM audit_logs 
     WHERE actor_id = $1 AND action LIKE 'COORDINATOR_%'
     ORDER BY created_at DESC 
     LIMIT 5`,
    [userId]
  );
  return res.rows;
}

export async function getCoordinatorActiveCoordination(coordinatorProfileId) {
  if (!coordinatorProfileId) return [];
  const res = await pool.query(
    `SELECT ra.id as assignment_id, br.id as request_id, br.required_units, br.patient_name, br.location, 
            br.status as request_status, bg.code as blood_group, ra.status as assignment_status, ra.assigned_at
     FROM request_assignments ra
     JOIN blood_requests br ON ra.request_id = br.id
     JOIN blood_groups bg ON br.blood_group_id = bg.id
     WHERE ra.coordinator_id = $1 AND ra.status IN ('ASSIGNED', 'IN_PROGRESS')
       AND br.status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND')
     ORDER BY ra.assigned_at DESC`,
    [coordinatorProfileId]
  );
  return res.rows;
}

export async function getCoordinatorDonationHistory(userId) {
  const res = await pool.query(
    `SELECT d.id as donation_id, d.donation_date, d.status as donation_status, d.units, bg.code as blood_group, br.patient_name, br.id as request_id, u.name as donor_name
     FROM donations d
     JOIN blood_groups bg ON d.blood_group_id = bg.id
     LEFT JOIN blood_requests br ON d.request_id = br.id
     JOIN donor_profiles dp ON d.donor_id = dp.id
     JOIN users u ON dp.user_id = u.id
     WHERE d.verified_by = $1
     ORDER BY d.donation_date DESC, d.created_at DESC
     LIMIT 10`,
     [userId]
  );
  return res.rows;
}

export async function getCoordinatorAuditHistory(userId) {
  const res = await pool.query(
    `SELECT id, action, entity_type, entity_id, metadata, created_at
     FROM audit_logs
     WHERE actor_id = $1
     ORDER BY created_at DESC
     LIMIT 30`,
    [userId]
  );
  return res.rows;
}

export async function getDonorsList(search, bloodGroup, availability, sort) {
  let query = `
    SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at, u.last_login_at,
           dp.id as donor_profile_id, dp.availability_status, dp.eligibility_status, dp.last_donation_date, dp.area, dp.district,
           bg.code as blood_group,
           (SELECT COUNT(*) FROM donations d WHERE d.donor_id = dp.id AND d.status = 'COMPLETED') as donations_count
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id AND ur.role = 'DONOR'
    JOIN donor_profiles dp ON u.id = dp.user_id
    JOIN blood_groups bg ON dp.blood_group_id = bg.id
  `;
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR bg.code ILIKE $${params.length})`);
  }

  if (bloodGroup) {
    params.push(bloodGroup);
    conditions.push(`bg.code = $${params.length}`);
  }

  if (availability) {
    params.push(availability);
    conditions.push(`dp.availability_status = $${params.length}`);
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ');
  }

  if (sort === 'recently_donated') {
    query += ` ORDER BY dp.last_donation_date DESC NULLS LAST, u.created_at DESC`;
  } else if (sort === 'most_donations') {
    query += ` ORDER BY donations_count DESC, u.created_at DESC`;
  } else {
    query += ` ORDER BY u.created_at DESC`;
  }

  const res = await pool.query(query, params);
  return res.rows;
}

export async function getDonorAccountAndProfile(donorUserId) {
  const res = await pool.query(
    `SELECT u.id, u.name, u.email, u.phone, u.status, u.created_at, u.last_login_at, u.first_login_at,
            dp.id as donor_profile_id, dp.gender, dp.date_of_birth, dp.address, dp.area, dp.district, dp.state, dp.pincode,
            dp.availability_status, dp.eligibility_status, dp.last_donation_date, bg.code as blood_group,
            (SELECT COUNT(*) FROM donations d WHERE d.donor_id = dp.id AND d.status = 'COMPLETED') as donations_count
     FROM users u
     JOIN donor_profiles dp ON u.id = dp.user_id
     JOIN blood_groups bg ON dp.blood_group_id = bg.id
     WHERE u.id = $1`,
    [donorUserId]
  );
  return res.rows[0];
}

export async function getDonorDonationHistory(donorProfileId) {
  const res = await pool.query(
    `SELECT d.id, d.donation_date, d.units, d.status, bg.code as blood_group,
            br.patient_name, br.hospital_name, u_ver.name as verified_by_name
     FROM donations d
     JOIN blood_groups bg ON d.blood_group_id = bg.id
     LEFT JOIN blood_requests br ON d.request_id = br.id
     LEFT JOIN users u_ver ON d.verified_by = u_ver.id
     WHERE d.donor_id = $1
     ORDER BY d.donation_date DESC, d.created_at DESC`,
    [donorProfileId]
  );
  return res.rows;
}

export async function getDonorResponsesHistory(donorProfileId) {
  const res = await pool.query(
    `SELECT dr.response_status, dr.responded_at, dr.notes,
            br.id as request_id, br.patient_name, br.hospital_name, bg.code as blood_group
     FROM donor_responses dr
     JOIN blood_requests br ON dr.request_id = br.id
     JOIN blood_groups bg ON br.blood_group_id = bg.id
     WHERE dr.donor_id = $1
     ORDER BY dr.responded_at DESC`,
    [donorProfileId]
  );
  return res.rows;
}

export async function getRequestsList({ search, bloodGroup, urgency, status, location, dateFrom, dateTo, sort }) {
  let query = `
    SELECT br.id, br.required_units, br.patient_name, br.hospital_name, br.hospital_address, br.location,
           br.required_date_time, br.urgency_level, br.status, br.created_at, br.closed_at,
           bg.code as blood_group,
           rp.name as receiver_name,
           (br.status = 'DONOR_RESPONDED' AND (ra.id IS NULL OR ra.assigned_at < CURRENT_TIMESTAMP - INTERVAL '2 hours')) as requires_attention
    FROM blood_requests br
    JOIN blood_groups bg ON br.blood_group_id = bg.id
    LEFT JOIN receiver_profiles rp ON br.receiver_id = rp.id
    LEFT JOIN request_assignments ra ON br.id = ra.request_id AND ra.status = 'ASSIGNED'
  `;
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(br.patient_name ILIKE $${params.length} OR br.hospital_name ILIKE $${params.length} OR br.location ILIKE $${params.length} OR bg.code ILIKE $${params.length})`);
  }

  if (bloodGroup) {
    params.push(bloodGroup);
    conditions.push(`bg.code = $${params.length}`);
  }

  if (urgency) {
    params.push(urgency);
    conditions.push(`br.urgency_level = $${params.length}`);
  }

  if (status) {
    params.push(status);
    conditions.push(`br.status = $${params.length}`);
  }

  if (location) {
    params.push(`%${location}%`);
    conditions.push(`(br.location ILIKE $${params.length} OR br.hospital_address ILIKE $${params.length})`);
  }

  if (dateFrom) {
    params.push(dateFrom);
    conditions.push(`br.required_date_time >= $${params.length}`);
  }

  if (dateTo) {
    params.push(dateTo);
    conditions.push(`br.required_date_time <= $${params.length}`);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  if (sort === 'oldest') {
    query += ` ORDER BY br.created_at ASC`;
  } else if (sort === 'emergency_first') {
    query += ` ORDER BY CASE WHEN br.urgency_level = 'EMERGENCY' THEN 0 WHEN br.urgency_level = 'URGENT' THEN 1 ELSE 2 END, br.created_at DESC`;
  } else if (sort === 'recently_updated') {
    query += ` ORDER BY br.updated_at DESC`;
  } else {
    query += ` ORDER BY br.created_at DESC`;
  }

  const res = await pool.query(query, params);
  return res.rows;
}

export async function getRequestDetailsById(requestId) {
  const res = await pool.query(
    `SELECT br.id, br.required_units, br.patient_name, br.hospital_name, br.hospital_address, br.location,
            br.required_date_time, br.urgency_level, br.status, br.description, br.created_at, br.closed_at,
            bg.code as blood_group,
            rp.name as receiver_name, rp.phone as receiver_phone, rp.id as receiver_profile_id,
            (br.status = 'DONOR_RESPONDED' AND (ra.id IS NULL OR ra.assigned_at < CURRENT_TIMESTAMP - INTERVAL '2 hours')) as requires_attention
     FROM blood_requests br
     JOIN blood_groups bg ON br.blood_group_id = bg.id
     LEFT JOIN receiver_profiles rp ON br.receiver_id = rp.id
     LEFT JOIN request_assignments ra ON br.id = ra.request_id AND ra.status = 'ASSIGNED'
     WHERE br.id = $1`,
    [requestId]
  );
  return res.rows[0];
}

export async function getRequestActiveAssignment(requestId) {
  const res = await pool.query(
    `SELECT ra.id as assignment_id, ra.status as assignment_status, ra.assigned_at, ra.notes,
            u.name as coordinator_name, u.phone as coordinator_phone, u.email as coordinator_email,
            cp.id as coordinator_profile_id
     FROM request_assignments ra
     JOIN coordinator_profiles cp ON ra.coordinator_id = cp.id
     JOIN users u ON cp.user_id = u.id
     WHERE ra.request_id = $1 AND ra.status IN ('ASSIGNED', 'IN_PROGRESS')
     ORDER BY ra.assigned_at DESC
     LIMIT 1`,
    [requestId]
  );
  return res.rows[0];
}

export async function getCompatibleDonors(bloodGroupCode, requestId) {
  const res = await pool.query(
    `SELECT dp.id as donor_profile_id, dp.user_id, u.name as donor_name, u.email as donor_email, u.phone as donor_phone,
            dp.area, dp.district, dp.availability_status,
            dr.response_status, dr.responded_at, dr.notes as response_notes
     FROM donor_profiles dp
     JOIN users u ON dp.user_id = u.id
     JOIN blood_groups bg ON dp.blood_group_id = bg.id
     LEFT JOIN donor_responses dr ON dp.id = dr.donor_id AND dr.request_id = $2
     WHERE bg.code = $1 AND u.status = 'ACTIVE'
     ORDER BY CASE WHEN dr.response_status = 'ACCEPTED' THEN 0 WHEN dr.response_status = 'NOTIFIED' THEN 1 ELSE 2 END, dp.created_at DESC`,
    [bloodGroupCode, requestId]
  );
  return res.rows;
}

export async function getActiveCoordinators() {
  const res = await pool.query(
    `SELECT cp.id as coordinator_profile_id, u.id as user_id, u.name, u.email, u.phone,
            cp.area, cp.district, cp.availability_status
     FROM coordinator_profiles cp
     JOIN users u ON cp.user_id = u.id
     WHERE cp.status = 'ACTIVE' AND u.status = 'ACTIVE'
     ORDER BY u.name ASC`
  );
  return res.rows;
}

export async function deactivateActiveAssignments(requestId, client = pool) {
  await client.query(
    `UPDATE request_assignments 
     SET status = 'REASSIGNED', completed_at = CURRENT_TIMESTAMP 
     WHERE request_id = $1 AND status IN ('ASSIGNED', 'IN_PROGRESS')`,
    [requestId]
  );
}

export async function createAssignment(requestId, coordinatorId, client = pool) {
  await client.query(
    `INSERT INTO request_assignments (request_id, coordinator_id, status)
     VALUES ($1, $2, 'ASSIGNED')`,
    [requestId, coordinatorId]
  );
}

export async function updateRequestStatus(requestId, status, client = pool) {
  await client.query(
    `UPDATE blood_requests 
     SET status = $1::varchar, updated_at = CURRENT_TIMESTAMP, 
         closed_at = CASE WHEN $1::varchar IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND') THEN CURRENT_TIMESTAMP ELSE closed_at END
     WHERE id = $2`,
    [status, requestId]
  );
}

export async function getDonationsList({ page = 1, limit = 10, search = '', bloodGroupId = '', coordinatorId = '' }) {
  const offset = (page - 1) * limit;
  let query = `
    SELECT d.id, d.donation_date, d.units, d.status,
           u_don.name as donor_name, u_don.email as donor_email, u_don.phone as donor_phone,
           bg.code as blood_group,
           br.patient_name, br.hospital_name, br.id as request_id,
           u_coord.name as coordinator_name
    FROM donations d
    JOIN donor_profiles dp ON d.donor_id = dp.id
    JOIN users u_don ON dp.user_id = u_don.id
    JOIN blood_groups bg ON d.blood_group_id = bg.id
    LEFT JOIN blood_requests br ON d.request_id = br.id
    LEFT JOIN users u_coord ON d.verified_by = u_coord.id
    WHERE d.status = 'COMPLETED'
  `;
  const params = [];
  let paramIndex = 1;

  if (search) {
    query += ` AND (
      u_don.name ILIKE $${paramIndex} OR
      br.patient_name ILIKE $${paramIndex} OR
      br.hospital_name ILIKE $${paramIndex} OR
      u_coord.name ILIKE $${paramIndex}
    )`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (bloodGroupId) {
    query += ` AND d.blood_group_id = $${paramIndex}`;
    params.push(parseInt(bloodGroupId, 10));
    paramIndex++;
  }

  if (coordinatorId) {
    query += ` AND d.verified_by = $${paramIndex}`;
    params.push(coordinatorId);
    paramIndex++;
  }

  query += ` ORDER BY d.donation_date DESC, d.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const res = await pool.query(query, params);
  return res.rows;
}

export async function getDonationsCount({ search = '', bloodGroupId = '', coordinatorId = '' }) {
  let query = `
    SELECT COUNT(*) 
    FROM donations d
    JOIN donor_profiles dp ON d.donor_id = dp.id
    JOIN users u_don ON dp.user_id = u_don.id
    JOIN blood_groups bg ON d.blood_group_id = bg.id
    LEFT JOIN blood_requests br ON d.request_id = br.id
    LEFT JOIN users u_coord ON d.verified_by = u_coord.id
    WHERE d.status = 'COMPLETED'
  `;
  const params = [];
  let paramIndex = 1;

  if (search) {
    query += ` AND (
      u_don.name ILIKE $${paramIndex} OR
      br.patient_name ILIKE $${paramIndex} OR
      br.hospital_name ILIKE $${paramIndex} OR
      u_coord.name ILIKE $${paramIndex}
    )`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (bloodGroupId) {
    query += ` AND d.blood_group_id = $${paramIndex}`;
    params.push(parseInt(bloodGroupId, 10));
    paramIndex++;
  }

  if (coordinatorId) {
    query += ` AND d.verified_by = $${paramIndex}`;
    params.push(coordinatorId);
    paramIndex++;
  }

  const res = await pool.query(query, params);
  return parseInt(res.rows[0].count, 10);
}

export async function getDonationMetrics() {
  const queries = {
    totalDonations: `SELECT COUNT(*) FROM donations WHERE status = 'COMPLETED'`,
    donationsToday: `SELECT COUNT(*) FROM donations WHERE status = 'COMPLETED' AND donation_date = CURRENT_DATE`,
    donationsThisMonth: `SELECT COUNT(*) FROM donations WHERE status = 'COMPLETED' AND donation_date >= DATE_TRUNC('month', CURRENT_DATE)`,
    totalUnits: `SELECT COALESCE(SUM(units), 0) as sum FROM donations WHERE status = 'COMPLETED'`
  };

  const results = {};
  for (const [key, sql] of Object.entries(queries)) {
    const res = await pool.query(sql);
    results[key] = parseInt(res.rows[0].sum || res.rows[0].count || 0, 10);
  }
  return results;
}

export async function getOperationsSummary(startDate) {
  const params = [];
  let dateFilterReq = '';
  let dateFilterDon = '';
  if (startDate) {
    dateFilterReq = `WHERE created_at >= $1`;
    dateFilterDon = `WHERE donation_date >= $1 AND status = 'COMPLETED'`;
    params.push(startDate);
  } else {
    dateFilterDon = `WHERE status = 'COMPLETED'`;
  }

  const reqStats = await pool.query(`
    SELECT 
      COUNT(*) as total_requests,
      COUNT(*) FILTER (WHERE status = 'FULFILLED') as fulfilled_requests
    FROM blood_requests
    ${dateFilterReq}
  `, params);

  const donStats = await pool.query(`
    SELECT 
      COUNT(*) as total_donations,
      COALESCE(SUM(units), 0) as total_units
    FROM donations
    ${dateFilterDon}
  `, params);

  const totalRequests = parseInt(reqStats.rows[0].total_requests, 10);
  const fulfilledRequests = parseInt(reqStats.rows[0].fulfilled_requests, 10);
  const fulfillmentRate = totalRequests > 0 ? Math.round((fulfilledRequests / totalRequests) * 100) : 0;

  return {
    totalRequests,
    fulfilledRequests,
    fulfillmentRate,
    totalDonations: parseInt(donStats.rows[0].total_donations, 10),
    totalUnitsDonated: parseInt(donStats.rows[0].total_units, 10)
  };
}

export async function getRequestOutcomesStats(startDate) {
  const params = [];
  let query = `
    SELECT status, COUNT(*) as count 
    FROM blood_requests
  `;
  if (startDate) {
    query += ` WHERE created_at >= $1`;
    params.push(startDate);
  }
  query += ` GROUP BY status`;
  
  const res = await pool.query(query, params);
  return res.rows;
}

export async function getBloodGroupDemandSupplyStats(startDate) {
  const params = [];
  let paramIndex = 1;
  
  let reqQuery = `
    SELECT 
      bg.code as blood_group, 
      COUNT(br.id) as request_count,
      COUNT(br.id) FILTER (WHERE br.status = 'FULFILLED') as fulfilled_count,
      COUNT(br.id) FILTER (WHERE br.status = 'CANCELLED') as cancelled_count,
      COUNT(br.id) FILTER (WHERE br.status = 'REJECTED') as rejected_count,
      COUNT(br.id) FILTER (WHERE br.status = 'NO_DONOR_FOUND') as no_donor_count,
      COUNT(br.id) FILTER (WHERE br.status IN ('PENDING', 'APPROVED', 'DONORS_ALERTED', 'DONOR_RESPONDED', 'COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED')) as active_pending_count
    FROM blood_groups bg
    LEFT JOIN blood_requests br ON br.blood_group_id = bg.id
  `;
  if (startDate) {
    reqQuery += ` AND br.created_at >= $${paramIndex}`;
  }
  reqQuery += ` GROUP BY bg.code, bg.id ORDER BY bg.id ASC`;

  let donQuery = `
    SELECT bg.code as blood_group, COUNT(d.id) as donation_count
    FROM blood_groups bg
    LEFT JOIN donations d ON d.blood_group_id = bg.id AND d.status = 'COMPLETED'
  `;
  if (startDate) {
    donQuery += ` AND d.donation_date >= $${paramIndex}`;
  }
  donQuery += ` GROUP BY bg.code, bg.id ORDER BY bg.id ASC`;

  if (startDate) {
    params.push(startDate);
  }

  const reqRes = await pool.query(reqQuery, params);
  const donRes = await pool.query(donQuery, params);

  const stats = reqRes.rows.map(reqRow => {
    const donRow = donRes.rows.find(d => d.blood_group === reqRow.blood_group);
    return {
      blood_group: reqRow.blood_group,
      requests: parseInt(reqRow.request_count, 10),
      fulfilled: parseInt(reqRow.fulfilled_count, 10),
      cancelled: parseInt(reqRow.cancelled_count, 10),
      rejected: parseInt(reqRow.rejected_count, 10),
      no_donor_found: parseInt(reqRow.no_donor_count, 10),
      active_pending: parseInt(reqRow.active_pending_count, 10),
      donations: donRow ? parseInt(donRow.donation_count, 10) : 0
    };
  });

  return stats;
}

export async function getDonorContributionStats(startDate) {
  const params = [];
  let dpFilter = '';
  let donFilter = '';
  if (startDate) {
    dpFilter = `WHERE created_at >= $1`;
    donFilter = `AND donation_date >= $1`;
    params.push(startDate);
  }

  const registeredRes = await pool.query(`
    SELECT COUNT(*) as count FROM donor_profiles
    ${dpFilter}
  `, params);

  const activeRes = await pool.query(`
    SELECT COUNT(dp.id) as count 
    FROM donor_profiles dp
    JOIN users u ON dp.user_id = u.id
    WHERE u.status = 'ACTIVE'
    ${startDate ? 'AND dp.created_at >= $1' : ''}
  `, params);

  const donatedRes = await pool.query(`
    SELECT COUNT(DISTINCT donor_id) as count 
    FROM donations 
    WHERE status = 'COMPLETED'
    ${donFilter}
  `, params);

  const repeatRes = await pool.query(`
    SELECT COUNT(*) as count FROM (
      SELECT donor_id 
      FROM donations 
      WHERE status = 'COMPLETED'
      ${donFilter}
      GROUP BY donor_id 
      HAVING COUNT(*) > 1
    ) r
  `, params);

  return {
    registeredDonors: parseInt(registeredRes.rows[0].count, 10),
    activeDonors: parseInt(activeRes.rows[0].count, 10),
    donatedDonors: parseInt(donatedRes.rows[0].count, 10),
    repeatDonors: parseInt(repeatRes.rows[0].count, 10)
  };
}

export async function getCoordinatorWorkloadStats(startDate) {
  const params = [];
  let assignmentFilter = '';
  if (startDate) {
    assignmentFilter = `AND ra.assigned_at >= $1`;
    params.push(startDate);
  }

  const res = await pool.query(`
    SELECT 
      u.name as coordinator_name,
      COUNT(ra.id) FILTER (
        WHERE ra.status IN ('ASSIGNED', 'IN_PROGRESS') 
          AND br.status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND')
      ) as active_cases,
      COUNT(ra.id) FILTER (
        WHERE ra.status = 'COMPLETED' OR br.status = 'FULFILLED'
      ) as completed_cases
    FROM coordinator_profiles cp
    JOIN users u ON cp.user_id = u.id
    LEFT JOIN request_assignments ra ON cp.id = ra.coordinator_id ${assignmentFilter}
    LEFT JOIN blood_requests br ON ra.request_id = br.id
    WHERE cp.status = 'ACTIVE' AND u.status = 'ACTIVE'
    GROUP BY u.name
    ORDER BY u.name ASC
  `, params);

  return res.rows.map(row => ({
    coordinator_name: row.coordinator_name,
    active_cases: parseInt(row.active_cases, 10),
    completed_cases: parseInt(row.completed_cases, 10)
  }));
}

export async function getActivityTrend(period) {
  let startDate;
  let selectExpr;
  let seriesExpr;
  const now = new Date();

  if (period === 'last_7_days') {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    selectExpr = `g.date_point as label, g.date_point::varchar as key_label`;
    seriesExpr = `SELECT generate_series($1::date, CURRENT_DATE, '1 day'::interval)::date as date_point`;
  } else if (period === 'this_month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    selectExpr = `g.date_point as label, g.date_point::varchar as key_label`;
    seriesExpr = `SELECT generate_series($1::date, CURRENT_DATE, '1 day'::interval)::date as date_point`;
  } else if (period === 'last_3_months') {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    selectExpr = `g.week_point as label, g.week_point::varchar as key_label`;
    seriesExpr = `SELECT generate_series(DATE_TRUNC('week', $1::timestamp), DATE_TRUNC('week', CURRENT_TIMESTAMP), '1 week'::interval)::date as week_point`;
  } else if (period === 'this_year') {
    startDate = new Date(now.getFullYear(), 0, 1);
    selectExpr = `TO_CHAR(g.month_point, 'Mon') as label, TO_CHAR(g.month_point, 'YYYY-MM') as key_label`;
    seriesExpr = `SELECT generate_series($1::date, CURRENT_DATE, '1 month'::interval)::date as month_point`;
  } else {
    startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 11);
    selectExpr = `TO_CHAR(g.month_point, 'Mon YY') as label, TO_CHAR(g.month_point, 'YYYY-MM') as key_label`;
    seriesExpr = `SELECT generate_series($1::date, CURRENT_DATE, '1 month'::interval)::date as month_point`;
  }

  let query = '';
  if (period === 'last_7_days' || period === 'this_month') {
    query = `
      WITH date_series AS (
        ${seriesExpr}
      )
      SELECT 
        ${selectExpr},
        COALESCE(r.req_count, 0) as requests,
        COALESCE(d.don_count, 0) as donations
      FROM date_series g
      LEFT JOIN (
        SELECT created_at::date as date_val, COUNT(*) as req_count 
        FROM blood_requests 
        GROUP BY created_at::date
      ) r ON g.date_point = r.date_val
      LEFT JOIN (
        SELECT donation_date as date_val, COUNT(*) as don_count 
        FROM donations 
        WHERE status = 'COMPLETED'
        GROUP BY donation_date
      ) d ON g.date_point = d.date_val
      ORDER BY g.date_point ASC
    `;
  } else if (period === 'last_3_months') {
    query = `
      WITH date_series AS (
        ${seriesExpr}
      )
      SELECT 
        ${selectExpr},
        COALESCE(r.req_count, 0) as requests,
        COALESCE(d.don_count, 0) as donations
      FROM date_series g
      LEFT JOIN (
        SELECT DATE_TRUNC('week', created_at)::date as date_val, COUNT(*) as req_count 
        FROM blood_requests 
        GROUP BY DATE_TRUNC('week', created_at)::date
      ) r ON g.week_point = r.date_val
      LEFT JOIN (
        SELECT DATE_TRUNC('week', donation_date)::date as date_val, COUNT(*) as don_count 
        FROM donations 
        WHERE status = 'COMPLETED'
        GROUP BY DATE_TRUNC('week', donation_date)::date
      ) d ON g.week_point = d.date_val
      ORDER BY g.week_point ASC
    `;
  } else {
    query = `
      WITH date_series AS (
        ${seriesExpr}
      )
      SELECT 
        ${selectExpr},
        COALESCE(r.req_count, 0) as requests,
        COALESCE(d.don_count, 0) as donations
      FROM date_series g
      LEFT JOIN (
        SELECT DATE_TRUNC('month', created_at)::date as date_val, COUNT(*) as req_count 
        FROM blood_requests 
        GROUP BY DATE_TRUNC('month', created_at)::date
      ) r ON g.month_point = r.date_val
      LEFT JOIN (
        SELECT DATE_TRUNC('month', donation_date)::date as date_val, COUNT(*) as don_count 
        FROM donations 
        WHERE status = 'COMPLETED'
        GROUP BY DATE_TRUNC('month', donation_date)::date
      ) d ON g.month_point = d.date_val
      ORDER BY g.month_point ASC
    `;
  }

  const res = await pool.query(query, [startDate]);
  return res.rows.map(row => ({
    label: row.label,
    requests: parseInt(row.requests, 10),
    donations: parseInt(row.donations, 10)
  }));
}

export async function getAdminNotifications(adminUserId) {
  const res = await pool.query(`
    SELECT n.*, br.status as request_status, br.patient_name, bg.code as blood_group,
           u.name as coordinator_name, ra.coordinator_id as current_coordinator_id
    FROM notifications n
    LEFT JOIN blood_requests br ON n.request_id = br.id
    LEFT JOIN blood_groups bg ON br.blood_group_id = bg.id
    LEFT JOIN request_assignments ra ON br.id = ra.request_id AND ra.status IN ('ASSIGNED', 'IN_PROGRESS')
    LEFT JOIN coordinator_profiles cp ON ra.coordinator_id = cp.id
    LEFT JOIN users u ON cp.user_id = u.id
    WHERE n.user_id = $1 AND n.status <> 'DELETED'
    ORDER BY n.created_at DESC
  `, [adminUserId]);
  return res.rows;
}

export async function markAdminNotificationRead(notificationId, adminUserId) {
  const res = await pool.query(`
    UPDATE notifications 
    SET status = 'READ', read_at = CURRENT_TIMESTAMP, sent_at = COALESCE(sent_at, CURRENT_TIMESTAMP) 
    WHERE id = $1 AND user_id = $2 
    RETURNING *
  `, [notificationId, adminUserId]);
  return res.rows[0];
}

export async function deleteAdminNotification(notificationId, adminUserId) {
  await pool.query(`
    UPDATE notifications 
    SET status = 'DELETED', deleted_at = CURRENT_TIMESTAMP 
    WHERE id = $1 AND user_id = $2
  `, [notificationId, adminUserId]);
}

export async function getOverdueAssignments(responseWindowMinutes) {
  const res = await pool.query(`
    SELECT 
      ra.id as assignment_id,
      ra.request_id,
      ra.coordinator_id,
      ra.assigned_at,
      u.name as coordinator_name,
      br.patient_name,
      bg.code as blood_group
    FROM request_assignments ra
    JOIN blood_requests br ON ra.request_id = br.id
    JOIN blood_groups bg ON br.blood_group_id = bg.id
    JOIN coordinator_profiles cp ON ra.coordinator_id = cp.id
    JOIN users u ON cp.user_id = u.id
    WHERE ra.status = 'ASSIGNED'
      AND br.status IN ('DONOR_RESPONDED', 'APPROVED')
      AND ra.assigned_at < NOW() - ($1 * INTERVAL '1 minute')
  `, [responseWindowMinutes]);
  return res.rows;
}

export async function checkEscalationExists(requestId) {
  const res = await pool.query(`
    SELECT COUNT(*) FROM notifications 
    WHERE request_id = $1 AND type IN ('SYSTEM', 'COORDINATOR_ACTION_OVERDUE') AND title LIKE 'ESCALATION:%'
  `, [requestId]);
  return parseInt(res.rows[0].count, 10);
}

export async function getActiveAdmins() {
  const res = await pool.query(`
    SELECT u.id FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    WHERE ur.role IN ('SUPER_ADMIN', 'ADMIN') AND u.status = 'ACTIVE'
  `);
  return res.rows;
}

export async function insertAdminNotification(adminUserId, requestId, type, channel, title, message, eventKey = null) {
  const res = await pool.query(`
    INSERT INTO notifications (user_id, request_id, type, channel, title, message, status, event_key) 
    VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7) 
    ON CONFLICT (event_key) DO NOTHING
    RETURNING *
  `, [adminUserId, requestId, type, channel, title, message, eventKey]);
  return res.rows[0];
}

export async function getNotificationById(notificationId, adminUserId) {
  const res = await pool.query(`
    SELECT n.*, br.patient_name, bg.code as blood_group, u.name as coordinator_name, u.phone as coordinator_phone, u.email as coordinator_email
    FROM notifications n
    LEFT JOIN blood_requests br ON n.request_id = br.id
    LEFT JOIN blood_groups bg ON br.blood_group_id = bg.id
    LEFT JOIN request_assignments ra ON br.id = ra.request_id AND ra.status IN ('ASSIGNED', 'IN_PROGRESS')
    LEFT JOIN coordinator_profiles cp ON ra.coordinator_id = cp.id
    LEFT JOIN users u ON cp.user_id = u.id
    WHERE n.id = $1 AND n.user_id = $2
  `, [notificationId, adminUserId]);
  return res.rows[0];
}
