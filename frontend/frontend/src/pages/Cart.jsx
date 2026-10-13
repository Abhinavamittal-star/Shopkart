import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { formatCurrency } from '../utils/currency';

const Cart = ({ cart, onCartChange }) => {
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');

  const updateQuantity = async (productId, quantity) => {
    setSavingId(productId);
    setError('');
    try {
      const response = await API.patch(`/cart/items/${productId}`, { quantity });
      onCartChange(response.data.cart || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update your cart.');
    } finally {
      setSavingId('');
    }
  };

  const removeItem = async (productId) => {
    setSavingId(productId);
    setError('');
    try {
      const response = await API.delete(`/cart/items/${productId}`);
      onCartChange(response.data.cart || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to remove this item.');
    } finally {
      setSavingId('');
    }
  };

  const total = cart.reduce((sum, item) => (
    item.product ? sum + item.product.price * item.quantity : sum
  ), 0);

  return (
    <section className="commerce-page">
      <header className="commerce-header">
        <div>
          <h1>Your Cart</h1>
          <p>Review your items before checkout.</p>
        </div>
        <Link className="secondary-action" to="/products">Continue shopping</Link>
      </header>

      {error && <p className="error-message">{error}</p>}
      {cart.length === 0 ? (
        <div className="commerce-empty">
          <h2>Your cart is empty</h2>
          <p>Find something you love and add it to your cart.</p>
          <Link className="primary-action" to="/products">Browse products</Link>
        </div>
      ) : (
        <div className="commerce-layout">
          <div className="cart-items">
            {cart.map(({ product, productId: cartProductId, quantity }, index) => {
                const productId = cartProductId || product?._id || `unavailable-${index}`;
              return (
                <article className="cart-item" key={productId}>
                  {product?.image ? (
                    <img className="cart-item-image" src={product.image} alt={product.name} />
                  ) : (
                    <div className="cart-item-image cart-image-placeholder">Unavailable</div>
                  )}
                  <div className="cart-item-info">
                    <h2>{product?.name || 'Unavailable product'}</h2>
                    {product && <p>{formatCurrency(product.price)} each</p>}
                    {!product && <p>This product is no longer available. Remove it to continue.</p>}
                    <div className="cart-item-controls">
                      {product && (
                        <>
                          <button
                            type="button"
                            aria-label={`Decrease ${product.name} quantity`}
                            disabled={savingId === productId || quantity <= 1}
                            onClick={() => updateQuantity(productId, quantity - 1)}
                          >−</button>
                          <span>{quantity}</span>
                          <button
                            type="button"
                            aria-label={`Increase ${product.name} quantity`}
                            disabled={savingId === productId || quantity >= product.stock}
                            onClick={() => updateQuantity(productId, quantity + 1)}
                          >+</button>
                        </>
                      )}
                      {product && <span className="cart-item-subtotal">{formatCurrency(product.price * quantity)}</span>}
                      <button
                        type="button"
                        className="text-action"
                        disabled={savingId === productId}
                        onClick={() => removeItem(productId)}
                      >{savingId === productId ? 'Saving…' : 'Remove'}</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <aside className="order-summary">
            <h2>Order Summary</h2>
            <div className="summary-line"><span>Subtotal</span><strong>{formatCurrency(total)}</strong></div>
            <p className="summary-note">Final price and stock are rechecked securely at checkout.</p>
            <Link className="primary-action full-width" to="/checkout">Proceed to Checkout</Link>
          </aside>
        </div>
      )}
    </section>
  );
};

export default Cart;
