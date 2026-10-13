const crypto = require("crypto");
const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Order = require("../models/order.model");
const { getPaymentGateway, getRazorpayClient } = require("../config/razorpay");

const validateShippingAddress = (address) => {
  const fields = ["fullName", "phone", "addressLine1", "city", "state", "pincode"];
  if (!address || fields.some((field) => typeof address[field] !== "string" || !address[field].trim())) {
    return "All shipping address fields are required";
  }
  if (!/^\+?[0-9\s()-]{7,15}$/.test(address.phone.trim())) {
    return "Enter a valid phone number";
  }
  if (!/^\d{6}$/.test(address.pincode.trim())) {
    return "Pincode must contain 6 digits";
  }
  return null;
};

const createPaymentOrder = async (req, res) => {
  try {
    const shippingAddress = req.body.shippingAddress;
    const addressError = validateShippingAddress(shippingAddress);
    if (addressError) {
      return res.status(400).json({ success: false, message: addressError });
    }

    const customer = await Customer.findById(req.user._id).populate("cart.product");
    if (!customer || customer.cart.length === 0) {
      return res.status(400).json({ success: false, message: "Your cart is empty" });
    }

    const items = [];
    let totalPaise = 0;
    for (const cartItem of customer.cart) {
      const product = cartItem.product;
      if (!product) {
        return res.status(400).json({
          success: false,
          message: "A product in your cart is no longer available. Remove it before checkout."
        });
      }
      if (!Number.isInteger(cartItem.quantity) || cartItem.quantity < 1) {
        return res.status(400).json({ success: false, message: `Invalid quantity for ${product.name}` });
      }
      if (cartItem.quantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Only ${product.stock} available.`
        });
      }

      const price = Math.round(product.price * 100) / 100;
      totalPaise += Math.round(price * 100) * cartItem.quantity;
      items.push({
        product: product._id,
        name: product.name,
        price,
        quantity: cartItem.quantity,
        image: product.image
      });
    }

    const paymentGateway = getPaymentGateway();
    if (paymentGateway !== "mock" && paymentGateway !== "razorpay") {
      return res.status(503).json({
        success: false,
        message: "Unsupported payment gateway configuration."
      });
    }
    if (paymentGateway === "mock" && process.env.NODE_ENV === "production") {
      return res.status(503).json({
        success: false,
        message: "Mock payments are disabled in production."
      });
    }

    const razorpay = paymentGateway === "razorpay" ? getRazorpayClient() : null;
    if (paymentGateway === "razorpay" && !razorpay) {
      return res.status(503).json({
        success: false,
        message: "Razorpay Test Mode is not configured. Set valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET."
      });
    }

    const savedAddress = {
      fullName: shippingAddress.fullName.trim(),
      phone: shippingAddress.phone.trim(),
      addressLine1: shippingAddress.addressLine1.trim(),
      city: shippingAddress.city.trim(),
      state: shippingAddress.state.trim(),
      pincode: shippingAddress.pincode.trim()
    };
    const order = await Order.create({
      user: customer._id,
      items,
      shippingAddress: savedAddress,
      totalAmount: totalPaise / 100,
      paymentGateway: paymentGateway === "mock" ? "MOCK" : "RAZORPAY"
    });

    if (paymentGateway === "mock") {
      const mockPaymentToken = crypto.randomBytes(32).toString("hex");
      order.mockPaymentTokenHash = crypto
        .createHash("sha256")
        .update(mockPaymentToken)
        .digest("hex");
      await order.save();

      return res.status(201).json({
        success: true,
        gateway: "MOCK",
        shopKartOrderId: order._id,
        amount: totalPaise,
        currency: "INR",
        mockPaymentToken
      });
    }

    try {
      const razorpayOrder = await razorpay.orders.create({
        amount: totalPaise,
        currency: "INR",
        receipt: order._id.toString()
      });
      order.razorpayOrderId = razorpayOrder.id;
      await order.save();

      return res.status(201).json({
        success: true,
        gateway: "RAZORPAY",
        shopKartOrderId: order._id,
        razorpayOrderId: razorpayOrder.id,
        amount: totalPaise,
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID
      });
    } catch (error) {
      await Order.findByIdAndDelete(order._id);
      throw error;
    }
  } catch (error) {
    console.error("Create payment order error:", error);
    return res.status(502).json({
      success: false,
      message: "Unable to create a Razorpay payment order. Please try again."
    });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const {
      shopKartOrderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      mockPaymentToken
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(shopKartOrderId)) {
      return res.status(400).json({ success: false, message: "A valid ShopKart order ID is required" });
    }

    const order = await Order.findOne({ _id: shopKartOrderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.paymentGateway === "MOCK") {
      if (process.env.NODE_ENV === "production") {
        return res.status(503).json({ success: false, message: "Mock payments are disabled in production." });
      }
      if (typeof mockPaymentToken !== "string" || !order.mockPaymentTokenHash) {
        return res.status(400).json({ success: false, message: "Mock payment details are incomplete" });
      }

      const receivedTokenHash = crypto.createHash("sha256").update(mockPaymentToken).digest();
      const expectedTokenHash = Buffer.from(order.mockPaymentTokenHash, "hex");
      if (
        receivedTokenHash.length !== expectedTokenHash.length ||
        !crypto.timingSafeEqual(receivedTokenHash, expectedTokenHash)
      ) {
        return res.status(400).json({ success: false, message: "Invalid mock payment token" });
      }

      if (order.paymentStatus === "PAID") {
        return res.status(200).json({ success: true, order });
      }
      if (order.paymentStatus !== "PENDING") {
        return res.status(409).json({ success: false, message: "This payment attempt is no longer pending" });
      }
      if (crypto.randomInt(0, 4) === 0) {
        order.paymentStatus = "FAILED";
        await order.save();
        return res.status(402).json({
          success: false,
          paymentStatus: "FAILED",
          message: "Payment was declined by the mock gateway. Your cart has not been cleared. Please try again."
        });
      }

      order.paymentStatus = "PAID";
      order.status = "PLACED";
      order.razorpayPaymentId = `mock_pay_${crypto.randomUUID()}`;
      await order.save();

      const customer = await Customer.findById(req.user._id);
      if (!customer) {
        return res.status(404).json({ success: false, message: "Customer account not found" });
      }
      customer.cart = [];
      await customer.save();

      return res.status(200).json({ success: true, order });
    }

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: "Payment verification details are incomplete" });
    }
    if (!order.razorpayOrderId || order.razorpayOrderId !== razorpayOrderId) {
      return res.status(400).json({ success: false, message: "Payment order does not match this ShopKart order" });
    }
    if (order.paymentStatus === "PAID") {
      if (order.razorpayPaymentId === razorpayPaymentId) {
        await Customer.findByIdAndUpdate(req.user._id, { $set: { cart: [] } });
        return res.status(200).json({ success: true, order });
      }
      return res.status(409).json({ success: false, message: "This order has already been paid" });
    }
    if (order.paymentStatus !== "PENDING") {
      return res.status(409).json({ success: false, message: "This payment attempt is no longer pending" });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(503).json({ success: false, message: "Razorpay verification is not configured" });
    }
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${order.razorpayOrderId}|${razorpayPaymentId}`)
      .digest();
    const receivedSignature = Buffer.from(razorpaySignature, "hex");
    if (
      receivedSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(expectedSignature, receivedSignature)
    ) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    order.paymentStatus = "PAID";
    order.status = "PLACED";
    order.razorpayPaymentId = razorpayPaymentId;
    await order.save();

    const customer = await Customer.findById(req.user._id);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer account not found" });
    }
    customer.cart = [];
    await customer.save();

    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Verify payment error:", error);
    return res.status(500).json({ success: false, message: "Unable to verify payment" });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Get orders error:", error);
    return res.status(500).json({ success: false, message: "Unable to load your orders" });
  }
};

const getOrderById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    return res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Get order error:", error);
    return res.status(500).json({ success: false, message: "Unable to load this order" });
  }
};

module.exports = { createPaymentOrder, verifyPayment, getOrders, getOrderById };
