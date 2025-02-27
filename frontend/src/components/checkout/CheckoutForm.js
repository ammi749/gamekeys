import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import OrdersService from '../../services/orders.service';
import PaymentMethods from './PaymentMethods';
import OrderSummary from './OrderSummary';

const CheckoutForm = () => {
  const navigate = useNavigate();
  const { cartItems, getOrderItems, getSubtotal, clearCart } = useCart();
  const { currentUser, isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  
  // Form state
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('STRIPE');
  const [useCashback, setUseCashback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Initialize email with user's email if logged in
  useEffect(() => {
    if (currentUser) {
      setEmail(currentUser.email);
    }
  }, [currentUser]);
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Validate email
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Validate payment method
    if (!paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle checkout submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    if (cartItems.length === 0) {
      showError('Your cart is empty');
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare order data
      const orderData = {
        email,
        items: getOrderItems(),
        payment_method: paymentMethod,
        use_cashback: useCashback && isAuthenticated()
      };
      
      // Create order
      const response = await OrdersService.createOrder(orderData);
      const { order, payment } = response;
      
      // Handle different payment methods
      if (payment.status === 'PAID') {
        // Order already paid with cashback
        showSuccess('Order completed successfully!');
        clearCart();
        navigate(`/order-confirmation/${order.id}`);
      } else if (payment.payment_method === 'STRIPE') {
        // Store order ID and redirect to Stripe payment
        sessionStorage.setItem('pendingOrderId', order.id);
        navigate(`/payment/stripe/${order.id}`, { 
          state: { 
            clientSecret: payment.client_secret,
            orderId: order.id,
            amount: payment.amount
          } 
        });
      } else if (payment.payment_method === 'PAYPAL') {
        // Store order ID and redirect to PayPal payment
        sessionStorage.setItem('pendingOrderId', order.id);
        navigate(`/payment/paypal/${order.id}`, { 
          state: { 
            orderId: order.id,
            amount: payment.amount
          } 
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
      showError(error.response?.data?.error || 'Failed to process checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="checkout-container">
      <div className="checkout-form-container">
        <h2>Checkout</h2>
        
        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading || currentUser}
              placeholder="We'll send your keys to this email"
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
            {!currentUser && (
              <small className="form-text text-muted">
                Checking out as guest. <a href="/login">Log in</a> to earn cashback rewards.
              </small>
            )}
          </div>
          
          {/* Payment Methods Section */}
          <PaymentMethods
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            error={errors.paymentMethod}
            disabled={loading}
          />
          
          {/* Cashback Option (only for logged in users) */}
          {currentUser && currentUser.cashback_balance > 0 && (
            <div className="form-group cashback-option">
              <div className="custom-control custom-checkbox">
                <input
                  type="checkbox"
                  className="custom-control-input"
                  id="useCashback"
                  checked={useCashback}
                  onChange={(e) => setUseCashback(e.target.checked)}
                  disabled={loading}
                />
                <label className="custom-control-label" htmlFor="useCashback">
                  Use my cashback balance (${currentUser.cashback_balance.toFixed(2)} available)
                </label>
              </div>
            </div>
          )}
          
          <button 
            type="submit" 
            className="btn btn-primary btn-block checkout-btn"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Complete Checkout'}
          </button>
        </form>
      </div>
      
      <div className="order-summary-container">
        <OrderSummary 
          cartItems={cartItems} 
          subtotal={getSubtotal()} 
          cashbackApplied={useCashback ? Math.min(currentUser?.cashback_balance || 0, getSubtotal()) : 0}
        />
      </div>
    </div>
  );
};

export default CheckoutForm;