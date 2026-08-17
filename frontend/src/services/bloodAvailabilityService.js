import api from './authService';

/**
 * Fetches public blood availability details.
 * @param {Object} filters - Search and filtering criteria
 * @returns {Promise<Array>} List of blood inventory records
 */
export const getBloodAvailability = async (filters = {}) => {
  const response = await api.get('/blood-availability', { params: filters });
  return response.data;
};

export const getCoordinatorInventory = async (filters = {}) => {
  const response = await api.get('/coordinator/public-site/blood-availability', { params: filters });
  return response.data;
};

export const createCoordinatorInventory = async (inventoryData) => {
  const response = await api.post('/coordinator/public-site/blood-availability', inventoryData);
  return response.data;
};

export const updateCoordinatorInventory = async (id, inventoryData) => {
  const response = await api.put(`/coordinator/public-site/blood-availability/${id}`, inventoryData);
  return response.data;
};

export const deleteCoordinatorInventory = async (id) => {
  const response = await api.delete(`/coordinator/public-site/blood-availability/${id}`);
  return response.data;
};

export const getBloodGroups = async () => {
  const response = await api.get('/coordinator/blood-groups');
  return response.data;
};
