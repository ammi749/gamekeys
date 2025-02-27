import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import ProductsService from '../services/products.service';

const HomePage = () => {
  // State for featured products
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [onSaleProducts, setOnSaleProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch data in parallel
        const [featuredRes, saleRes, categoriesRes, platformsRes] = await Promise.all([
          ProductsService.getFeaturedProducts(),
          ProductsService.getOnSaleProducts(),
          ProductsService.getCategories(),
          ProductsService.getPlatforms()
        ]);
        
        setFeaturedProducts(featuredRes.results || featuredRes);
        setOnSaleProducts(saleRes.results || saleRes);
        setCategories(categoriesRes.results || categoriesRes);
        setPlatforms(platformsRes.results || platformsRes);
        setError(null);
      } catch (err) {
        console.error('Error fetching home page data:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorAlert message={error} />;
  }
  
  return (
    <div className="home-page">
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="hero-content">
          <h1>Instant Digital Keys</h1>
          <p>Game and software keys delivered instantly to your inbox</p>
          <Link to="/products" className="btn btn-primary btn-lg">
            Browse Products
          </Link>
        </div>
      </section>
      
      {/* Featured Products Section */}
      <section className="featured-products">
        <div className="section-header">
          <h2>Featured Products</h2>
          <Link to="/products?featured=true" className="view-all-link">
            View All
          </Link>
        </div>
        
        <div className="products-grid">
          {featuredProducts.length > 0 ? (
            featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <p className="no-products-message">No featured products available</p>
          )}
        </div>
      </section>
      
      {/* On Sale Products Section */}
      <section className="on-sale-products">
        <div className="section-header">
          <h2>Special Offers</h2>
          <Link to="/products?on_sale=true" className="view-all-link">
            View All
          </Link>
        </div>
        
        <div className="products-grid">
          {onSaleProducts.length > 0 ? (
            onSaleProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <p className="no-products-message">No products on sale right now</p>
          )}
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="categories-section">
        <h2>Browse by Category</h2>
        
        <div className="categories-grid">
          {categories.map(category => (
            <Link 
              key={category.id} 
              to={`/category/${category.slug}`} 
              className="category-card"
            >
              {category.image ? (
                <img 
                  src={category.image} 
                  alt={category.name} 
                  className="category-image" 
                />
              ) : (
                <div className="category-placeholder">
                  <i className="category-icon"></i>
                </div>
              )}
              <h3 className="category-name">{category.name}</h3>
            </Link>
          ))}
        </div>
      </section>
      
      {/* Platforms Section */}
      <section className="platforms-section">
        <h2>Shop by Platform</h2>
        
        <div className="platforms-grid">
          {platforms.map(platform => (
            <Link 
              key={platform.id} 
              to={`/platform/${platform.slug}`} 
              className="platform-card"
            >
              {platform.image ? (
                <img 
                  src={platform.image} 
                  alt={platform.name} 
                  className="platform-image" 
                />
              ) : (
                <div className="platform-placeholder">
                  <i className="platform-icon"></i>
                </div>
              )}
              <h3 className="platform-name">{platform.name}</h3>
            </Link>
          ))}
        </div>
      </section>
      
      {/* Features/Benefits Section */}
      <section className="features-section">
        <h2>Why Choose Us</h2>
        
        <div className="features-grid">
          <div className="feature-card">
            <i className="feature-icon instant-delivery-icon"></i>
            <h3>Instant Delivery</h3>
            <p>Keys delivered to your email immediately after purchase</p>
          </div>
          
          <div className="feature-card">
            <i className="feature-icon secure-icon"></i>
            <h3>Secure Payment</h3>
            <p>Shop with confidence using our secure payment methods</p>
          </div>
          
          <div className="feature-card">
            <i className="feature-icon cashback-icon"></i>
            <h3>Cashback Rewards</h3>
            <p>Earn cashback on every purchase when you create an account</p>
          </div>
          
          <div className="feature-card">
            <i className="feature-icon support-icon"></i>
            <h3>24/7 Support</h3>
            <p>Our customer service team is here to help whenever you need us</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;