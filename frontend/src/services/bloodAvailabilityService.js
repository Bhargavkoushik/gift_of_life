import api from './authService';

/**
 * Fetches public blood availability details based on the selected search filters.
 * @param {Object} filters - Search and filtering criteria (bloodGroup, state, district, area, status, component)
 * @returns {Promise<Array>} List of blood inventory records matching the filters
 */
export const getBloodAvailability = async (filters = {}) => {
  const response = await api.get('/blood-availability', { params: filters });
  return response.data; // Expected format: Array of inventory items
};
