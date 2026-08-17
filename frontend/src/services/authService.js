import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Axios interceptor to attach Bearer Token to outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const register = async (name, email, phone, password) => {
  const response = await api.post('/auth/register', { name, email, phone, password });
  return response.data;
};

export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data.user;
};

export const becomeDonor = async (donorData) => {
  const response = await api.post('/auth/roles/donor', donorData);
  return response.data;
};

export const becomeReceiver = async (receiverData) => {
  const response = await api.post('/auth/roles/receiver', receiverData);
  return response.data;
};

export const validateInvitation = async (token) => {
  const response = await api.get(`/auth/invitations/validate?token=${token}`);
  return response.data;
};

export const acceptInvitation = async (invitationData) => {
  const response = await api.post('/auth/invitations/accept', invitationData);
  return response.data;
};

export const forgotPassword = async (identifier) => {
  const response = await api.post('/auth/forgot-password', { identifier });
  return response.data;
};

export const resetPassword = async (token, password, confirmPassword) => {
  const response = await api.post('/auth/reset-password', { token, password, confirmPassword });
  return response.data;
};

export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  const response = await api.post('/auth/change-password', { currentPassword, newPassword, confirmPassword });
  return response.data;
};

export const updateProfile = async (name, phone) => {
  const response = await api.put('/auth/profile', { name, phone });
  return response.data;
};

export const logoutServer = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export default api;
