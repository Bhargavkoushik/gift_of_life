import pool from '../../database/connection.js';

export async function getReceiverProfileByUserId(userId) {
  const res = await pool.query(
    `SELECT id, name, phone, address, area, district, state, pincode, receiver_type, verification_status 
     FROM receiver_profiles WHERE user_id = $1`,
    [userId]
  );
  return res.rows[0];
}

export async function updateReceiverProfile(userId, data) {
  const res = await pool.query(
    `UPDATE receiver_profiles 
     SET name = $1, phone = $2, address = $3, area = $4, district = $5, state = $6, pincode = $7, receiver_type = $8, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $9
     RETURNING *`,
    [data.name, data.phone, data.address, data.area, data.district, data.state, data.pincode, data.receiver_type, userId]
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

export async function createBloodRequest(receiverId, data) {
  const res = await pool.query(
    `INSERT INTO blood_requests (receiver_id, blood_group_id, required_units, patient_name, hospital_name, hospital_address, location, required_date_time, urgency_level, status, description)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING', $10)
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
      data.description || null
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
