import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import API from '../services/api';
import { formatCurrency } from '../utils/currency';

const OrderDetails = ({ success = false }) => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const response = await API.get(`/orders/${id}`);
        setOrder(response.data.order);
      } catch (err) {
        console.error('Unable to load order:', err);
        setError(err.response?.data?.message || 'Unable to load this order.');
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [id]);

  if (loading) return <div className="state-container loading-state commerce-page">Loading order…</div>;
  if (error || !order) {
    return <div className="commerce-page"><div className="state-container error-state" role="alert">{error || 'Order not found.'}</div></div>;
  }

  return (
    <section className="commerce-page">
      {success && (
        <div className="success-banner">
          <span aria-hidden="true">✓</span>
          <div><h1>Order placed successfully</h1><p>Your payment was verified and your order is saved.</p></div>
        </div>
      )}
      <article className="order-detail-card">
        <header className="commerce-header">
          <div>
            <h1>Order #{order._id.slice(-8).toUpperCase()}</h1>
            <p>Placed {new Date(order.createdAt).toLocaleString('en-IN')}</p>
          </div>
          <span className={`order-status status-${order.status.toLowerCase()}`}>{order.status.replaceAll('_', ' ')}</span>
        </header>
        <h2>Items</h2>
        <div className="order-detail-items">
          {order.items.map((item, index) => (
            <div className="order-detail-item" key={`${item.product}-${index}`}>
              {item.image && <img src={item.image} alt="" />}
              <div><strong>{item.name}</strong><span>{formatCurrency(item.price)} × {item.quantity}</span></div>
              <strong>{formatCurrency(item.price * item.quantity)}</strong>
            </div>
          ))}
        </div>
        <div className="summary-line summary-total"><span>Total paid</span><strong>{formatCurrency(order.totalAmount)}</strong></div>
        {order.paymentGateway === 'MOCK' && (
          <p className="summary-note">Payment was simulated with the development Mock Payment Gateway. No real payment was made.</p>
        )}
        <section className="shipping-details">
          <h2>Shipping Address</h2>
          <p>{order.shippingAddress.fullName} · {order.shippingAddress.phone}</p>
          <p>{order.shippingAddress.addressLine1}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}</p>
        </section>
        <div className="order-detail-actions">
          <Link className="primary-action" to="/orders">View My Orders</Link>
          <Link className="secondary-action" to="/products">Continue Shopping</Link>
        </div>
      </article>
    </section>
  );
};

export default OrderDetails;
