import api from './api';

/**
 * Service for order related API calls
 */
const OrdersService = {
  /**
   * Create a new order
   * @param {Object} orderData - Order data including items, email, etc.
   * @returns {Promise} - Promise with order and payment data
   */
  createOrder: async (orderData) => {
    try {
      const response = await api.post('/orders/', orderData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get a single order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise} - Promise with order data
   */
  getOrderById: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get orders for current user
   * @returns {Promise} - Promise with user's orders
   */
  getUserOrders: async () => {
    try {
      const response = await api.get('/orders/my_orders/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Confirm payment for order
   * @param {string} orderId - Order ID
   * @param {Object} paymentData - Payment confirmation data
   * @returns {Promise} - Promise with confirmation response
   */
  confirmPayment: async (orderId, paymentData) => {
    try {
      const response = await api.post(
        `/orders/${orderId}/confirm_payment/`, 
        paymentData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get order as guest (requires email verification)
   * @param {string} orderId - Order ID
   * @param {string} email - Email used for order
   * @returns {Promise} - Promise with order data
   */
  getGuestOrder: async (orderId, email) => {
    try {
      // For guest orders, we need to pass the email in the request body
      // to verify they own the order
      const response = await api.get(`/orders/${orderId}/`, {
        data: { email }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default OrdersService;