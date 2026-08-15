import * as coordinatorRepository from './repository.js';
import * as donorRepository from '../donors/repository.js';

export async function getAssignedRequests(coordinatorUserId) {
  return await coordinatorRepository.getAssignedRequests(coordinatorUserId);
}

export async function getRequestDetails(requestId) {
  const request = await coordinatorRepository.getRequestDetails(requestId);
  if (!request) {
    const err = new Error('Blood request not found');
    err.statusCode = 404;
    throw err;
  }
  const responses = await coordinatorRepository.getRequestDonorResponses(requestId);
  return { request, responses };
}

export async function coordinateRequest(requestId) {
  const request = await coordinatorRepository.getRequestDetails(requestId);
  if (!request) {
    const err = new Error('Blood request not found');
    err.statusCode = 404;
    throw err;
  }
  return await coordinatorRepository.updateRequestStatus(requestId, 'COORDINATOR_ASSIGNED');
}

export async function confirmVisit(requestId) {
  const request = await coordinatorRepository.getRequestDetails(requestId);
  if (!request) {
    const err = new Error('Blood request not found');
    err.statusCode = 404;
    throw err;
  }
  return await coordinatorRepository.updateRequestStatus(requestId, 'DONOR_CONFIRMED');
}

export async function recordScreening(requestId, data) {
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
  }

  return { success: true };
}

export async function completeDonation(requestId, data, coordinatorUserId) {
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
