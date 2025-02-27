import api from './api';

/**
 * Service for authentication related API calls
 */
const AuthService = {
  /**
   * Login with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Promise with login response
   */
  login: async (email, password) => {
    try {
      const response = await api.post('/token/', { email, password });
      const { access, refresh } = response.data;
      
      // Store tokens in localStorage
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} - Promise with registration response
   */
  register: async (userData) => {
    try {
      const response = await api.post('/users/register/', userData);
      const { access, refresh } = response.data;
      
      // Store tokens in localStorage
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Logout the current user
   */
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Clear any user state in your app if needed
  },
  
  /**
   * Get current user profile
   * @returns {Promise} - Promise with user data
   */
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Update user profile
   * @param {Object} userData - Updated user data
   * @returns {Promise} - Promise with updated user data
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
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @param {string} newPasswordConfirm - New password confirmation
   * @returns {Promise} - Promise with response
   */
  changePassword: async (currentPassword, newPassword, newPasswordConfirm) => {
    try {
      const response = await api.post('/users/change_password/', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Check if the user is authenticated
   * @returns {boolean} - True if the user is authenticated
   */
  isAuthenticated: () => {
    // Check if the access token exists
    // For better security, you could also check token expiration
    return !!localStorage.getItem('access_token');
  }
};

export default AuthService;