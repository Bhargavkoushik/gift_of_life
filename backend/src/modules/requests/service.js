import * as requestsRepository from './repository.js';
import pool from '../../database/connection.js';

export async function createBloodRequest(actorId, actorRole, requestData) {
  // Resolve blood group code to ID
  const bloodGroupId = await requestsRepository.getBloodGroupIdByCode(requestData.blood_group);
  if (!bloodGroupId) {
    const err = new Error('Invalid blood group code selection');
    err.statusCode = 400;
    throw err;
  }

  // Validate required_date_time in future
  const reqDate = new Date(requestData.required_date_time);
  if (reqDate < new Date()) {
    const err = new Error('Required date and time must be in the future');
    err.statusCode = 400;
    throw err;
  }

  const queryData = {
    patient_name: requestData.patient_name,
    hospital_name: requestData.hospital_name,
    blood_group_id: bloodGroupId,
    required_units: parseInt(requestData.required_units, 10),
    location: requestData.location
  };

  // 1. Check for duplicates in a SELECT first (to return the existing ID in a 409)
  const existingId = await requestsRepository.checkActiveDuplicate(queryData);
  if (existingId) {
    const err = new Error('A matching active blood request already exists.');
    err.statusCode = 409;
    err.code = 'DUPLICATE_ACTIVE_REQUEST';
    err.requestId = existingId;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 2. Perform the insertion
    const dataToInsert = {
      receiver_id: requestData.receiver_id || null,
      blood_group_id: bloodGroupId,
      required_units: queryData.required_units,
      patient_name: requestData.patient_name,
      hospital_name: requestData.hospital_name,
      hospital_address: requestData.hospital_address,
      location: requestData.location,
      required_date_time: requestData.required_date_time,
      urgency_level: requestData.urgency_level,
      description: requestData.description || null,
      created_by_user_id: actorId,
      created_by_role: actorRole
    };

    let request;
    try {
      request = await requestsRepository.createBloodRequest(dataToInsert, client);
    } catch (dbErr) {
      // 3. Catch unique_violation race-condition error (code 23505)
      if (dbErr.code === '23505') {
        const raceExistingId = await requestsRepository.checkActiveDuplicate(queryData, client);
        const err = new Error('A matching active blood request already exists.');
        err.statusCode = 409;
        err.code = 'DUPLICATE_ACTIVE_REQUEST';
        err.requestId = raceExistingId || null;
        throw err;
      }
      throw dbErr;
    }

    // Write audit log
    await requestsRepository.writeAuditLog(
      actorId,
      'REQUEST_CREATED',
      'REQUEST',
      request.id,
      {
        patient_name: request.patient_name,
        blood_group: requestData.blood_group,
        created_by_role: actorRole
      },
      client
    );

    // If request has receiver_id, send notification to the receiver user
    if (requestData.receiver_user_id) {
      await client.query(
        `INSERT INTO notifications (user_id, request_id, type, channel, title, message, status)
         VALUES ($1, $2, 'REQUEST_STATUS', 'IN_APP', 'Request Submitted', 'Your request for blood has been submitted successfully and is awaiting review.', 'PENDING')`,
        [requestData.receiver_user_id, request.id]
      );
    }

    await client.query('COMMIT');
    return request;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getBloodRequestDetails(requestId) {
  const request = await requestsRepository.getBloodRequestDetails(requestId);
  if (!request) {
    const err = new Error('Request details not found');
    err.statusCode = 404;
    throw err;
  }
  return request;
}

export async function cancelBloodRequest(requestId, actorId, actorRole) {
  // First retrieve details to check authorization
  const request = await requestsRepository.getBloodRequestDetails(requestId);
  if (!request) {
    const err = new Error('Request not found');
    err.statusCode = 404;
    throw err;
  }

  // Auth check: Receiver can only cancel their own request.
  if (actorRole === 'RECEIVER' && request.created_by_user_id !== actorId) {
    const err = new Error('Unauthorized to cancel this request');
    err.statusCode = 403;
    throw err;
  }

  // Blood Bank Admin can cancel their own created request.
  if (actorRole === 'BLOOD_BANK_ADMIN' && request.created_by_user_id !== actorId) {
    const err = new Error('Unauthorized to cancel this request');
    err.statusCode = 403;
    throw err;
  }

  const updated = await requestsRepository.cancelBloodRequest(requestId);
  if (!updated) {
    const err = new Error('Failed to cancel request. It may already be fulfilled or cancelled.');
    err.statusCode = 400;
    throw err;
  }

  // Log audit
  await requestsRepository.writeAuditLog(actorId, 'REQUEST_CANCELLED', 'REQUEST', requestId, {
    cancelled_by_role: actorRole
  });

  return updated;
}

export async function getRequests() {
  return await requestsRepository.getRequests();
}
