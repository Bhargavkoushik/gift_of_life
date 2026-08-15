import api from './authService';

export const getCoordinatorRequests = async () => {
  const response = await api.get('/coordinator/requests');
  return response.data.requests;
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
