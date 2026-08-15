import api from './authService';

export const getReceiverProfile = async () => {
  const response = await api.get('/receiver/profile');
  return response.data.profile;
};

export const updateReceiverProfile = async (profileData) => {
  const response = await api.put('/receiver/profile', profileData);
  return response.data.profile;
};

export const getDashboardStats = async () => {
  const response = await api.get('/receiver/dashboard-stats');
  return response.data;
};

export const createBloodRequest = async (requestData) => {
  const response = await api.post('/receiver/requests', requestData);
  return response.data.request;
};

export const getActiveRequests = async () => {
  const response = await api.get('/receiver/requests');
  return response.data.requests;
};

export const getRequestDetails = async (id) => {
  const response = await api.get(`/receiver/requests/${id}`);
  return response.data;
};

export const getHistoryRequests = async () => {
  const response = await api.get('/receiver/history');
  return response.data.history;
};

export const cancelRequest = async (id) => {
  const response = await api.patch(`/receiver/requests/${id}/cancel`);
  return response.data.request;
};

export const getNotifications = async () => {
  const response = await api.get('/receiver/notifications');
  return response.data.notifications;
};

export const markNotificationAsRead = async (id) => {
  const response = await api.post(`/receiver/notifications/${id}/read`);
  return response.data.notification;
};
