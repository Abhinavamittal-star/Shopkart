import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../services/api';

const ProductCard = ({
  product,
  isWishlisted: initialWishlisted = false,
  userLoggedIn = false,
  onWishlistToggle
}) => {
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setIsWishlisted(initialWishlisted);
  }, [initialWishlisted]);

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userLoggedIn) {
      navigate('/login');
      return;
    }

    if (saving) return;

    setSaving(true);
    setError('');

    try {
      if (isWishlisted) {
        await API.delete(`/wishlist/${product._id}`);
        setIsWishlisted(false);
        if (onWishlistToggle) onWishlistToggle(product._id, false);
      } else {
        await API.post(`/wishlist/${product._id}`);
        setIsWishlisted(true);
        if (onWishlistToggle) onWishlistToggle(product._id, true);
      }
    } catch (err) {
      console.error('Wishlist toggle error:', err);
      if (err.response && err.response.status === 409) {
        setIsWishlisted(true);
        if (onWishlistToggle) onWishlistToggle(product._id, true);
      } else {
        setError('Unable to save product. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="product-card">
      <div className="product-image-wrapper">
        <img
          src={product.image}
          alt={product.name}
          className="product-image"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/300x200?text=Product+Image';
          }}
        />
        <span className="product-category-badge">{product.category}</span>

        {/* Corner Wishlist Heart Button */}
        <button
          onClick={handleWishlistClick}
          disabled={saving}
          className={`card-heart-badge ${isWishlisted ? 'active' : ''}`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          {saving ? '⏳' : isWishlisted ? '♥' : '♡'}
        </button>
      </div>

      <div className="product-card-body">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">₹{product.price ? product.price.toLocaleString('en-IN') : '0'}</p>

        <div className="product-stock-status">
          {product.stock > 0 ? (
            <span className="in-stock">{product.stock} units left</span>
          ) : (
            <span className="out-of-stock">Out of Stock</span>
          )}
        </div>

        {error && <p className="card-error-text">{error}</p>}

        <div className="card-actions">
          <Link to={`/products/${product._id}`} className="view-details-btn">
            View Details
          </Link>
          <button
            onClick={handleWishlistClick}
            disabled={saving}
            className={`wishlist-action-btn ${isWishlisted ? 'wishlisted' : ''}`}
          >
            {saving ? '⏳ Saving...' : isWishlisted ? '♥ Added to Wishlist' : '♡ Add to Wishlist'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
