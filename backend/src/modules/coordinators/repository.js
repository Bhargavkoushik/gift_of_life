import pool from '../../database/connection.js';

export async function getAssignedRequests(coordinatorUserId) {
  const result = await pool.query(
    `SELECT br.id, br.required_units, br.patient_name, br.hospital_name, br.location,
            br.required_date_time, br.urgency_level, br.status, bg.code as blood_group,
            rp.name as receiver_name, rp.phone as receiver_phone
     FROM blood_requests br
     JOIN blood_groups bg ON br.blood_group_id = bg.id
     JOIN receiver_profiles rp ON br.receiver_id = rp.id
     JOIN request_assignments ra ON br.id = ra.request_id
     JOIN coordinator_profiles cp ON ra.coordinator_id = cp.id
     WHERE cp.user_id = $1 AND ra.status IN ('ASSIGNED', 'IN_PROGRESS')
     ORDER BY br.updated_at DESC`,
    [coordinatorUserId]
  );
  return result.rows;
}

export async function getRequestDetails(requestId) {
  const result = await pool.query(
    `SELECT br.*, bg.code as blood_group, rp.name as receiver_name, rp.phone as receiver_phone
     FROM blood_requests br
     JOIN blood_groups bg ON br.blood_group_id = bg.id
     JOIN receiver_profiles rp ON br.receiver_id = rp.id
     WHERE br.id = $1`,
    [requestId]
  );
  return result.rows[0];
}

export async function getRequestDonorResponses(requestId) {
  const result = await pool.query(
    `SELECT dr.id, dr.response_status, dr.responded_at, dr.notes,
            dp.id as donor_profile_id, dp.availability_status, dp.eligibility_status,
            u.id as user_id, u.name as donor_name, u.phone as donor_phone, u.email as donor_email
     FROM donor_responses dr
     JOIN donor_profiles dp ON dr.donor_id = dp.id
     JOIN users u ON dp.user_id = u.id
     WHERE dr.request_id = $1`,
    [requestId]
  );
  return result.rows;
}

export async function updateRequestStatus(requestId, status) {
  const result = await pool.query(
    `UPDATE blood_requests
     SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2
     RETURNING status`,
    [status, requestId]
  );
  return result.rows[0];
}

export async function updateDonorEligibility(donorId, status, deferredUntil = null) {
  const result = await pool.query(
    `UPDATE donor_profiles
     SET eligibility_status = $1, deferred_until = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING eligibility_status`,
    [status, deferredUntil, donorId]
  );
  return result.rows[0];
}

export async function getDonorProfileById(donorProfileId) {
  const result = await pool.query(
    `SELECT id, user_id FROM donor_profiles WHERE id = $1`,
    [donorProfileId]
  );
  return result.rows[0];
}
