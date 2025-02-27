import React, { createContext, useState, useEffect, useContext } from 'react';
import AuthService from '../services/auth.service';

// Create context
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (AuthService.isAuthenticated()) {
        try {
          const userData = await AuthService.getCurrentUser();
          setCurrentUser(userData);
        } catch (err) {
          console.error('Failed to load user:', err);
          // If token is invalid, clear it
          AuthService.logout();
        }
      }
      setLoading(false);
    };
    
    loadUser();
  }, []);
  
  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   */
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      await AuthService.login(email, password);
      const userData = await AuthService.getCurrentUser();
      setCurrentUser(userData);
      return userData;
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Register new user
   * @param {Object} userData - User registration data
   */
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await AuthService.register(userData);
      const user = await AuthService.getCurrentUser();
      setCurrentUser(user);
      return result;
    } catch (err) {
      setError(err.response?.data || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Logout current user
   */
  const logout = () => {
    AuthService.logout();
    setCurrentUser(null);
  };
  
  /**
   * Update user profile
   * @param {Object} userData - Updated user data
   */
  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedUser = await AuthService.updateProfile(userData);
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err.response?.data || 'Failed to update profile. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @param {string} newPasswordConfirm - New password confirmation
   */
  const changePassword = async (currentPassword, newPassword, newPasswordConfirm) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await AuthService.changePassword(
        currentPassword, 
        newPassword, 
        newPasswordConfirm
      );
      return result;
    } catch (err) {
      setError(err.response?.data || 'Failed to change password. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: AuthService.isAuthenticated
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;