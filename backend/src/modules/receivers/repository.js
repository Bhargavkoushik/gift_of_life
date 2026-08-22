import pool from '../../database/connection.js';

export async function getReceiverProfileByUserId(userId) {
  const res = await pool.query(
    `SELECT rp.id, rp.name, rp.phone, rp.secondary_phone, rp.address, rp.area, rp.district, rp.state, rp.pincode, rp.receiver_type, rp.verification_status, u.email 
     FROM receiver_profiles rp
     JOIN users u ON rp.user_id = u.id
     WHERE rp.user_id = $1`,
    [userId]
  );
  return res.rows[0];
}

export async function updateReceiverProfile(userId, data) {
  const res = await pool.query(
    `UPDATE receiver_profiles 
     SET address = $1, area = $2, district = $3, state = $4, pincode = $5, receiver_type = $6, secondary_phone = $7, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $8
     RETURNING *`,
    [data.address, data.area, data.district, data.state, data.pincode, data.receiver_type, data.secondary_phone || null, userId]
  );
  return res.rows[0];
}

export async function getBloodGroupIdByCode(code) {
  const res = await pool.query(
    `SELECT id FROM blood_groups WHERE code = $1`,
    [code]
  );
  return res.rows[0]?.id;
}

export async function createBloodRequest(receiverId, userId, data) {
  const res = await pool.query(
    `INSERT INTO blood_requests (receiver_id, blood_group_id, required_units, patient_name, hospital_name, hospital_address, location, required_date_time, urgency_level, status, description, relation_type, created_by_user_id, created_by_role)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING', $10, $11, $12, 'RECEIVER')
     RETURNING *`,
    [
      receiverId,
      data.blood_group_id,
      data.required_units,
      data.patient_name,
      data.hospital_name,
      data.hospital_address,
      data.location,
      data.required_date_time,
      data.urgency_level,
      data.description || null,
      data.relation_type || 'SOMEONE_ELSE',
      userId
    ]
  );
  return res.rows[0];
}

export async function getReceiverRequests(receiverId, statuses = []) {
  let query = `
    SELECT br.*, bg.code as blood_group,
           ra.status as coordination_status, ra.assigned_at as coordination_assigned_at,
           cp.area as coordinator_area, u.name as coordinator_name
    FROM blood_requests br
    JOIN blood_groups bg ON br.blood_group_id = bg.id
    LEFT JOIN request_assignments ra ON ra.request_id = br.id AND ra.status IN ('ASSIGNED', 'IN_PROGRESS')
    LEFT JOIN coordinator_profiles cp ON ra.coordinator_id = cp.id
    LEFT JOIN users u ON cp.user_id = u.id
    WHERE br.receiver_id = $1
  `;
  const params = [receiverId];
  if (statuses.length > 0) {
    query += ` AND br.status = ANY($2)`;
    params.push(statuses);
  }
  query += ` ORDER BY br.created_at DESC`;
  const res = await pool.query(query, params);
  return res.rows;
}

export async function getRequestDetails(requestId, receiverId) {
  const res = await pool.query(
    `SELECT br.*, bg.code as blood_group,
            ra.status as coordination_status, ra.assigned_at as coordination_assigned_at,
            cp.area as coordinator_area, u.name as coordinator_name
     FROM blood_requests br
     JOIN blood_groups bg ON br.blood_group_id = bg.id
     LEFT JOIN request_assignments ra ON ra.request_id = br.id AND ra.status IN ('ASSIGNED', 'IN_PROGRESS')
     LEFT JOIN coordinator_profiles cp ON ra.coordinator_id = cp.id
     LEFT JOIN users u ON cp.user_id = u.id
     WHERE br.id = $1 AND br.receiver_id = $2`,
    [requestId, receiverId]
  );
  return res.rows[0];
}

export async function cancelBloodRequest(requestId, receiverId) {
  const res = await pool.query(
    `UPDATE blood_requests
     SET status = 'CANCELLED', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND receiver_id = $2 AND status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED')
     RETURNING *`,
    [requestId, receiverId]
  );
  return res.rows[0];
}

export async function getDonorResponsesCount(requestId) {
  const res = await pool.query(
    `SELECT COUNT(*) FROM donor_responses WHERE request_id = $1 AND response_status = 'ACCEPTED'`,
    [requestId]
  );
  return parseInt(res.rows[0].count, 10);
}

export async function getNotifications(userId) {
  const res = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return res.rows;
}

export async function markNotificationAsRead(notificationId, userId) {
  const res = await pool.query(
    `UPDATE notifications SET status = 'READ', sent_at = COALESCE(sent_at, CURRENT_TIMESTAMP) WHERE id = $1 AND user_id = $2 RETURNING *`,
    [notificationId, userId]
  );
  return res.rows[0];
}

export async function writeAuditLog(actorId, action, entityType, entityId, metadata = {}) {
  await pool.query(
    `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [actorId, action, entityType, entityId, JSON.stringify(metadata)]
  );
}
