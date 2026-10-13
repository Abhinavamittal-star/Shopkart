import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const WishlistCard = ({ product, onRemove }) => {
  const [removing, setRemoving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRemove = async () => {
    if (removing) return;
    setRemoving(true);
    setErrorMsg('');
    try {
      await onRemove(product._id);
    } catch (err) {
      console.error('Failed to remove item from wishlist:', err);
      setErrorMsg('Failed to remove. Please try again.');
      setRemoving(false);
    }
  };

  return (
    <div className="product-card wishlist-card">
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

        {errorMsg && <p className="wishlist-card-error">{errorMsg}</p>}

        <div className="wishlist-card-actions">
          <Link to={`/products/${product._id}`} className="view-details-btn">
            View Details
          </Link>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="remove-wishlist-btn"
            title="Remove from Wishlist"
          >
            {removing ? '⏳ Removing...' : 'Remove ♥'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WishlistCard;
