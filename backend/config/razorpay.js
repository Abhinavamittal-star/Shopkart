const Razorpay = require("razorpay");

const getPaymentGateway = () =>
  process.env.PAYMENT_GATEWAY || (process.env.NODE_ENV === "production" ? "razorpay" : "mock");

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret || !keyId.startsWith("rzp_test_")) {
    return null;
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

module.exports = { getPaymentGateway, getRazorpayClient };
