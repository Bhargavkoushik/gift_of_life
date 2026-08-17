import pool from '../../database/connection.js';

export async function getDonorProfileByUserId(userId) {
  const result = await pool.query(
    `SELECT dp.*, u.name, u.email, u.phone as primary_phone, bg.code as blood_group
     FROM donor_profiles dp
     JOIN users u ON dp.user_id = u.id
     JOIN blood_groups bg ON dp.blood_group_id = bg.id
     WHERE dp.user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

export async function updateDonorProfile(userId, data) {
  const { name, blood_group_id, date_of_birth, gender, phone, address, area, district, state, pincode } = data;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Update core name in users
    await client.query(
      `UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [name, userId]
    );

    // Update details in donor_profiles
    const result = await client.query(
      `UPDATE donor_profiles
       SET blood_group_id = $1, date_of_birth = $2, gender = $3, phone = $4,
           address = $5, area = $6, district = $7, state = $8, pincode = $9,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $10
       RETURNING *`,
      [blood_group_id, date_of_birth, gender, phone || null, address, area, district, state, pincode, userId]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getDonorAvailability(userId) {
  const result = await pool.query(
    `SELECT id, availability_status, eligibility_status, deferred_until, last_donation_date
     FROM donor_profiles
     WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

export async function updateDonorAvailability(userId, availabilityStatus) {
  const result = await pool.query(
    `UPDATE donor_profiles
     SET availability_status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $2
     RETURNING availability_status`,
    [availabilityStatus, userId]
  );
  return result.rows[0];
}

export async function getMatchingRequests(userId) {
  const result = await pool.query(
    `SELECT br.id, br.required_units, br.patient_name, br.hospital_name, br.hospital_address,
            br.location, br.required_date_time, br.urgency_level, br.status, br.description,
            br.created_at, bg.code as blood_group,
            COALESCE(dr.response_status, 'NO_RESPONSE') as response_status
     FROM blood_requests br
     JOIN blood_groups bg ON br.blood_group_id = bg.id
     JOIN donor_profiles dp ON dp.user_id = $1
     LEFT JOIN donor_responses dr ON dr.request_id = br.id AND dr.donor_id = dp.id
     WHERE br.blood_group_id = dp.blood_group_id
       AND br.status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND')
     ORDER BY br.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function respondToRequest(userId, requestId, status, notes) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get donor profile id
    const dpResult = await client.query('SELECT id FROM donor_profiles WHERE user_id = $1', [userId]);
    if (dpResult.rows.length === 0) {
      const err = new Error('Donor profile not found');
      err.statusCode = 404;
      throw err;
    }
    const donorId = dpResult.rows[0].id;

    // Verify request exists and is active
    const reqResult = await client.query('SELECT status FROM blood_requests WHERE id = $1', [requestId]);
    if (reqResult.rows.length === 0) {
      const err = new Error('Blood request not found');
      err.statusCode = 404;
      throw err;
    }
    const requestStatus = reqResult.rows[0].status;
    if (['FULFILLED', 'CANCELLED', 'REJECTED'].includes(requestStatus)) {
      const err = new Error('This request is already closed or cancelled');
      err.statusCode = 400;
      throw err;
    }

    // Upsert response
    await client.query(
      `INSERT INTO donor_responses (request_id, donor_id, response_status, responded_at, notes, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (request_id, donor_id)
       DO UPDATE SET response_status = $3, responded_at = CURRENT_TIMESTAMP, notes = $4, updated_at = CURRENT_TIMESTAMP`,
      [requestId, donorId, status, notes || '']
    );

    // If accepted and request status is pending/approved, transition to DONOR_RESPONDED
    if (status === 'ACCEPTED' && ['PENDING', 'APPROVED', 'DONORS_ALERTED'].includes(requestStatus)) {
      await client.query(
        `UPDATE blood_requests SET status = 'DONOR_RESPONDED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [requestId]
      );

      // Auto-assign matching coordinator on donor response
      const reqDetails = await client.query('SELECT location, hospital_address FROM blood_requests WHERE id = $1', [requestId]);
      const reqLocation = reqDetails.rows[0]?.location || '';
      const reqAddress = reqDetails.rows[0]?.hospital_address || '';

      const coordRes = await client.query(`
        SELECT cp.id
        FROM coordinator_profiles cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.status = 'ACTIVE' 
          AND u.status = 'ACTIVE' 
          AND cp.availability_status = 'AVAILABLE'
        ORDER BY 
          CASE 
            WHEN cp.area ILIKE $1 OR $2 ILIKE '%' || cp.area || '%' THEN 0 
            WHEN cp.district ILIKE $1 OR $2 ILIKE '%' || cp.district || '%' THEN 1 
            ELSE 2 
          END
        LIMIT 1
      `, [reqLocation, reqAddress]);

      if (coordRes.rows.length > 0) {
        const coordinatorProfileId = coordRes.rows[0].id;
        const activeAssign = await client.query(
          `SELECT id FROM request_assignments WHERE request_id = $1 AND status IN ('ASSIGNED', 'IN_PROGRESS')`,
          [requestId]
        );
        if (activeAssign.rows.length === 0) {
          await client.query(
            `INSERT INTO request_assignments (request_id, coordinator_id, status, assigned_at)
             VALUES ($1, $2, 'ASSIGNED', CURRENT_TIMESTAMP)`,
            [requestId, coordinatorProfileId]
          );
          
          await client.query(
            `INSERT INTO notifications (user_id, request_id, type, channel, title, message, status, created_at)
             SELECT cp.user_id, $1::uuid, 'REQUEST_STATUS', 'IN_APP', 'New Request Assignment', 'You have been assigned to coordinate request REQ-' || SUBSTRING($1::text, 1, 5), 'PENDING', CURRENT_TIMESTAMP
             FROM coordinator_profiles cp WHERE cp.id = $2`,
            [requestId, coordinatorProfileId]
          );
        }
      } else {
        console.warn('No active available coordinator found for request:', requestId);
      }
    }

    // If rejected/withdrawn, check other responses to see if request status needs to be reset
    if (status === 'REJECTED') {
      const otherAccepted = await client.query(
        `SELECT COUNT(*) FROM donor_responses WHERE request_id = $1 AND response_status = 'ACCEPTED' AND donor_id != $2`,
        [requestId, donorId]
      );
      if (parseInt(otherAccepted.rows[0].count, 10) === 0) {
        await client.query(
          `UPDATE blood_requests SET status = 'PENDING', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [requestId]
        );
      }
    }

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function completeDonation(userId, requestId, verifiedByUserId = null) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get donor profile details
    const dpResult = await client.query('SELECT id, blood_group_id FROM donor_profiles WHERE user_id = $1', [userId]);
    if (dpResult.rows.length === 0) {
      const err = new Error('Donor profile not found');
      err.statusCode = 404;
      throw err;
    }
    const { id: donorId, blood_group_id: bloodGroupId } = dpResult.rows[0];

    // Verify donor accepted the request
    const respResult = await client.query(
      `SELECT response_status FROM donor_responses WHERE request_id = $1 AND donor_id = $2`,
      [requestId, donorId]
    );
    if (respResult.rows.length === 0 || respResult.rows[0].response_status !== 'ACCEPTED') {
      const err = new Error('You must accept this request before marking the donation as completed');
      err.statusCode = 400;
      throw err;
    }

    // Verify request is not already closed
    const reqResult = await client.query('SELECT status, required_units FROM blood_requests WHERE id = $1', [requestId]);
    if (reqResult.rows.length === 0) {
      const err = new Error('Blood request not found');
      err.statusCode = 404;
      throw err;
    }
    const { status: requestStatus, required_units: requiredUnits } = reqResult.rows[0];
    if (['FULFILLED', 'CANCELLED'].includes(requestStatus)) {
      const err = new Error('This request has already been completed or cancelled');
      err.statusCode = 400;
      throw err;
    }

    // 1. Log completed donation record
    await client.query(
      `INSERT INTO donations (donor_id, request_id, blood_group_id, donation_date, units, status, verified_by)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, 'COMPLETED', $5)`,
      [donorId, requestId, bloodGroupId, requiredUnits || 1, verifiedByUserId]
    );

    // 2. Set donor last donation date and availability
    await client.query(
      `UPDATE donor_profiles
       SET last_donation_date = CURRENT_DATE, availability_status = 'NOT_AVAILABLE', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [donorId]
    );

    // 3. Close the request
    await client.query(
      `UPDATE blood_requests
       SET status = 'FULFILLED', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [requestId]
    );

    // 4. Update request assignment status to COMPLETED and log completion time
    await client.query(
      `UPDATE request_assignments
       SET status = 'COMPLETED', completed_at = CURRENT_TIMESTAMP
       WHERE request_id = $1 AND status IN ('ASSIGNED', 'IN_PROGRESS')`,
      [requestId]
    );

    await client.query('COMMIT');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getDonationHistory(userId) {
  const result = await pool.query(
    `SELECT d.id, d.donation_date, d.units, d.status, bg.code as blood_group,
            br.patient_name, br.hospital_name, br.hospital_address
     FROM donations d
     JOIN blood_groups bg ON d.blood_group_id = bg.id
     LEFT JOIN blood_requests br ON d.request_id = br.id
     JOIN donor_profiles dp ON d.donor_id = dp.id
     WHERE dp.user_id = $1
     ORDER BY d.donation_date DESC, d.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function getNotifications(userId) {
  const result = await pool.query(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function markNotificationAsRead(userId, notificationId) {
  const result = await pool.query(
    `UPDATE notifications
     SET status = 'READ'
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [notificationId, userId]
  );
  return result.rows[0];
}
