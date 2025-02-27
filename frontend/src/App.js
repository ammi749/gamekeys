import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import CSS
import './assets/styles/index.css';

// Placeholder components - you'll replace these with actual implementations
const Header = () => <header className="site-header"><h1>GameKeys</h1><nav>Navigation</nav></header>;
const Footer = () => <footer className="site-footer">GameKeys &copy; 2025</footer>;
const HomePage = () => <div className="page home-page"><h2>Home Page</h2><p>Featured products would appear here</p></div>;
const ProductsPage = () => <div className="page products-page"><h2>Products</h2><p>Product listings would appear here</p></div>;
const ProductDetailPage = () => <div className="page product-detail-page"><h2>Product Detail</h2><p>Product details would appear here</p></div>;
const CartPage = () => <div className="page cart-page"><h2>Shopping Cart</h2><p>Cart items would appear here</p></div>;
const CheckoutPage = () => <div className="page checkout-page"><h2>Checkout</h2><p>Checkout form would appear here</p></div>;
const LoginPage = () => <div className="page login-page"><h2>Login</h2><p>Login form would appear here</p></div>;
const RegisterPage = () => <div className="page register-page"><h2>Register</h2><p>Registration form would appear here</p></div>;
const AccountPage = () => <div className="page account-page"><h2>My Account</h2><p>Account details would appear here</p></div>;
const NotFoundPage = () => <div className="page not-found-page"><h2>404 - Page Not Found</h2><p>The page you're looking for doesn't exist</p></div>;

// Simple Auth Provider placeholder
const AuthContext = React.createContext(null);
const AuthProvider = ({ children }) => {
  const [user, setUser] = React.useState(null);
  
  const login = (username, password) => {
    // Mock login
    setUser({ username, name: 'Demo User', cashback: 10.00 });
    return true;
  };
  
  const logout = () => {
    setUser(null);
  };
  
  const value = { user, login, logout, isAuthenticated: !!user };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Simple Cart Provider placeholder
const CartContext = React.createContext(null);
const CartProvider = ({ children }) => {
  const [items, setItems] = React.useState([]);
  
  const addToCart = (product) => {
    setItems([...items, product]);
  };
  
  const removeFromCart = (productId) => {
    setItems(items.filter(item => item.id !== productId));
  };
  
  const value = { 
    items, 
    addToCart, 
    removeFromCart, 
    cartCount: items.length,
    cartTotal: items.reduce((sum, item) => sum + (item.price || 0), 0)
  };
  
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const auth = React.useContext(AuthContext);
  
  if (!auth.isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="app">
            <Header />
            <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                
                {/* Protected Routes */}
                <Route path="/account" element={
                  <ProtectedRoute>
                    <AccountPage />
                  </ProtectedRoute>
                } />
                
                {/* 404 Page */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;