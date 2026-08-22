import * as coordinatorRepository from './repository.js';
import * as donorRepository from '../donors/repository.js';
import pool from '../../database/connection.js';

async function verifyAssignment(requestId, coordinatorUserId) {
  const assignment = await coordinatorRepository.getActiveAssignment(requestId, coordinatorUserId);
  if (!assignment) {
    const err = new Error('Access denied: You are not authorized to view or manage this request.');
    err.statusCode = 403;
    throw err;
  }
  return assignment;
}

async function verifyViewAssignment(requestId, coordinatorUserId) {
  const assignment = await coordinatorRepository.getAssignment(requestId, coordinatorUserId);
  if (!assignment) {
    const err = new Error('Access denied: You are not authorized to view this request.');
    err.statusCode = 403;
    throw err;
  }
  return assignment;
}

export async function getAssignedRequests(coordinatorUserId) {
  return await coordinatorRepository.getAssignedRequests(coordinatorUserId);
}

export async function getRequestDetails(requestId, coordinatorUserId) {
  await verifyViewAssignment(requestId, coordinatorUserId);
  const request = await coordinatorRepository.getRequestDetails(requestId);
  if (!request) {
    const err = new Error('Blood request not found');
    err.statusCode = 404;
    throw err;
  }
  const responses = await coordinatorRepository.getRequestDonorResponses(requestId);
  return { request, responses };
}

export async function coordinateRequest(requestId, coordinatorUserId) {
  await verifyAssignment(requestId, coordinatorUserId);
  const request = await coordinatorRepository.getRequestDetails(requestId);
  if (!request) {
    const err = new Error('Blood request not found');
    err.statusCode = 404;
    throw err;
  }
  if (['FULFILLED', 'CANCELLED', 'REJECTED'].includes(request.status)) {
    const err = new Error('Request is already completed or closed');
    err.statusCode = 400;
    throw err;
  }
  await coordinatorRepository.updateRequestStatus(requestId, 'COORDINATOR_ASSIGNED');
  await coordinatorRepository.updateAssignmentStatus(requestId, coordinatorUserId, 'IN_PROGRESS');
  return { success: true };
}

export async function confirmVisit(requestId, coordinatorUserId) {
  await verifyAssignment(requestId, coordinatorUserId);
  const request = await coordinatorRepository.getRequestDetails(requestId);
  if (!request) {
    const err = new Error('Blood request not found');
    err.statusCode = 404;
    throw err;
  }
  if (['FULFILLED', 'CANCELLED', 'REJECTED'].includes(request.status)) {
    const err = new Error('Request is already completed or closed');
    err.statusCode = 400;
    throw err;
  }
  return await coordinatorRepository.updateRequestStatus(requestId, 'DONOR_CONFIRMED');
}

export async function recordScreening(requestId, data, coordinatorUserId) {
  await verifyAssignment(requestId, coordinatorUserId);
  const request = await coordinatorRepository.getRequestDetails(requestId);
  if (!request) {
    const err = new Error('Blood request not found');
    err.statusCode = 404;
    throw err;
  }
  if (['FULFILLED', 'CANCELLED', 'REJECTED'].includes(request.status)) {
    const err = new Error('Request is already completed or closed');
    err.statusCode = 400;
    throw err;
  }

  const { donor_id, status, deferred_until } = data;
  if (!['ELIGIBLE', 'TEMPORARILY_DEFERRED', 'NOT_ELIGIBLE'].includes(status)) {
    const err = new Error('Invalid screening eligibility status');
    err.statusCode = 400;
    throw err;
  }

  // Update donor profile eligibility
  await coordinatorRepository.updateDonorEligibility(donor_id, status, deferred_until);

  // If deferred or ineligible, reset request status back to PENDING so other donors can help
  if (['TEMPORARILY_DEFERRED', 'NOT_ELIGIBLE'].includes(status)) {
    await coordinatorRepository.updateRequestStatus(requestId, 'PENDING');
    await coordinatorRepository.deactivateActiveAssignments(requestId);
    await coordinatorRepository.updateDonorResponseStatus(requestId, donor_id, 'REJECTED');
  }

  return { success: true };
}

export async function completeDonation(requestId, data, coordinatorUserId) {
  await verifyAssignment(requestId, coordinatorUserId);
  const { donor_id } = data;
  const donorProfile = await coordinatorRepository.getDonorProfileById(donor_id);
  if (!donorProfile) {
    const err = new Error('Donor profile not found');
    err.statusCode = 404;
    throw err;
  }

  // Call the core donorRepository completeDonation logic
  return await donorRepository.completeDonation(donorProfile.user_id, requestId, coordinatorUserId);
}

export async function getAvailability(coordinatorUserId) {
  const status = await coordinatorRepository.getCoordinatorAvailability(coordinatorUserId);
  return { availability_status: status || 'OFFLINE' };
}

export async function updateAvailability(coordinatorUserId, status) {
  if (!['AVAILABLE', 'OFFLINE'].includes(status)) {
    const err = new Error('Invalid availability status. Must be AVAILABLE or OFFLINE.');
    err.statusCode = 400;
    throw err;
  }
  const updatedStatus = await coordinatorRepository.updateCoordinatorAvailability(coordinatorUserId, status);
  return { availability_status: updatedStatus };
}

export async function getDashboardData(coordinatorUserId) {
  const [metrics, activeCases, completedCases] = await Promise.all([
    coordinatorRepository.getDashboardMetrics(coordinatorUserId),
    coordinatorRepository.getDashboardActiveCases(coordinatorUserId, 4),
    coordinatorRepository.getDashboardCompletedCases(coordinatorUserId, 4)
  ]);
  return {
    summary: {
      actionRequired: metrics.activeCount,
      inProgress: metrics.inProgressCount,
      completed: metrics.completedCount,
      cancelledRejected: metrics.cancelledCount
    },
    active: {
      total: metrics.activeCount + metrics.inProgressCount,
      items: activeCases
    },
    completed: {
      total: metrics.completedCount,
      items: completedCases
    }
  };
}

export async function getAssignedRequestsPaginated(coordinatorUserId, filters) {
  return await coordinatorRepository.getAssignedRequestsPaginated(coordinatorUserId, filters);
}

export async function getBloodCamps(filters) {
  return await coordinatorRepository.queryBloodCamps(filters);
}

export async function createBloodCamp(campData, actorId) {
  const result = await coordinatorRepository.createBloodCamp(campData, actorId);
  await coordinatorRepository.writeAuditLog(actorId, 'PUBLIC_CAMP_CREATED', 'CAMP', result.id, { name: result.name });
  return result;
}

export async function updateBloodCamp(id, campData, actorId) {
  const result = await coordinatorRepository.updateBloodCamp(id, campData);
  await coordinatorRepository.writeAuditLog(actorId, 'PUBLIC_CAMP_UPDATED', 'CAMP', id, { name: result.name });
  return result;
}

export async function deleteBloodCamp(id, actorId) {
  const result = await coordinatorRepository.deleteBloodCamp(id);
  await coordinatorRepository.writeAuditLog(actorId, 'PUBLIC_CAMP_DEACTIVATED', 'CAMP', id, { name: result.name });
  return result;
}

export async function getBloodAvailability(filters) {
  return await coordinatorRepository.queryBloodInventory(filters);
}

export async function createBloodInventory(inventoryData, actorId) {
  const result = await coordinatorRepository.createBloodInventory(inventoryData);
  await coordinatorRepository.writeAuditLog(actorId, 'PUBLIC_BLOOD_AVAILABILITY_UPDATED', 'INVENTORY', result.id, {
    action: 'CREATE',
    blood_group: result.blood_group_name,
    component: result.component,
    units: result.units
  });
  return result;
}

export async function updateBloodInventory(id, inventoryData, actorId) {
  const result = await coordinatorRepository.updateBloodInventory(id, inventoryData);
  await coordinatorRepository.writeAuditLog(actorId, 'PUBLIC_BLOOD_AVAILABILITY_UPDATED', 'INVENTORY', id, {
    action: 'UPDATE',
    blood_group: result.blood_group_name,
    component: result.component,
    units: result.units
  });
  return result;
}

export async function deleteBloodInventory(id, actorId) {
  const result = await coordinatorRepository.deleteBloodInventory(id);
  if (result) {
    await coordinatorRepository.writeAuditLog(actorId, 'PUBLIC_BLOOD_AVAILABILITY_UPDATED', 'INVENTORY', id, {
      action: 'DELETE',
      units: result.units
    });
  }
  return result;
}

export async function getBloodGroups() {
  return await coordinatorRepository.getBloodGroups();
}

export async function releaseDonor(requestId, donorId, reason, coordinatorUserId) {
  // 1. Verify coordinator assignment IDOR protection
  await verifyAssignment(requestId, coordinatorUserId);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 2. Fetch request details and check if terminal
    const reqDetails = await coordinatorRepository.getRequestDetails(requestId);
    if (!reqDetails) {
      const err = new Error('Blood request not found');
      err.statusCode = 404;
      throw err;
    }
    if (['FULFILLED', 'CANCELLED', 'REJECTED'].includes(reqDetails.status)) {
      const err = new Error('Request is already completed or closed');
      err.statusCode = 400;
      throw err;
    }

    // 3. Verify specific donor response is currently ACCEPTED
    const donorRespRes = await client.query(
      `SELECT response_status FROM donor_responses WHERE request_id = $1 AND donor_id = $2`,
      [requestId, donorId]
    );
    if (donorRespRes.rows.length === 0 || donorRespRes.rows[0].response_status !== 'ACCEPTED') {
      const err = new Error('No active accepted response found for this donor on this request');
      err.statusCode = 400;
      throw err;
    }

    // 4. Update donor response status to REJECTED with notes
    const notes = reason 
      ? `Donor cannot continue: ${reason.trim()}` 
      : 'Donor cannot continue: Coordinator recorded release';
      
    await client.query(
      `UPDATE donor_responses
       SET response_status = 'REJECTED', notes = $1, updated_at = CURRENT_TIMESTAMP
       WHERE request_id = $2 AND donor_id = $3`,
      [notes, requestId, donorId]
    );

    // 5. Reset request status back to PENDING so other donors can claim it
    await coordinatorRepository.updateRequestStatus(requestId, 'PENDING', client);

    // 6. Deactivate coordinator assignments for this request
    await coordinatorRepository.deactivateActiveAssignments(requestId, client);

    // 7. Write audit log
    await coordinatorRepository.writeAuditLog(
      coordinatorUserId,
      'COORDINATOR_RELEASED_DONOR',
      'BLOOD_REQUEST',
      requestId,
      { donor_id: donorId, reason: reason || 'Not specified' },
      client
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

export async function getDonorResponses(coordinatorUserId, query) {
  return await coordinatorRepository.getDonorResponsesPaginated(coordinatorUserId, query);
}

export async function getFollowUps(coordinatorUserId, query) {
  return await coordinatorRepository.getFollowUpsPaginated(coordinatorUserId, query);
}


