import api from './api';

/**
 * Service for user account related API calls
 */
const UserService = {
  /**
   * Get cashback transactions for the current user
   * @returns {Promise} - Promise with cashback transactions
   */
  getCashbackTransactions: async () => {
    try {
      const response = await api.get('/cashback-transactions/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Update user profile information
   * @param {Object} userData - Updated user data
   * @returns {Promise} - Promise with updated user profile
   */
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/update_profile/', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Change user password
   * @param {Object} passwordData - Current and new password data
   * @returns {Promise} - Promise with response message
   */
  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/users/change_password/', passwordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default UserService;