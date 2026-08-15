import api from './authService';

export const getStats = async () => {
  const response = await api.get('/admin/stats');
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

export const getAuditLogs = async () => {
  const response = await api.get('/admin/audit-logs');
  return response.data;
};
