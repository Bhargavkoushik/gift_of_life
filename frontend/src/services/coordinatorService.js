import api from './authService';

export const getCoordinatorRequests = async (params = {}) => {
  const response = await api.get('/coordinator/requests', { params });
  return response.data;
};

export const getCoordinatorRequestDetails = async (id) => {
  const response = await api.get(`/coordinator/requests/${id}`);
  return response.data;
};

export const coordinateRequest = async (id) => {
  const response = await api.post(`/coordinator/requests/${id}/coordinate`);
  return response.data;
};

export const confirmVisit = async (id) => {
  const response = await api.post(`/coordinator/requests/${id}/confirm-visit`);
  return response.data;
};

export const recordScreening = async (id, donorId, status, deferredUntil = null) => {
  const response = await api.post(`/coordinator/requests/${id}/screening`, {
    donor_id: donorId,
    status,
    deferred_until: deferredUntil
  });
  return response.data;
};

export const completeDonationByCoordinator = async (id, donorId) => {
  const response = await api.post(`/coordinator/requests/${id}/complete-donation`, {
    donor_id: donorId
  });
  return response.data;
};

export const getCoordinatorAvailability = async () => {
  const response = await api.get('/coordinator/availability');
  return response.data;
};

export const updateCoordinatorAvailability = async (status) => {
  const response = await api.put('/coordinator/availability', { status });
  return response.data;
};

export const getCoordinatorDashboardData = async () => {
  const response = await api.get('/coordinator/dashboard');
  return response.data;
};
