import api from './authService';

/**
 * Fetches upcoming blood donation camps based on search, location, and date filters.
 * @param {Object} filters - Search and filtering criteria
 * @returns {Promise<Array>} List of blood camp records
 */
export const getBloodCamps = async (filters = {}) => {
  const response = await api.get('/blood-camps', { params: filters });
  return response.data;
};

export const getCoordinatorCamps = async (filters = {}) => {
  const response = await api.get('/coordinator/public-site/camps', { params: filters });
  return response.data;
};

export const createCoordinatorCamp = async (campData) => {
  const response = await api.post('/coordinator/public-site/camps', campData);
  return response.data;
};

export const updateCoordinatorCamp = async (id, campData) => {
  const response = await api.put(`/coordinator/public-site/camps/${id}`, campData);
  return response.data;
};

export const deleteCoordinatorCamp = async (id) => {
  const response = await api.delete(`/coordinator/public-site/camps/${id}`);
  return response.data;
};
