import pool from '../../database/connection.js';

export async function createBloodRequest(data, client = pool) {
  const res = await client.query(
    `INSERT INTO blood_requests (
      receiver_id, blood_group_id, required_units, patient_name,
      hospital_name, hospital_address, location, required_date_time,
      urgency_level, status, description, created_by_user_id, created_by_role
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PENDING', $10, $11, $12)
    RETURNING *`,
    [
      data.receiver_id || null,
      data.blood_group_id,
      data.required_units,
      data.patient_name,
      data.hospital_name,
      data.hospital_address,
      data.location,
      data.required_date_time,
      data.urgency_level,
      data.description || null,
      data.created_by_user_id,
      data.created_by_role
    ]
  );
  return res.rows[0];
}

export async function checkActiveDuplicate(data, client = pool) {
  const res = await client.query(
    `SELECT id FROM blood_requests
     WHERE LOWER(TRIM(patient_name)) = LOWER(TRIM($1))
       AND LOWER(TRIM(hospital_name)) = LOWER(TRIM($2))
       AND blood_group_id = $3
       AND required_units = $4
       AND LOWER(TRIM(location)) = LOWER(TRIM($5))
       AND status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND')
     LIMIT 1`,
    [
      data.patient_name,
      data.hospital_name,
      data.blood_group_id,
      data.required_units,
      data.location
    ]
  );
  return res.rows[0]?.id;
}

export async function getBloodRequestDetails(id, client = pool) {
  const res = await client.query(
    `SELECT br.*, bg.code as blood_group,
            ra.status as coordination_status, ra.assigned_at as coordination_assigned_at,
            cp.area as coordinator_area, u.name as coordinator_name,
            u_create.name as creator_name, u_create.email as creator_email
     FROM blood_requests br
     JOIN blood_groups bg ON br.blood_group_id = bg.id
     JOIN users u_create ON br.created_by_user_id = u_create.id
     LEFT JOIN request_assignments ra ON ra.request_id = br.id AND ra.status IN ('ASSIGNED', 'IN_PROGRESS')
     LEFT JOIN coordinator_profiles cp ON ra.coordinator_id = cp.id
     LEFT JOIN users u ON cp.user_id = u.id
     WHERE br.id = $1`,
    [id]
  );
  return res.rows[0];
}

export async function cancelBloodRequest(id, client = pool) {
  const res = await client.query(
    `UPDATE blood_requests
     SET status = 'CANCELLED', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED')
     RETURNING *`,
    [id]
  );
  return res.rows[0];
}

export async function writeAuditLog(actorId, action, entityType, entityId, metadata = {}, client = pool) {
  await client.query(
    `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [actorId, action, entityType, entityId, JSON.stringify(metadata)]
  );
}

export async function getBloodGroupIdByCode(code, client = pool) {
  const res = await client.query(
    `SELECT id FROM blood_groups WHERE code = $1`,
    [code]
  );
  return res.rows[0]?.id;
}

export async function getRequests(client = pool) {
  const res = await client.query(
    `SELECT br.*, bg.code as blood_group,
            u.name as creator_name,
            rp.name as receiver_name
     FROM blood_requests br
     JOIN blood_groups bg ON br.blood_group_id = bg.id
     JOIN users u ON br.created_by_user_id = u.id
     LEFT JOIN receiver_profiles rp ON br.receiver_id = rp.id
     ORDER BY br.created_at DESC`
  );
  return res.rows;
}
