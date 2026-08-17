import api from './authService';

export const getStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

export const getActiveStaff = async () => {
  const response = await api.get('/admin/active-staff');
  return response.data;
};

export const getStaff = async () => {
  const response = await api.get('/admin/staff');
  return response.data;
};

export const inviteStaff = async (name, email, role) => {
  const response = await api.post('/admin/invite', { name, email, role });
  return response.data;
};

export const reviewVerification = async (invitationId, action, notes) => {
  const response = await api.post(`/admin/invitations/${invitationId}/review`, { action, notes });
  return response.data;
};

export const resendInvitation = async (invitationId) => {
  const response = await api.post(`/admin/invitations/${invitationId}/resend`);
  return response.data;
};

export const revokeInvitation = async (invitationId) => {
  const response = await api.post(`/admin/invitations/${invitationId}/revoke`);
  return response.data;
};

export const deleteInvitation = async (invitationId) => {
  const response = await api.delete(`/admin/invitations/${invitationId}`);
  return response.data;
};

export const updateUserStatus = async (userId, status) => {
  const response = await api.post(`/admin/users/${userId}/status`, { status });
  return response.data;
};

export const getCoordinatorDetails = async (userId) => {
  const response = await api.get(`/admin/coordinators/${userId}/details`);
  return response.data;
};

export const getDonors = async (params) => {
  const response = await api.get('/admin/donors', { params });
  return response.data;
};

export const getDonorDetails = async (userId) => {
  const response = await api.get(`/admin/donors/${userId}/details`);
  return response.data;
};

export const getRequests = async (params) => {
  const response = await api.get('/admin/requests', { params });
  return response.data;
};

export const getRequestDetails = async (requestId) => {
  const response = await api.get(`/admin/requests/${requestId}/details`);
  return response.data;
};

export const getActiveCoordinators = async () => {
  const response = await api.get('/admin/coordinators/active');
  return response.data;
};

export const assignRequestCoordinator = async (requestId, coordinatorId) => {
  const response = await api.post(`/admin/requests/${requestId}/assign-coordinator`, { coordinatorId });
  return response.data;
};

export const cancelBloodRequest = async (requestId) => {
  const response = await api.post(`/admin/requests/${requestId}/cancel`);
  return response.data;
};

export const getAuditLogs = async (params) => {
  const response = await api.get('/admin/audit-logs', { params });
  return response.data;
};

export const deleteAuditLogs = async (ids) => {
  const response = await api.delete('/admin/audit-logs', { data: { ids } });
  return response.data;
};

export const getAdminDonations = async (params) => {
  const response = await api.get('/admin/donations', { params });
  return response.data;
};

export const getAdminDonationStats = async () => {
  const response = await api.get('/admin/donations/stats');
  return response.data;
};

export const getAdminReports = async (params) => {
  const response = await api.get('/admin/reports', { params });
  return response.data;
};

export const getAdminNotifications = async () => {
  const response = await api.get('/admin/notifications');
  return response.data;
};

export const markAdminNotificationRead = async (id) => {
  const response = await api.post(`/admin/notifications/${id}/read`);
  return response.data;
};

export const deleteAdminNotification = async (id) => {
  const response = await api.delete(`/admin/notifications/${id}`);
  return response.data;
};

export const sendEmergencyNotification = async (id) => {
  const response = await api.post(`/admin/notifications/${id}/send-emergency`);
  return response.data;
};

export const sendAdminReminder = async (id) => {
  const response = await api.post(`/admin/notifications/${id}/send-reminder`);
  return response.data;
};

export const reassignCoordinatorEscalation = async (id, newCoordinatorProfileId, reason) => {
  const response = await api.post(`/admin/notifications/${id}/reassign`, { newCoordinatorProfileId, reason });
  return response.data;
};
