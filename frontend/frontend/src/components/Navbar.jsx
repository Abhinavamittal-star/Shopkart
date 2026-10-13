import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';

const Navbar = ({ user, setUser, wishlistCount = 0, cartCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await API.post('/customers/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <nav className="navbar">
      {user ? (
        <div className="navbar-auth">
          <div className="nav-left">
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
            <div className="nav-links-group">
              <Link
                to="/home"
                className={`nav-link ${location.pathname === '/home' ? 'active' : ''}`}
              >
                Home
              </Link>
              <Link
                to="/products"
                className={`nav-link ${
                  location.pathname.startsWith('/products') ? 'active' : ''
                }`}
              >
                Products
              </Link>
              <Link
                to="/wishlist"
                className={`nav-link ${
                  location.pathname === '/wishlist' ? 'active' : ''
                }`}
              >
                Wishlist {wishlistCount > 0 && <span className="nav-wishlist-badge">({wishlistCount})</span>}
              </Link>
              <Link to="/cart" className={`nav-link ${location.pathname.startsWith('/cart') ? 'active' : ''}`}>
                Cart <span className="nav-cart-badge">({cartCount})</span>
              </Link>
              <Link
                to="/orders"
                className={`nav-link ${location.pathname.startsWith('/orders') || location.pathname.startsWith('/order-success') ? 'active' : ''}`}
              >
                My Orders
              </Link>
            </div>
          </div>
          <Link to="/home" className="brand-logo">
            ShopKart
          </Link>
        </div>
      ) : (
        <div className="navbar-guest">
          <Link to="/login" className="brand-logo">
            ShopKart
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
