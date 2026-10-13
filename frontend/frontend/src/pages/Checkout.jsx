import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { formatCurrency } from '../utils/currency';

const fields = [
  ['fullName', 'Full Name', 'text'],
  ['phone', 'Phone Number', 'tel'],
  ['addressLine1', 'Address Line', 'text'],
  ['city', 'City', 'text'],
  ['state', 'State', 'text'],
  ['pincode', 'Pincode', 'text']
];

const loadRazorpayScript = () => new Promise((resolve) => {
  if (window.Razorpay) {
    resolve(true);
    return;
  }
  const existingScript = document.querySelector('script[data-razorpay-checkout]');
  if (existingScript) {
    existingScript.addEventListener('load', () => resolve(Boolean(window.Razorpay)), { once: true });
    existingScript.addEventListener('error', () => resolve(false), { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.async = true;
  script.dataset.razorpayCheckout = 'true';
  script.onload = () => resolve(Boolean(window.Razorpay));
  script.onerror = () => {
    script.remove();
    resolve(false);
  };
  document.body.appendChild(script);
});

const Checkout = ({ user, cart, onCartChange }) => {
  const navigate = useNavigate();
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    addressLine1: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (cart.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const total = cart.reduce((sum, item) => (
    item.product ? sum + item.product.price * item.quantity : sum
  ), 0);

  const validate = () => {
    for (const [key, label] of fields) {
      if (!shippingAddress[key].trim()) return `${label} is required.`;
    }
    if (!/^\+?[0-9\s()-]{7,15}$/.test(shippingAddress.phone.trim())) {
      return 'Enter a valid phone number.';
    }
    if (!/^\d{6}$/.test(shippingAddress.pincode.trim())) {
      return 'Pincode must contain 6 digits.';
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const response = await API.post('/orders/create-payment-order', {
        shippingAddress: Object.fromEntries(
          Object.entries(shippingAddress).map(([key, value]) => [key, value.trim()])
        )
      });
      const paymentOrder = response.data;
      if (paymentOrder.gateway === 'MOCK') {
        const verification = await API.post('/orders/verify-payment', {
          shopKartOrderId: paymentOrder.shopKartOrderId,
          mockPaymentToken: paymentOrder.mockPaymentToken
        });
        onCartChange([]);
        navigate(`/order-success/${verification.data.order._id}`);
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Unable to load Razorpay Checkout. Check your connection and try again.');
      }
      const payment = new window.Razorpay({
        key: paymentOrder.key,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: 'ShopKart',
        description: 'ShopKart order payment',
        order_id: paymentOrder.razorpayOrderId,
        prefill: {
          name: shippingAddress.fullName,
          contact: shippingAddress.phone
        },
        theme: { color: '#4f46e5' },
        handler: async (paymentResponse) => {
          try {
            const verification = await API.post('/orders/verify-payment', {
              shopKartOrderId: paymentOrder.shopKartOrderId,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature
            });
            onCartChange([]);
            navigate(`/order-success/${verification.data.order._id}`);
          } catch (verificationError) {
            console.error('Payment verification failed:', verificationError);
            setError(verificationError.response?.data?.message || 'Payment could not be verified. Your cart has not been cleared.');
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => setSubmitting(false)
        }
      });

      payment.on('payment.failed', (paymentFailure) => {
        console.error('Razorpay payment failed:', paymentFailure.error);
        setError(paymentFailure.error?.description || 'Payment failed. Your cart has not been cleared. Please try again.');
        setSubmitting(false);
      });
      payment.open();
    } catch (err) {
      console.error('Unable to start checkout:', err);
      setError(err.response?.data?.message || err.message || 'Unable to start payment. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <section className="commerce-page">
      <header className="commerce-header">
        <div>
          <h1>Checkout</h1>
          <p>Enter a delivery address and review your order.</p>
        </div>
      </header>
      <form className="checkout-layout" onSubmit={handleSubmit} noValidate>
        <div className="checkout-form-card">
          <h2>Shipping Details</h2>
          {error && <p className="error-message" role="alert">{error}</p>}
          <div className="checkout-fields">
            {fields.map(([key, label, type]) => (
              <div className={`form-group ${key === 'addressLine1' ? 'checkout-field-wide' : ''}`} key={key}>
                <label htmlFor={key}>{label}</label>
                <input
                  id={key}
                  type={type}
                  autoComplete={key === 'addressLine1' ? 'street-address' : key}
                  value={shippingAddress[key]}
                  onChange={(event) => setShippingAddress((current) => ({
                    ...current,
                    [key]: event.target.value
                  }))}
                />
              </div>
            ))}
          </div>
        </div>
        <aside className="order-summary">
          <h2>Order Summary</h2>
          {cart.map(({ product, quantity }, index) => (
            <div className="summary-line summary-product" key={product?._id || index}>
              <span>{product?.name || 'Unavailable product'} × {quantity}</span>
              <strong>{product ? formatCurrency(product.price * quantity) : '—'}</strong>
            </div>
          ))}
          <div className="summary-line summary-total"><span>Total</span><strong>{formatCurrency(total)}</strong></div>
          <p className="summary-note">Payment mode is configured on the server. In Mock mode, no real payment is charged.</p>
          <button className="primary-action full-width" type="submit" disabled={submitting}>
            {submitting ? 'Processing payment…' : 'Place Order'}
          </button>
          <Link className="secondary-action full-width" to="/cart">Back to cart</Link>
        </aside>
      </form>
    </section>
  );
};

export default Checkout;
