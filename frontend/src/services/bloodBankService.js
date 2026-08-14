import api from './authService';

/**
 * Fetches registered blood banks based on search and location filters.
 * @param {Object} filters - Search and filtering criteria (name, state, district, area, service)
 * @returns {Promise<Array>} List of blood bank records matching the filters
 */
export const getBloodBanks = async (filters = {}) => {
  const response = await api.get('/blood-banks', { params: filters });
  return response.data; // Expected format: Array of blood bank items
};
