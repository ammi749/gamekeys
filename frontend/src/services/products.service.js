import api from './api';

/**
 * Service for product related API calls
 */
const ProductsService = {
  /**
   * Get list of products with optional filtering
   * @param {Object} params - Query parameters for filtering
   * @returns {Promise} - Promise with products data
   */
  getProducts: async (params = {}) => {
    try {
      const response = await api.get('/products/', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get a single product by slug
   * @param {string} slug - Product slug
   * @returns {Promise} - Promise with product data
   */
  getProductBySlug: async (slug) => {
    try {
      const response = await api.get(`/products/${slug}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get list of categories
   * @returns {Promise} - Promise with categories data
   */
  getCategories: async () => {
    try {
      const response = await api.get('/categories/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get a single category by slug
   * @param {string} slug - Category slug
   * @returns {Promise} - Promise with category data
   */
  getCategoryBySlug: async (slug) => {
    try {
      const response = await api.get(`/categories/${slug}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get list of platforms
   * @returns {Promise} - Promise with platforms data
   */
  getPlatforms: async () => {
    try {
      const response = await api.get('/platforms/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get a single platform by slug
   * @param {string} slug - Platform slug
   * @returns {Promise} - Promise with platform data
   */
  getPlatformBySlug: async (slug) => {
    try {
      const response = await api.get(`/platforms/${slug}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get featured products
   * @returns {Promise} - Promise with featured products data
   */
  getFeaturedProducts: async () => {
    try {
      const response = await api.get('/products/featured/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get on sale products
   * @returns {Promise} - Promise with on sale products data
   */
  getOnSaleProducts: async () => {
    try {
      const response = await api.get('/products/on_sale/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Search products
   * @param {string} query - Search query
   * @returns {Promise} - Promise with search results
   */
  searchProducts: async (query) => {
    try {
      const response = await api.get('/products/', { 
        params: { search: query } 
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get products by category
   * @param {string} categorySlug - Category slug
   * @returns {Promise} - Promise with products in category
   */
  getProductsByCategory: async (categorySlug) => {
    try {
      const response = await api.get('/products/', { 
        params: { category__slug: categorySlug } 
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  /**
   * Get products by platform
   * @param {string} platformSlug - Platform slug
   * @returns {Promise} - Promise with products for platform
   */
  getProductsByPlatform: async (platformSlug) => {
    try {
      const response = await api.get('/products/', { 
        params: { platform__slug: platformSlug } 
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default ProductsService;