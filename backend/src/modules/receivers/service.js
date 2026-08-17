import * as receiverRepository from './repository.js';
import pool from '../../database/connection.js';

export async function getReceiverProfile(userId) {
  const profile = await receiverRepository.getReceiverProfileByUserId(userId);
  if (!profile) {
    const err = new Error('Receiver profile not found');
    err.statusCode = 404;
    throw err;
  }
  return profile;
}

export async function updateReceiverProfile(userId, data) {
  await getReceiverProfile(userId); // checks if exists
  return await receiverRepository.updateReceiverProfile(userId, data);
}

export async function createRequest(userId, requestData) {
  const profile = await receiverRepository.getReceiverProfileByUserId(userId);
  if (!profile) {
    const err = new Error('Receiver profile not found');
    err.statusCode = 404;
    throw err;
  }

  // Resolve blood group code to ID
  const bloodGroupId = await receiverRepository.getBloodGroupIdByCode(requestData.blood_group);
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

  const dataToInsert = {
    ...requestData,
    blood_group_id: bloodGroupId
  };

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const request = await receiverRepository.createBloodRequest(profile.id, dataToInsert);

    // Write audit log
    await receiverRepository.writeAuditLog(userId, 'RECEIVER_REQUEST_CREATED', 'REQUEST', request.id, {
      patient_name: request.patient_name,
      blood_group: requestData.blood_group
    });

    // Write in-app notification
    await client.query(
      `INSERT INTO notifications (user_id, request_id, type, channel, title, message, status)
       VALUES ($1, $2, 'REQUEST_STATUS', 'IN_APP', 'Request Submitted', 'Your request for blood has been submitted successfully and is awaiting review.', 'PENDING')`,
      [userId, request.id]
    );

    await client.query('COMMIT');
    return request;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getRequests(userId) {
  const profile = await getReceiverProfile(userId);
  const activeStatuses = ['PENDING', 'APPROVED', 'DONORS_ALERTED', 'DONOR_RESPONDED', 'COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED'];
  return await receiverRepository.getReceiverRequests(profile.id, activeStatuses);
}

export async function getHistory(userId) {
  const profile = await getReceiverProfile(userId);
  const historyStatuses = ['FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND'];
  return await receiverRepository.getReceiverRequests(profile.id, historyStatuses);
}

export async function getRequestDetails(userId, requestId) {
  const profile = await getReceiverProfile(userId);
  const request = await receiverRepository.getRequestDetails(requestId, profile.id);
  if (!request) {
    const err = new Error('Blood request not found');
    err.statusCode = 404;
    throw err;
  }

  const donorResponsesCount = await receiverRepository.getDonorResponsesCount(requestId);

  const milestones = [
    { key: 'created', label: 'Request Created', completed: true, timestamp: request.created_at },
    {
      key: 'notified',
      label: 'Donors Notified',
      completed: ['APPROVED', 'DONORS_ALERTED', 'DONOR_RESPONDED', 'COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED', 'FULFILLED'].includes(request.status),
      timestamp: ['APPROVED', 'DONORS_ALERTED', 'DONOR_RESPONDED', 'COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED', 'FULFILLED'].includes(request.status) ? request.updated_at : null
    },
    {
      key: 'donor_found',
      label: 'Donor Found',
      completed: ['DONOR_RESPONDED', 'COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED', 'FULFILLED'].includes(request.status) || donorResponsesCount > 0,
      timestamp: ['DONOR_RESPONDED', 'COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED', 'FULFILLED'].includes(request.status) ? request.updated_at : null
    },
    {
      key: 'coordinating',
      label: 'Donation Being Coordinated',
      completed: ['COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED', 'FULFILLED'].includes(request.status),
      timestamp: ['COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED', 'FULFILLED'].includes(request.status) ? request.updated_at : null
    },
    {
      key: 'completed',
      label: 'Donation Completed',
      completed: request.status === 'FULFILLED',
      timestamp: request.status === 'FULFILLED' ? request.closed_at || request.updated_at : null
    }
  ];

  if (request.status === 'CANCELLED') {
    milestones.push({
      key: 'cancelled',
      label: 'Request Cancelled',
      completed: true,
      timestamp: request.closed_at
    });
  }

  return { request, donorResponsesCount, milestones };
}

export async function cancelRequest(userId, requestId) {
  const profile = await getReceiverProfile(userId);
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const request = await receiverRepository.cancelBloodRequest(requestId, profile.id);
    if (!request) {
      const err = new Error('Blood request not found or cannot be cancelled at this stage');
      err.statusCode = 400;
      throw err;
    }

    // Write audit log
    await receiverRepository.writeAuditLog(userId, 'RECEIVER_REQUEST_CANCELLED', 'REQUEST', request.id, {
      patient_name: request.patient_name
    });

    // Write notification
    await client.query(
      `INSERT INTO notifications (user_id, request_id, type, channel, title, message, status)
       VALUES ($1, $2, 'REQUEST_STATUS', 'IN_APP', 'Request Cancelled', 'Your request for blood has been successfully cancelled.', 'PENDING')`,
      [userId, request.id]
    );

    // Deactivate active coordinator assignments
    await client.query(
      `UPDATE request_assignments 
       SET status = 'REASSIGNED', completed_at = CURRENT_TIMESTAMP 
       WHERE request_id = $1 AND status IN ('ASSIGNED', 'IN_PROGRESS')`,
      [request.id]
    );

    await client.query('COMMIT');
    return request;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getDashboardStats(userId) {
  const profile = await getReceiverProfile(userId);
  const allRequests = await receiverRepository.getReceiverRequests(profile.id);

  const activeStatuses = ['PENDING', 'APPROVED', 'DONORS_ALERTED', 'DONOR_RESPONDED', 'COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED'];
  const coordinatingStatuses = ['COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED'];

  const activeRequests = allRequests.filter(r => activeStatuses.includes(r.status));
  const coordinatingRequests = allRequests.filter(r => coordinatingStatuses.includes(r.status));
  const fulfilledRequests = allRequests.filter(r => r.status === 'FULFILLED');

  // Sum donor responses across all receiver requests
  let donorResponses = 0;
  for (const r of allRequests) {
    const count = await receiverRepository.getDonorResponsesCount(r.id);
    donorResponses += count;
  }

  // Find most important active request (Emergency/Urgent first, then oldest required date)
  let primaryRequest = null;
  if (activeRequests.length > 0) {
    primaryRequest = [...activeRequests].sort((a, b) => {
      const urgencyRank = { 'EMERGENCY': 3, 'URGENT': 2, 'NORMAL': 1 };
      const rankA = urgencyRank[a.urgency_level] || 1;
      const rankB = urgencyRank[b.urgency_level] || 1;
      if (rankA !== rankB) return rankB - rankA;
      return new Date(a.required_date_time) - new Date(b.required_date_time);
    })[0];
  }

  const recentRequests = allRequests.slice(0, 5);

  return {
    metrics: {
      activeRequests: activeRequests.length,
      coordinatingRequests: coordinatingRequests.length,
      donorResponses,
      fulfilledRequests: fulfilledRequests.length
    },
    primaryRequest,
    recentRequests
  };
}

export async function getNotifications(userId) {
  return await receiverRepository.getNotifications(userId);
}

export async function markNotificationAsRead(notificationId, userId) {
  const notification = await receiverRepository.markNotificationAsRead(notificationId, userId);
  if (!notification) {
    const err = new Error('Notification not found');
    err.statusCode = 404;
    throw err;
  }
  return notification;
}
