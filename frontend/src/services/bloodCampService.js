import api from './authService';

/**
 * Fetches upcoming blood donation camps based on search, location, and date filters.
 * @param {Object} filters - Search and filtering criteria (name, state, district, area, date, status)
 * @returns {Promise<Array>} List of blood camp records matching the filters
 */
export const getBloodCamps = async (filters = {}) => {
  const response = await api.get('/blood-camps', { params: filters });
  return response.data; // Expected format: Array of blood camp items
};
