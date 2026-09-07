import pool from '../../database/connection.js';

export async function getDonorsList({ search, bloodGroup, availability } = {}) {
  let query = `
    SELECT u.id as user_id, u.name, u.email, u.phone,
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
    conditions.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR bg.code ILIKE $${params.length} OR dp.area ILIKE $${params.length})`);
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

  query += ` ORDER BY u.name ASC`;

  const res = await pool.query(query, params);
  return res.rows;
}

export async function getCoordinatorsList() {
  const res = await pool.query(
    `SELECT cp.id as coordinator_profile_id, u.id as user_id, u.name, u.email, u.phone,
            cp.area, cp.district, cp.availability_status,
            (SELECT COUNT(*) FROM request_assignments ra WHERE ra.coordinator_id = cp.id AND ra.status IN ('ASSIGNED', 'IN_PROGRESS')) as active_assignments_count
     FROM coordinator_profiles cp
     JOIN users u ON cp.user_id = u.id
     WHERE cp.status = 'ACTIVE' AND u.status = 'ACTIVE'
     ORDER BY u.name ASC`
  );
  return res.rows;
}
