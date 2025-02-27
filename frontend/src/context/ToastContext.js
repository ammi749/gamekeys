import React, { createContext, useState, useContext } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Create context
const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  // Default toast configuration
  const defaultOptions = {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true
  };
  
  /**
   * Show success toast
   * @param {string} message - Toast message
   * @param {Object} options - Toast options to override defaults
   */
  const showSuccess = (message, options = {}) => {
    toast.success(message, { ...defaultOptions, ...options });
  };
  
  /**
   * Show error toast
   * @param {string} message - Toast message
   * @param {Object} options - Toast options to override defaults
   */
  const showError = (message, options = {}) => {
    toast.error(message, { ...defaultOptions, ...options });
  };
  
  /**
   * Show info toast
   * @param {string} message - Toast message
   * @param {Object} options - Toast options to override defaults
   */
  const showInfo = (message, options = {}) => {
    toast.info(message, { ...defaultOptions, ...options });
  };
  
  /**
   * Show warning toast
   * @param {string} message - Toast message
   * @param {Object} options - Toast options to override defaults
   */
  const showWarning = (message, options = {}) => {
    toast.warn(message, { ...defaultOptions, ...options });
  };
  
  const value = {
    showSuccess,
    showError,
    showInfo,
    showWarning
  };
  
  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

export default ToastContext;