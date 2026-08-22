import pool from '../../database/connection.js';

export async function getAssignedRequests(coordinatorUserId) {
  const result = await pool.query(
    `SELECT br.id, br.required_units, br.patient_name, br.hospital_name, br.location,
            br.required_date_time, br.urgency_level, br.status, bg.code as blood_group,
            rp.name as receiver_name, rp.phone as receiver_phone,
            ra.status as assignment_status, ra.completed_at as assignment_completed_at
     FROM blood_requests br
     JOIN blood_groups bg ON br.blood_group_id = bg.id
     LEFT JOIN receiver_profiles rp ON br.receiver_id = rp.id
     JOIN request_assignments ra ON br.id = ra.request_id
     JOIN coordinator_profiles cp ON ra.coordinator_id = cp.id
     WHERE cp.user_id = $1
     ORDER BY 
       CASE 
         WHEN ra.status IN ('ASSIGNED', 'IN_PROGRESS') AND br.status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND') THEN 0 
         ELSE 1 
       END,
       br.updated_at DESC`,
    [coordinatorUserId]
  );
  return result.rows;
}

export async function getRequestDetails(requestId) {
  const result = await pool.query(
    `SELECT br.*, bg.code as blood_group, rp.name as receiver_name, rp.phone as receiver_phone
     FROM blood_requests br
     JOIN blood_groups bg ON br.blood_group_id = bg.id
     LEFT JOIN receiver_profiles rp ON br.receiver_id = rp.id
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

export async function updateRequestStatus(requestId, status, client = pool) {
  const result = await client.query(
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

export async function updateAssignmentStatus(requestId, coordinatorUserId, status) {
  await pool.query(
    `UPDATE request_assignments ra
     SET status = $1,
         completed_at = CASE WHEN $1 = 'COMPLETED' THEN CURRENT_TIMESTAMP ELSE completed_at END
     FROM coordinator_profiles cp
     WHERE ra.coordinator_id = cp.id
       AND cp.user_id = $2
       AND ra.request_id = $3
       AND ra.status IN ('ASSIGNED', 'IN_PROGRESS')`,
    [status, coordinatorUserId, requestId]
  );
}

export async function deactivateActiveAssignments(requestId, client = pool) {
  await client.query(
    `UPDATE request_assignments 
     SET status = 'REASSIGNED', completed_at = CURRENT_TIMESTAMP 
     WHERE request_id = $1 AND status IN ('ASSIGNED', 'IN_PROGRESS')`,
    [requestId]
  );
}

export async function getActiveAssignment(requestId, coordinatorUserId) {
  const result = await pool.query(
    `SELECT ra.id, ra.status 
     FROM request_assignments ra
     JOIN coordinator_profiles cp ON ra.coordinator_id = cp.id
     WHERE ra.request_id = $1 
       AND cp.user_id = $2 
       AND ra.status IN ('ASSIGNED', 'IN_PROGRESS')`,
    [requestId, coordinatorUserId]
  );
  return result.rows[0];
}

export async function getAssignment(requestId, coordinatorUserId) {
  const result = await pool.query(
    `SELECT ra.id, ra.status 
     FROM request_assignments ra
     JOIN coordinator_profiles cp ON ra.coordinator_id = cp.id
     WHERE ra.request_id = $1 
       AND cp.user_id = $2`,
    [requestId, coordinatorUserId]
  );
  return result.rows[0];
}

export async function getCoordinatorAvailability(userId) {
  const result = await pool.query(
    `SELECT availability_status FROM coordinator_profiles WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0]?.availability_status;
}

export async function updateCoordinatorAvailability(userId, status) {
  const result = await pool.query(
    `UPDATE coordinator_profiles 
     SET availability_status = $1, last_active_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $2
     RETURNING availability_status`,
     [status, userId]
  );
  return result.rows[0]?.availability_status;
}

export async function getDashboardMetrics(coordinatorUserId) {
  const result = await pool.query(
    `WITH latest_assignments AS (
       SELECT ra.*,
              ROW_NUMBER() OVER (PARTITION BY ra.request_id, ra.coordinator_id ORDER BY ra.assigned_at DESC) as rn
       FROM request_assignments ra
     )
     SELECT 
        COUNT(ra.id) FILTER (WHERE ra.status = 'ASSIGNED' AND br.status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND')) as active_count,
        COUNT(ra.id) FILTER (WHERE ra.status = 'IN_PROGRESS' AND br.status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND')) as in_progress_count,
        COUNT(ra.id) FILTER (WHERE ra.status = 'COMPLETED' OR br.status = 'FULFILLED') as completed_count,
        COUNT(ra.id) FILTER (WHERE br.status IN ('CANCELLED', 'REJECTED', 'NO_DONOR_FOUND') AND ra.status != 'COMPLETED') as cancelled_count
     FROM latest_assignments ra
     JOIN blood_requests br ON ra.request_id = br.id
     JOIN coordinator_profiles cp ON ra.coordinator_id = cp.id
     WHERE cp.user_id = $1 AND ra.rn = 1`,
    [coordinatorUserId]
  );
  const row = result.rows[0];
  return {
    activeCount: parseInt(row?.active_count || 0, 10),
    inProgressCount: parseInt(row?.in_progress_count || 0, 10),
    completedCount: parseInt(row?.completed_count || 0, 10),
    cancelledCount: parseInt(row?.cancelled_count || 0, 10)
  };
}

export async function getDashboardActiveCases(coordinatorUserId, limit = 4) {
  const result = await pool.query(
    `WITH latest_assignments AS (
       SELECT ra.*,
              ROW_NUMBER() OVER (PARTITION BY ra.request_id, ra.coordinator_id ORDER BY ra.assigned_at DESC) as rn
       FROM request_assignments ra
     )
     SELECT br.id, br.required_units, br.patient_name, br.hospital_name, br.location,
            br.required_date_time, br.urgency_level, br.status, bg.code as blood_group,
            rp.name as receiver_name, rp.phone as receiver_phone,
            ra.status as assignment_status, ra.assigned_at as assigned_at,
            (ra.status = 'ASSIGNED' AND ra.assigned_at < NOW() - INTERVAL '15 minutes') as is_overdue
     FROM blood_requests br
     JOIN blood_groups bg ON br.blood_group_id = bg.id
     LEFT JOIN receiver_profiles rp ON br.receiver_id = rp.id
     JOIN latest_assignments ra ON br.id = ra.request_id AND ra.rn = 1
     JOIN coordinator_profiles cp ON ra.coordinator_id = cp.id
     WHERE cp.user_id = $1
       AND ra.status IN ('ASSIGNED', 'IN_PROGRESS')
       AND br.status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND')
     ORDER BY 
       -- Overdue cases first
       CASE WHEN ra.status = 'ASSIGNED' AND ra.assigned_at < NOW() - INTERVAL '15 minutes' THEN 0 ELSE 1 END,
       -- Urgency level
       CASE WHEN br.urgency_level = 'EMERGENCY' THEN 0 WHEN br.urgency_level = 'URGENT' THEN 1 ELSE 2 END,
       -- Longest waiting
       ra.assigned_at ASC
     LIMIT $2`,
    [coordinatorUserId, limit]
  );
  return result.rows;
}

export async function getDashboardCompletedCases(coordinatorUserId, limit = 4) {
  const result = await pool.query(
    `WITH latest_assignments AS (
       SELECT ra.*,
              ROW_NUMBER() OVER (PARTITION BY ra.request_id, ra.coordinator_id ORDER BY ra.assigned_at DESC) as rn
       FROM request_assignments ra
     )
     SELECT br.id, br.required_units, br.patient_name, br.hospital_name, br.location,
            br.required_date_time, br.urgency_level, br.status, bg.code as blood_group,
            rp.name as receiver_name, rp.phone as receiver_phone,
            ra.status as assignment_status, ra.completed_at as assignment_completed_at
     FROM blood_requests br
     JOIN blood_groups bg ON br.blood_group_id = bg.id
     LEFT JOIN receiver_profiles rp ON br.receiver_id = rp.id
     JOIN latest_assignments ra ON br.id = ra.request_id AND ra.rn = 1
     JOIN coordinator_profiles cp ON ra.coordinator_id = cp.id
     WHERE cp.user_id = $1
       AND (ra.status = 'COMPLETED' OR (br.status IN ('CANCELLED', 'REJECTED', 'NO_DONOR_FOUND') AND ra.status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED')))
     ORDER BY 
       COALESCE(ra.completed_at, br.closed_at, br.updated_at) DESC
     LIMIT $2`,
    [coordinatorUserId, limit]
  );
  return result.rows;
}

export async function getAssignedRequestsPaginated(coordinatorUserId, { page = 1, limit = 10, status = 'ALL', search = '' }) {
  const offset = (page - 1) * limit;
  const params = [coordinatorUserId];
  const conditions = ['cp.user_id = $1', 'ra.rn = 1'];
  let paramIndex = 2;
  
  const terminalStatuses = ['FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND'];
  
  if (status && status !== 'ALL') {
    if (status === 'ACTIVE') {
      conditions.push(`ra.status IN ('ASSIGNED', 'IN_PROGRESS') AND br.status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND')`);
    } else if (status === 'COMPLETED') {
      conditions.push(`(ra.status = 'COMPLETED' OR br.status = 'FULFILLED')`);
    } else if (status === 'CANCELLED') {
      conditions.push(`br.status = 'CANCELLED'`);
    } else if (status === 'REASSIGNED') {
      conditions.push(`ra.status = 'REASSIGNED'`);
    } else {
      conditions.push(`ra.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }
  }
  
  if (search && search.trim() !== '') {
    conditions.push(`(br.patient_name ILIKE $${paramIndex} OR br.hospital_name ILIKE $${paramIndex} OR br.location ILIKE $${paramIndex})`);
    params.push(`%${search.trim()}%`);
    paramIndex++;
  }
  
  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  
  // Count total records
  const countQuery = `
    WITH latest_assignments AS (
      SELECT ra.*,
             ROW_NUMBER() OVER (PARTITION BY ra.request_id, ra.coordinator_id ORDER BY ra.assigned_at DESC) as rn
      FROM request_assignments ra
    )
    SELECT COUNT(ra.id) as total
    FROM latest_assignments ra
    JOIN blood_requests br ON ra.request_id = br.id
    JOIN coordinator_profiles cp ON ra.coordinator_id = cp.id
    ${whereClause}
  `;
  const countRes = await pool.query(countQuery, params);
  const totalRecords = parseInt(countRes.rows[0]?.total || 0, 10);
  
  // Fetch paginated records
  const limitParamIndex = paramIndex;
  const offsetParamIndex = paramIndex + 1;
  const dataParams = [...params, limit, offset];
  
  const dataQuery = `
    WITH latest_assignments AS (
      SELECT ra.*,
             ROW_NUMBER() OVER (PARTITION BY ra.request_id, ra.coordinator_id ORDER BY ra.assigned_at DESC) as rn
      FROM request_assignments ra
    )
    SELECT br.id, br.required_units, br.patient_name, br.hospital_name, br.location,
           br.required_date_time, br.urgency_level, br.status, bg.code as blood_group,
           rp.name as receiver_name, rp.phone as receiver_phone,
           ra.status as assignment_status, ra.completed_at as assignment_completed_at,
           ra.assigned_at as assigned_at
    FROM blood_requests br
    JOIN blood_groups bg ON br.blood_group_id = bg.id
    LEFT JOIN receiver_profiles rp ON br.receiver_id = rp.id
    JOIN latest_assignments ra ON br.id = ra.request_id AND ra.rn = 1
    JOIN coordinator_profiles cp ON ra.coordinator_id = cp.id
    ${whereClause}
    ORDER BY 
      CASE WHEN ra.status IN ('ASSIGNED', 'IN_PROGRESS') AND br.status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND') THEN 0 ELSE 1 END,
      br.updated_at DESC
    LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
  `;
  
  const dataRes = await pool.query(dataQuery, dataParams);
  
  return {
    requests: dataRes.rows,
    totalRecords
  };
}

export async function queryBloodCamps(filters = {}) {
  const params = [];
  const conditions = [];
  let paramIndex = 1;

  if (filters.name) {
    conditions.push(`name ILIKE $${paramIndex}`);
    params.push(`%${filters.name}%`);
    paramIndex++;
  }
  if (filters.state) {
    conditions.push(`state ILIKE $${paramIndex}`);
    params.push(`%${filters.state}%`);
    paramIndex++;
  }
  if (filters.district) {
    conditions.push(`district ILIKE $${paramIndex}`);
    params.push(`%${filters.district}%`);
    paramIndex++;
  }
  if (filters.area) {
    conditions.push(`area ILIKE $${paramIndex}`);
    params.push(`%${filters.area}%`);
    paramIndex++;
  }
  if (filters.status && filters.status !== 'All') {
    conditions.push(`status = $${paramIndex}`);
    params.push(filters.status);
    paramIndex++;
  }
  if (filters.dateFilter === 'Upcoming') {
    conditions.push(`date >= CURRENT_DATE`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `
    SELECT * FROM blood_camps
    ${whereClause}
    ORDER BY date ASC, start_time ASC
  `;

  const result = await pool.query(query, params);
  return result.rows;
}

export async function createBloodCamp(campData, createdByUserId) {
  const {
    name, organizer, description, date, start_time, end_time,
    venue, address, area, district, state, contact_name, contact_phone, status = 'UPCOMING'
  } = campData;

  const result = await pool.query(
    `INSERT INTO blood_camps (
      name, organizer, description, date, start_time, end_time,
      venue, address, area, district, state, contact_name, contact_phone, status, created_by
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING *`,
    [
      name, organizer, description, date, start_time, end_time,
      venue, address, area, district, state, contact_name, contact_phone, status, createdByUserId
    ]
  );
  return result.rows[0];
}

export async function updateBloodCamp(id, campData) {
  const {
    name, organizer, description, date, start_time, end_time,
    venue, address, area, district, state, contact_name, contact_phone, status
  } = campData;

  const result = await pool.query(
    `UPDATE blood_camps
     SET name = $1, organizer = $2, description = $3, date = $4, start_time = $5, end_time = $6,
         venue = $7, address = $8, area = $9, district = $10, state = $11, contact_name = $12,
         contact_phone = $13, status = $14, updated_at = CURRENT_TIMESTAMP
     WHERE id = $15
     RETURNING *`,
    [
      name, organizer, description, date, start_time, end_time,
      venue, address, area, district, state, contact_name, contact_phone, status, id
    ]
  );
  return result.rows[0];
}

export async function deleteBloodCamp(id) {
  const result = await pool.query(
    `UPDATE blood_camps
     SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return result.rows[0];
}

export async function queryBloodInventory(filters = {}) {
  const params = [];
  const conditions = [];
  let paramIndex = 1;

  if (filters.bloodGroup && filters.bloodGroup !== 'All') {
    conditions.push(`bg.code = $${paramIndex}`);
    params.push(filters.bloodGroup);
    paramIndex++;
  }
  if (filters.state) {
    conditions.push(`bi.blood_bank_location ILIKE $${paramIndex}`);
    params.push(`%${filters.state}%`);
    paramIndex++;
  }
  if (filters.district) {
    conditions.push(`bi.blood_bank_location ILIKE $${paramIndex}`);
    params.push(`%${filters.district}%`);
    paramIndex++;
  }
  if (filters.area) {
    conditions.push(`bi.blood_bank_location ILIKE $${paramIndex}`);
    params.push(`%${filters.area}%`);
    paramIndex++;
  }
  if (filters.status && filters.status !== 'All') {
    let dbStatus = filters.status;
    if (filters.status.toUpperCase() === 'AVAILABLE') dbStatus = 'AVAILABLE';
    conditions.push(`bi.status = $${paramIndex}`);
    params.push(dbStatus);
    paramIndex++;
  }
  if (filters.component && filters.component !== 'All') {
    conditions.push(`bi.component = $${paramIndex}`);
    params.push(filters.component);
    paramIndex++;
  }

  if (filters.isCoordinator) {
    // Return all items for coordinator
  } else {
    conditions.push(`bi.status = 'AVAILABLE'`);
    conditions.push(`bi.expiration_date >= CURRENT_DATE`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `
    SELECT bi.*, bg.code as blood_group_name
    FROM blood_inventory bi
    JOIN blood_groups bg ON bi.blood_group_id = bg.id
    ${whereClause}
    ORDER BY bi.expiration_date ASC, bi.updated_at DESC
  `;

  const result = await pool.query(query, params);
  return result.rows;
}

export async function createBloodInventory(inventoryData) {
  const { blood_group_id, component, blood_bank_location, units, collection_date, expiration_date, status = 'AVAILABLE' } = inventoryData;
  const result = await pool.query(
    `INSERT INTO blood_inventory (blood_group_id, component, blood_bank_location, units, collection_date, expiration_date, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [blood_group_id, component, blood_bank_location, units, collection_date, expiration_date, status]
  );
  const fullItem = await pool.query(
    `SELECT bi.*, bg.code as blood_group_name
     FROM blood_inventory bi
     JOIN blood_groups bg ON bi.blood_group_id = bg.id
     WHERE bi.id = $1`,
    [result.rows[0].id]
  );
  return fullItem.rows[0];
}

export async function updateBloodInventory(id, inventoryData) {
  const { blood_group_id, component, blood_bank_location, units, collection_date, expiration_date, status } = inventoryData;
  const result = await pool.query(
    `UPDATE blood_inventory
     SET blood_group_id = $1, component = $2, blood_bank_location = $3, units = $4,
         collection_date = $5, expiration_date = $6, status = $7, updated_at = CURRENT_TIMESTAMP
     WHERE id = $8
     RETURNING *`,
    [blood_group_id, component, blood_bank_location, units, collection_date, expiration_date, status, id]
  );
  const fullItem = await pool.query(
    `SELECT bi.*, bg.code as blood_group_name
     FROM blood_inventory bi
     JOIN blood_groups bg ON bi.blood_group_id = bg.id
     WHERE bi.id = $1`,
    [id]
  );
  return fullItem.rows[0];
}

export async function deleteBloodInventory(id) {
  const result = await pool.query(
    `DELETE FROM blood_inventory WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows[0];
}

export async function getBloodGroups() {
  const result = await pool.query(`SELECT id, code, name FROM blood_groups ORDER BY id ASC`);
  return result.rows;
}

export async function writeAuditLog(actorId, action, entityType, entityId, metadata = {}) {
  const result = await pool.query(
    `INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [actorId, action, entityType, entityId, JSON.stringify(metadata)]
  );
  return result.rows[0];
}

export async function updateDonorResponseStatus(requestId, donorId, status, client = pool) {
  const result = await client.query(
    `UPDATE donor_responses
     SET response_status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE request_id = $2 AND donor_id = $3
     RETURNING *`,
    [status, requestId, donorId]
  );
  return result.rows[0];
}

export async function getDonorResponsesPaginated(coordinatorUserId, { page = 1, limit = 20, filter = 'ACTIVE', search = '' }) {
  const offset = (page - 1) * limit;
  const params = [coordinatorUserId];
  const conditions = ['cp.user_id = $1'];
  let paramIndex = 2;

  // Active / History Filter
  if (filter === 'ACTIVE') {
    conditions.push(`dr.response_status = 'ACCEPTED'`);
    conditions.push(`br.status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND')`);
    conditions.push(`ra.status IN ('ASSIGNED', 'IN_PROGRESS')`);
  } else {
    conditions.push(`(dr.response_status <> 'ACCEPTED' OR br.status IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND') OR ra.status NOT IN ('ASSIGNED', 'IN_PROGRESS'))`);
  }

  // Search Filter
  if (search && search.trim() !== '') {
    conditions.push(`(u.name ILIKE $${paramIndex} OR br.patient_name ILIKE $${paramIndex} OR br.hospital_name ILIKE $${paramIndex})`);
    params.push(`%${search.trim()}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(dr.id) as total
    FROM donor_responses dr
    JOIN blood_requests br ON dr.request_id = br.id
    JOIN donor_profiles dp ON dr.donor_id = dp.id
    JOIN users u ON dp.user_id = u.id
    JOIN request_assignments ra ON br.id = ra.request_id
    JOIN coordinator_profiles cp ON ra.coordinator_id = cp.id
    ${whereClause}
  `;
  
  const countRes = await pool.query(countQuery, params);
  const totalRecords = parseInt(countRes.rows[0]?.total || '0', 10);

  // Sorting
  let orderByClause = '';
  if (filter === 'ACTIVE') {
    orderByClause = `
      ORDER BY
        (CASE WHEN ra.status = 'ASSIGNED' AND ra.assigned_at < NOW() - INTERVAL '15 minutes' THEN 0 ELSE 1 END) ASC,
        (CASE WHEN br.urgency_level = 'EMERGENCY' THEN 0 WHEN br.urgency_level = 'URGENT' THEN 1 ELSE 2 END) ASC,
        dr.responded_at DESC,
        ra.assigned_at ASC
    `;
  } else {
    orderByClause = `ORDER BY dr.updated_at DESC, dr.responded_at DESC`;
  }

  // Get data
  const dataParams = [...params, offset, limit];
  const dataQuery = `
    SELECT dr.id as response_id, dr.response_status, dr.responded_at, dr.notes,
           br.id as request_id, br.patient_name, br.hospital_name, br.location, br.urgency_level, br.status as request_status,
           bg.code as blood_group,
           u.name as donor_name, u.email as donor_email, u.phone as donor_phone,
           ra.status as assignment_status, ra.assigned_at,
           (ra.status = 'ASSIGNED' AND ra.assigned_at < NOW() - INTERVAL '15 minutes') as is_overdue
    FROM donor_responses dr
    JOIN blood_requests br ON dr.request_id = br.id
    JOIN blood_groups bg ON br.blood_group_id = bg.id
    JOIN donor_profiles dp ON dr.donor_id = dp.id
    JOIN users u ON dp.user_id = u.id
    JOIN request_assignments ra ON br.id = ra.request_id
    JOIN coordinator_profiles cp ON ra.coordinator_id = cp.id
    ${whereClause}
    ${orderByClause}
    OFFSET $${paramIndex} LIMIT $${paramIndex + 1}
  `;

  const dataRes = await pool.query(dataQuery, dataParams);
  
  return {
    responses: dataRes.rows,
    totalRecords,
    page,
    limit,
    totalPages: Math.ceil(totalRecords / limit)
  };
}

export async function getFollowUpsPaginated(coordinatorUserId, { page = 1, limit = 20, filter = 'ALL', search = '' }) {
  const offset = (page - 1) * limit;
  const params = [coordinatorUserId];
  const conditions = [
    'cp.user_id = $1',
    `br.status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND')`,
    `ra.status IN ('ASSIGNED', 'IN_PROGRESS')`
  ];
  let paramIndex = 2;

  // Filter tabs
  if (filter === 'OVERDUE') {
    conditions.push(`ra.status = 'ASSIGNED' AND ra.assigned_at < NOW() - INTERVAL '15 minutes'`);
  } else if (filter === 'PENDING_ACTION') {
    conditions.push(`br.status IN ('DONOR_RESPONDED', 'COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED')`);
  }

  // Search Filter
  if (search && search.trim() !== '') {
    conditions.push(`(u.name ILIKE $${paramIndex} OR br.patient_name ILIKE $${paramIndex} OR br.hospital_name ILIKE $${paramIndex})`);
    params.push(`%${search.trim()}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(ra.id) as total
    FROM request_assignments ra
    JOIN blood_requests br ON ra.request_id = br.id
    JOIN coordinator_profiles cp ON ra.coordinator_id = cp.id
    LEFT JOIN donor_responses dr ON dr.request_id = br.id AND dr.response_status = 'ACCEPTED'
    LEFT JOIN donor_profiles dp ON dr.donor_id = dp.id
    LEFT JOIN users u ON dp.user_id = u.id
    ${whereClause}
  `;
  
  const countRes = await pool.query(countQuery, params);
  const totalRecords = parseInt(countRes.rows[0]?.total || '0', 10);

  // Sorting
  const orderByClause = `
    ORDER BY
      (CASE WHEN ra.status = 'ASSIGNED' AND ra.assigned_at < NOW() - INTERVAL '15 minutes' THEN 0 ELSE 1 END) ASC,
      (CASE WHEN br.urgency_level = 'EMERGENCY' THEN 0 WHEN br.urgency_level = 'URGENT' THEN 1 ELSE 2 END) ASC,
      dr.responded_at DESC,
      ra.assigned_at ASC
  `;

  // Get data
  const dataParams = [...params, offset, limit];
  const dataQuery = `
    SELECT br.id as request_id, br.patient_name, br.hospital_name, br.location, br.urgency_level, br.status as request_status,
           bg.code as blood_group,
           u.name as donor_name, u.email as donor_email, u.phone as donor_phone,
           ra.status as assignment_status, ra.assigned_at,
           (ra.status = 'ASSIGNED' AND ra.assigned_at < NOW() - INTERVAL '15 minutes') as is_overdue,
           (CASE 
             WHEN ra.status = 'ASSIGNED' AND ra.assigned_at < NOW() - INTERVAL '15 minutes' THEN 'ACTION_OVERDUE'
             WHEN br.status = 'DONOR_RESPONDED' THEN 'INITIAL_CONTACT_PENDING'
             WHEN br.status = 'COORDINATOR_ASSIGNED' THEN 'VISIT_CONFIRMATION_PENDING'
             WHEN br.status = 'DONOR_CONFIRMED' AND dp.eligibility_status = 'PENDING' THEN 'SCREENING_PENDING'
             WHEN br.status = 'DONOR_CONFIRMED' AND dp.eligibility_status = 'ELIGIBLE' THEN 'DONATION_LOG_PENDING'
             ELSE 'GENERAL_FOLLOWUP'
            END) as followup_reason
    FROM request_assignments ra
    JOIN blood_requests br ON ra.request_id = br.id
    JOIN blood_groups bg ON br.blood_group_id = bg.id
    JOIN coordinator_profiles cp ON ra.coordinator_id = cp.id
    LEFT JOIN donor_responses dr ON dr.request_id = br.id AND dr.response_status = 'ACCEPTED'
    LEFT JOIN donor_profiles dp ON dr.donor_id = dp.id
    LEFT JOIN users u ON dp.user_id = u.id
    ${whereClause}
    ${orderByClause}
    OFFSET $${paramIndex} LIMIT $${paramIndex + 1}
  `;

  const dataRes = await pool.query(dataQuery, dataParams);
  
  return {
    followUps: dataRes.rows,
    totalRecords,
    page,
    limit,
    totalPages: Math.ceil(totalRecords / limit)
  };
}





