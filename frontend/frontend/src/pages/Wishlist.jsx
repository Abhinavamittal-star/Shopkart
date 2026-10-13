import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import WishlistCard from '../components/WishlistCard';

const Wishlist = ({ onWishlistChange }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchWishlist = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await API.get('/wishlist');
      if (response.data && response.data.success) {
        setWishlistItems(response.data.wishlist || []);
      } else {
        setWishlistItems([]);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
      setError("We couldn't load your wishlist. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await API.delete(`/wishlist/${productId}`);
      const updatedList = wishlistItems.filter((item) => item._id !== productId);
      setWishlistItems(updatedList);
      if (onWishlistChange) {
        onWishlistChange(updatedList.map((item) => item._id));
      }
    } catch (err) {
      console.error('Error removing item from wishlist:', err);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="wishlist-page-container">
        <div className="wishlist-header">
          <h1>My Wishlist</h1>
        </div>
        <div className="state-container loading-state">
          <p>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wishlist-page-container">
        <div className="wishlist-header">
          <h1>My Wishlist</h1>
        </div>
        <div className="state-container error-state">
          <h3>Something went wrong.</h3>
          <p>{error}</p>
          <button onClick={fetchWishlist} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="wishlist-page-container">
        <div className="wishlist-header">
          <h1>My Wishlist</h1>
        </div>
        <div className="state-container empty-state empty-wishlist-box">
          <div className="empty-wishlist-icon">❤️</div>
          <h2>Your wishlist is empty</h2>
          <p>Save products you love and find them here later.</p>
          <Link to="/products" className="browse-products-btn">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page-container">
      <div className="wishlist-header">
        <h1>My Wishlist</h1>
        <p className="wishlist-count-subtitle">
          {wishlistItems.length} {wishlistItems.length === 1 ? 'product' : 'products'} saved
        </p>
      </div>

      <div className="products-grid">
        {wishlistItems.map((product) => (
          <WishlistCard
            key={product._id}
            product={product}
            onRemove={handleRemoveFromWishlist}
          />
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
