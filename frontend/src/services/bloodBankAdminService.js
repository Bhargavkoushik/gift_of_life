import api from './authService';

export const getRequests = async () => {
  const response = await api.get('/blood-bank-admin/requests');
  return response.data.requests;
};

export const createBloodRequest = async (requestData) => {
  const response = await api.post('/blood-bank-admin/requests', requestData);
  return response.data.request;
};

export const getRequestDetails = async (id) => {
  const response = await api.get(`/blood-bank-admin/requests/${id}`);
  return response.data.request;
};

export const cancelRequest = async (id) => {
  const response = await api.patch(`/blood-bank-admin/requests/${id}/cancel`);
  return response.data.request;
};
