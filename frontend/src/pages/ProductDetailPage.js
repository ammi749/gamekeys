import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ProductsService from '../services/products.service';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorAlert from '../components/common/ErrorAlert';
import ProductCard from '../components/common/ProductCard';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { showSuccess, showError } = useToast();
  
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  
  // Fetch product data when slug changes
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const data = await ProductsService.getProductBySlug(slug);
        setProduct(data);
        setError(null);
        
        // Fetch related products (same category)
        if (data.category && data.category.slug) {
          const relatedData = await ProductsService.getProductsByCategory(data.category.slug);
          // Filter out current product and limit to 4 related products
          const filtered = (relatedData.results || relatedData)
            .filter(p => p.id !== data.id)
            .slice(0, 4);
          setRelatedProducts(filtered);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [slug]);
  
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    setQuantity(value > 0 ? value : 1);
  };
  
  const handleAddToCart = () => {
    if (!product.in_stock) {
      showError('This product is out of stock');
      return;
    }
    
    addToCart(product, quantity);
    showSuccess(`${product.name} added to cart!`);
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return <ErrorAlert message={error} />;
  }
  
  if (!product) {
    return <ErrorAlert message="Product not found" />;
  }
  
  return (
    <div className="product-detail-page">
      <div className="breadcrumbs">
        <Link to="/">Home</Link> &raquo;
        <Link to="/products">Products</Link> &raquo;
        <Link to={`/category/${product.category.slug}`}>{product.category.name}</Link> &raquo;
        <span>{product.name}</span>
      </div>
      
      <div className="product-detail-container">
        <div className="product-image-container">
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name} 
              className="product-detail-image" 
            />
          ) : (
            <div className="product-detail-no-image">
              No Image Available
            </div>
          )}
        </div>
        
        <div className="product-info">
          <h1 className="product-title">{product.name}</h1>
          
          <div className="product-meta">
            <span className="product-platform">
              <strong>Platform:</strong> {product.platform.name}
            </span>
            <span className="product-category">
              <strong>Category:</strong> {product.category.name}
            </span>
            <span className="product-region">
              <strong>Region:</strong> {product.region}
            </span>
          </div>
          
          <div className="product-price-container">
            {product.sale_price ? (
              <>
                <span className="product-sale-price">
                  ${product.sale_price.toFixed(2)}
                </span>
                <span className="product-original-price">
                  ${product.price.toFixed(2)}
                </span>
                <span className="product-discount">
                  {product.discount_percentage}% OFF
                </span>
              </>
            ) : (
              <span className="product-price">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>
          
          <div className="product-stock-status">
            {product.in_stock ? (
              <span className="in-stock">In Stock</span>
            ) : (
              <span className="out-of-stock">Out of Stock</span>
            )}
          </div>
          
          <div className="product-actions">
            <div className="quantity-control">
              <label htmlFor="quantity">Quantity:</label>
              <input
                type="number"
                id="quantity"
                min="1"
                value={quantity}
                onChange={handleQuantityChange}
                disabled={!product.in_stock}
              />
            </div>
            
            <button
              className="btn btn-primary add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={!product.in_stock}
            >
              {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
            </button>
          </div>
          
          <div className="product-features">
            <ul>
              <li>
                <i className="feature-icon delivery-icon"></i>
                Instant Email Delivery
              </li>
              <li>
                <i className="feature-icon secure-icon"></i>
                Secure Purchase
              </li>
              <li>
                <i className="feature-icon support-icon"></i>
                24/7 Support
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="product-description">
        <h2>Product Description</h2>
        <div 
          className="description-content"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      </div>
      
      <div className="redemption-instructions">
        <h2>How to Redeem</h2>
        
        {product.platform.slug === 'steam' && (
          <div className="platform-instructions">
            <h3>Steam Redemption Instructions:</h3>
            <ol>
              <li>Launch the Steam client and log into your Steam account</li>
              <li>Click on "Games" in the top menu, then select "Activate a Product on Steam..."</li>
              <li>Follow the on-screen instructions to complete the activation process</li>
              <li>Enter your key exactly as it appears in your email</li>
              <li>Your game will begin downloading once it has been added to your library</li>
            </ol>
          </div>
        )}
        
        {product.platform.slug === 'epic-games' && (
          <div className="platform-instructions">
            <h3>Epic Games Redemption Instructions:</h3>
            <ol>
              <li>Log in to your Epic Games account</li>
              <li>Click on your username in the top-right corner</li>
              <li>Select "Redeem Code" from the dropdown menu</li>
              <li>Enter your key and click "Redeem"</li>
              <li>Your game will be added to your library</li>
            </ol>
          </div>
        )}
        
        {product.platform.slug === 'origin' && (
          <div className="platform-instructions">
            <h3>Origin Redemption Instructions:</h3>
            <ol>
              <li>Launch the Origin client and log into your Origin account</li>
              <li>Click on "Origin" in the top menu</li>
              <li>Select "Redeem Product Code..."</li>
              <li>Enter your key and click "Next"</li>
              <li>Your game will begin downloading once it has been added to your library</li>
            </ol>
          </div>
        )}
        
        {/* Default instructions for other platforms */}
        {!['steam', 'epic-games', 'origin'].includes(product.platform.slug) && (
          <div className="platform-instructions">
            <h3>{product.platform.name} Redemption Instructions:</h3>
            <ol>
              <li>Log in to your {product.platform.name} account</li>
              <li>Navigate to the "Redeem Code" or similar section</li>
              <li>Enter the key exactly as it appears in your email</li>
              <li>Follow the on-screen instructions to complete activation</li>
            </ol>
          </div>
        )}
      </div>
      
      {relatedProducts.length > 0 && (
        <div className="related-products">
          <h2>You May Also Like</h2>
          <div className="products-grid">
            {relatedProducts.map(relatedProduct => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;