import jwt from 'jsonwebtoken';
import * as donorRepository from './repository.js';

export async function getDonorProfile(userId) {
  const profile = await donorRepository.getDonorProfileByUserId(userId);
  if (!profile) {
    const err = new Error('Donor profile not found');
    err.statusCode = 404;
    throw err;
  }
  return profile;
}

export async function updateDonorProfile(userId, data) {
  const updatedProfile = await donorRepository.updateDonorProfile(userId, data);
  if (!updatedProfile) {
    const err = new Error('Failed to update donor profile');
    err.statusCode = 500;
    throw err;
  }
  return updatedProfile;
}

export async function getDonorAvailability(userId) {
  const availability = await donorRepository.getDonorAvailability(userId);
  if (!availability) {
    const err = new Error('Donor availability profile not found');
    err.statusCode = 404;
    throw err;
  }
  return availability;
}

export async function updateDonorAvailability(userId, availabilityStatus) {
  if (!['AVAILABLE', 'NOT_AVAILABLE'].includes(availabilityStatus)) {
    const err = new Error('Invalid availability status');
    err.statusCode = 400;
    throw err;
  }
  const updated = await donorRepository.updateDonorAvailability(userId, availabilityStatus);
  return updated;
}

export async function getMatchingRequests(userId) {
  const profile = await donorRepository.getDonorProfileByUserId(userId);
  if (!profile) {
    return [];
  }
  const requests = await donorRepository.getMatchingRequests(userId);
  return requests.map(req => {
    const token = jwt.sign(
      { donor_profile_id: profile.id, request_id: req.id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1d' }
    );
    return {
      ...req,
      donor_profile_id: profile.id,
      donor_token: token
    };
  });
}

export async function respondToRequest(userId, requestId, status, notes) {
  if (!['ACCEPTED', 'REJECTED'].includes(status)) {
    const err = new Error('Invalid response status');
    err.statusCode = 400;
    throw err;
  }
  return await donorRepository.respondToRequest(userId, requestId, status, notes);
}

export async function completeDonation(userId, requestId) {
  return await donorRepository.completeDonation(userId, requestId);
}

export async function getDonationHistory(userId) {
  return await donorRepository.getDonationHistory(userId);
}

export async function getNotifications(userId) {
  return await donorRepository.getNotifications(userId);
}

export async function markNotificationAsRead(userId, notificationId) {
  return await donorRepository.markNotificationAsRead(userId, notificationId);
}
