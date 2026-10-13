import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../services/api';

const ProductDetails = ({ user, userWishlist = [], onWishlistToggle, onCartChange }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);
  const [cartSaving, setCartSaving] = useState(false);
  const [cartError, setCartError] = useState('');

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistSaving, setWishlistSaving] = useState(false);
  const [wishlistError, setWishlistError] = useState('');

  useEffect(() => {
    const isSaved = (userWishlist || []).some((item) => {
      const itemId = typeof item === 'object' ? item._id : item;
      return itemId === id;
    });
    setIsWishlisted(isSaved);
  }, [id, userWishlist]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await API.get(`/products/${id}`);
        setProduct(response.data);
      } catch (err) {
        console.error('Error fetching product details:', err);
        if (err.response && err.response.status === 404) {
          setError('Product not found.');
        } else if (err.response && err.response.status === 400) {
          setError('Invalid product ID format.');
        } else {
          setError('Something went wrong while loading product details.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (cartSaving) return;

    setCartSaving(true);
    setCartError('');
    try {
      const response = await API.post('/cart/items', { productId: product._id });
      onCartChange(response.data.cart || []);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) {
      console.error('Unable to add product to cart:', err);
      setCartError(err.response?.data?.message || 'Unable to add this product to your cart.');
    } finally {
      setCartSaving(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (wishlistSaving) return;

    setWishlistSaving(true);
    setWishlistError('');

    try {
      if (isWishlisted) {
        await API.delete(`/wishlist/${id}`);
        setIsWishlisted(false);
        if (onWishlistToggle) onWishlistToggle(id, false);
      } else {
        await API.post(`/wishlist/${id}`);
        setIsWishlisted(true);
        if (onWishlistToggle) onWishlistToggle(id, true);
      }
    } catch (err) {
      console.error('Error toggling wishlist:', err);
      if (err.response && err.response.status === 409) {
        setIsWishlisted(true);
        if (onWishlistToggle) onWishlistToggle(id, true);
      } else {
        setWishlistError('Unable to update wishlist. Try again.');
      }
    } finally {
      setWishlistSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="product-details-container">
        <div className="state-container loading-state">
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-details-container">
        <div className="state-container error-state">
          <p>{error || 'Product not found.'}</p>
          <Link to="/products" className="back-link-btn" style={{ marginTop: '1rem', display: 'inline-block' }}>
            &larr; Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="product-details-container">
      <Link to="/products" className="back-link-btn">
        &larr; Back to Products
      </Link>

      <div className="product-details-card">
        <div className="product-details-image-section">
          <img
            src={product.image}
            alt={product.name}
            className="large-product-image"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/600x400?text=Product+Image';
            }}
          />
        </div>

        <div className="product-details-info-section">
          <span className="product-category-badge">{product.category}</span>
          <h1 className="product-details-title">{product.name}</h1>
          <p className="product-details-price">₹{product.price.toLocaleString('en-IN')}</p>

          <div className="product-details-stock">
            <strong>Availability: </strong>
            {product.stock > 0 ? (
              <span className="in-stock">{product.stock} units in stock</span>
            ) : (
              <span className="out-of-stock">Out of Stock</span>
            )}
          </div>

          <p className="product-details-description">{product.description}</p>

          {wishlistError && <p className="card-error-text">{wishlistError}</p>}
          {cartError && <p className="card-error-text">{cartError}</p>}

          <div className="details-actions-group">
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || cartSaving}
              className="add-to-cart-btn"
            >
              {cartSaving ? 'Adding...' : addedToCart ? 'Added to Cart!' : product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
            </button>

            <button
              onClick={handleWishlistToggle}
              disabled={wishlistSaving}
              className={`details-wishlist-btn ${isWishlisted ? 'wishlisted' : ''}`}
            >
              {wishlistSaving
                ? '⏳ Saving...'
                : isWishlisted
                ? '♥ Remove from Wishlist'
                : '♡ Add to Wishlist'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
