import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { formatCurrency } from '../utils/currency';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await API.get('/orders');
        setOrders(response.data.orders || []);
      } catch (err) {
        console.error('Unable to load orders:', err);
        setError(err.response?.data?.message || 'Unable to load your orders.');
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  return (
    <section className="commerce-page">
      <header className="commerce-header">
        <div><h1>My Orders</h1><p>Your purchase history.</p></div>
      </header>
      {loading ? (
        <div className="state-container loading-state">Loading your orders…</div>
      ) : error ? (
        <div className="state-container error-state" role="alert">{error}</div>
      ) : orders.length === 0 ? (
        <div className="commerce-empty">
          <h2>You have not placed any orders yet.</h2>
          <Link className="primary-action" to="/products">Start shopping</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <article className="order-card" key={order._id}>
              <div className="order-card-header">
                <div>
                  <h2>Order #{order._id.slice(-8).toUpperCase()}</h2>
                  <p>{new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })}</p>
                </div>
                <span className={`order-status status-${order.status.toLowerCase()}`}>{order.status.replaceAll('_', ' ')}</span>
              </div>
              <ul className="order-items-preview">
                {order.items.map((item, index) => (
                  <li key={`${item.product}-${index}`}>{item.name} × {item.quantity}</li>
                ))}
              </ul>
              <div className="order-card-footer">
                <strong>Total: {formatCurrency(order.totalAmount)}</strong>
                <Link className="secondary-action" to={`/orders/${order._id}`}>View Details</Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default Orders;
