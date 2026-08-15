import api from './authService';

export const getDonorProfile = async () => {
  const response = await api.get('/donor/profile');
  return response.data.profile;
};

export const updateDonorProfile = async (profileData) => {
  const response = await api.put('/donor/profile', profileData);
  return response.data.profile;
};

export const getDonorAvailability = async () => {
  const response = await api.get('/donor/availability');
  return response.data.availability;
};

export const updateDonorAvailability = async (availabilityStatus) => {
  const response = await api.put('/donor/availability', { availability_status: availabilityStatus });
  return response.data.availability_status;
};

export const getMatchingRequests = async () => {
  const response = await api.get('/donor/requests');
  return response.data.requests;
};

export const respondToRequest = async (requestId, responseStatus, notes = '') => {
  const response = await api.post(`/donor/requests/${requestId}/respond`, {
    response_status: responseStatus,
    notes
  });
  return response.data;
};

export const completeDonation = async (requestId) => {
  const response = await api.post(`/donor/requests/${requestId}/complete`);
  return response.data;
};

export const getDonationHistory = async () => {
  const response = await api.get('/donor/history');
  return response.data.history;
};

export const getNotifications = async () => {
  const response = await api.get('/donor/notifications');
  return response.data.notifications;
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await api.post(`/donor/notifications/${notificationId}/read`);
  return response.data.notification;
};
