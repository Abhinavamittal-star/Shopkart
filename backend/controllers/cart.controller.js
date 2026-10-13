const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

const loadCart = async (customerId) => {
  const customer = await Customer.findById(customerId).select("cart").lean();
  if (!customer) {
    return null;
  }

  const productIds = customer.cart.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } })
    .select("name price image stock")
    .lean();
  const productById = new Map(products.map((product) => [product._id.toString(), product]));

  return customer.cart.map((item) => ({
    productId: item.product.toString(),
    product: productById.get(item.product.toString()) || null,
    quantity: item.quantity
  }));
};

const getCart = async (req, res) => {
  try {
    const cart = await loadCart(req.user._id);

    return res.status(200).json({
      success: true,
      cart: cart || []
    });
  } catch (error) {
    console.error("Get cart error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load your cart"
    });
  }
};

const addCartItem = async (req, res) => {
  try {
    const { productId } = req.body;
    const quantity = req.body.quantity === undefined ? 1 : Number(req.body.quantity);

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Valid productId is required" });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be a positive whole number" });
    }

    const [customer, product] = await Promise.all([
      Customer.findById(req.user._id),
      Product.findById(productId)
    ]);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const cartItem = customer.cart.find((item) => item.product.toString() === productId);
    const nextQuantity = quantity + (cartItem ? cartItem.quantity : 0);
    if (nextQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units of ${product.name} are currently available`
      });
    }

    if (cartItem) {
      cartItem.quantity = nextQuantity;
    } else {
      customer.cart.push({ product: product._id, quantity });
    }
    await customer.save();
    const cart = await loadCart(customer._id);

    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Add cart item error:", error);
    return res.status(500).json({ success: false, message: "Unable to add product to cart" });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const quantity = Number(req.body.quantity);
    if (!mongoose.Types.ObjectId.isValid(productId) || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "A valid productId and positive whole-number quantity are required"
      });
    }

    const [customer, product] = await Promise.all([
      Customer.findById(req.user._id),
      Product.findById(productId)
    ]);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units of ${product.name} are currently available`
      });
    }

    const cartItem = customer.cart.find((item) => item.product.toString() === productId);
    if (!cartItem) {
      return res.status(404).json({ success: false, message: "Product not found in cart" });
    }
    cartItem.quantity = quantity;
    await customer.save();
    const cart = await loadCart(customer._id);

    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Update cart item error:", error);
    return res.status(500).json({ success: false, message: "Unable to update cart" });
  }
};

const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: "Invalid productId" });
    }

    const customer = await Customer.findById(req.user._id);
    const originalLength = customer.cart.length;
    customer.cart = customer.cart.filter((item) => item.product.toString() !== productId);
    if (customer.cart.length === originalLength) {
      return res.status(404).json({ success: false, message: "Product not found in cart" });
    }
    await customer.save();
    const cart = await loadCart(customer._id);

    return res.status(200).json({ success: true, cart });
  } catch (error) {
    console.error("Remove cart item error:", error);
    return res.status(500).json({ success: false, message: "Unable to remove product from cart" });
  }
};

module.exports = { getCart, addCartItem, updateCartItem, removeCartItem };
