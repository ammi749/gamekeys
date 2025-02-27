import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

/**
 * Product card component for displaying product in grid
 */
const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { showSuccess } = useToast();
  
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart(product, 1);
    showSuccess(`${product.name} added to cart!`);
  };
  
  // Calculate discount percentage if on sale
  const discountPercentage = product.discount_percentage || 0;
  
  return (
    <div className="product-card">
      <Link to={`/product/${product.slug}`} className="product-card__link">
        <div className="product-card__image-container">
          {product.image ? (
            <img 
              src={product.image} 
              alt={product.name} 
              className="product-card__image" 
            />
          ) : (
            <div className="product-card__no-image">
              No Image
            </div>
          )}
          
          {discountPercentage > 0 && (
            <div className="product-card__discount-badge">
              -{discountPercentage}%
            </div>
          )}
          
          {!product.in_stock && (
            <div className="product-card__out-of-stock">
              Out of Stock
            </div>
          )}
          
          <div className="product-card__platform-badge">
            {product.platform_name}
          </div>
        </div>
        
        <div className="product-card__content">
          <h3 className="product-card__title">{product.name}</h3>
          
          <div className="product-card__category">
            {product.category_name}
          </div>
          
          <div className="product-card__price-container">
            {product.sale_price ? (
              <>
                <span className="product-card__sale-price">
                  ${product.sale_price.toFixed(2)}
                </span>
                <span className="product-card__original-price">
                  ${product.price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="product-card__price">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>
          
          <div className="product-card__region">
            Region: {product.region}
          </div>
        </div>
      </Link>
      
      <div className="product-card__actions">
        <button
          className="btn btn-primary product-card__add-btn"
          onClick={handleAddToCart}
          disabled={!product.in_stock}
        >
          {product.in_stock ? 'Add to Cart' : 'Out of Stock'}
        </button>
        
        <Link
          to={`/product/${product.slug}`}
          className="btn btn-outline product-card__details-btn"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;