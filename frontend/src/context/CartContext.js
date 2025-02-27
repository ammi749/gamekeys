import React, { createContext, useState, useEffect, useContext } from 'react';

// Create context
const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  // Initialize cart from localStorage or empty array
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);
  
  /**
   * Add a product to the cart
   * @param {Object} product - Product to add
   * @param {number} quantity - Quantity to add (default 1)
   */
  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(
        item => item.id === product.id
      );
      
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity
        };
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, { ...product, quantity }];
      }
    });
  };
  
  /**
   * Remove a product from the cart
   * @param {number} productId - ID of product to remove
   */
  const removeFromCart = (productId) => {
    setCartItems(prevItems => 
      prevItems.filter(item => item.id !== productId)
    );
  };
  
  /**
   * Update the quantity of a product in the cart
   * @param {number} productId - ID of product to update
   * @param {number} quantity - New quantity
   */
  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };
  
  /**
   * Clear all items from the cart
   */
  const clearCart = () => {
    setCartItems([]);
  };
  
  /**
   * Calculate total number of items in cart
   * @returns {number} - Total quantity
   */
  const getCartCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };
  
  /**
   * Calculate subtotal of all items in cart
   * @returns {number} - Subtotal price
   */
  const getSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.sale_price || item.price;
      return total + (price * item.quantity);
    }, 0);
  };
  
  /**
   * Format cart items for order submission
   * @returns {Array} - Formatted cart items for API
   */
  const getOrderItems = () => {
    return cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity
    }));
  };
  
  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartCount,
    getSubtotal,
    getOrderItems,
    isEmpty: cartItems.length === 0
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;