const mongoose = require("mongoose");
const Customer = require("../models/customer.model");
const Product = require("../models/product.model");

// @desc    Add product to user's wishlist
// @route   POST /wishlist/:productId
// @access  Protected
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format"
      });
    }

    // 2. Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // 3. Find current user
    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found"
      });
    }

    // 4. Check for duplicate wishlist entry
    const isAlreadyInWishlist = user.wishlist.some(
      (id) => id && id.toString() === productId
    );

    if (isAlreadyInWishlist) {
      return res.status(409).json({
        success: false,
        message: "Product is already in your wishlist"
      });
    }

    // 5. Add product reference & save
    user.wishlist.push(productId);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      wishlist: user.wishlist
    });
  } catch (error) {
    console.error("addToWishlist Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error adding product to wishlist",
      error: error.message
    });
  }
};

// @desc    Get current user's wishlist
// @route   GET /wishlist
// @access  Protected
const getWishlist = async (req, res) => {
  try {
    const user = await Customer.findById(req.user._id).populate({
      path: "wishlist",
      select: "name price category image stock description"
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found"
      });
    }

    // Filter out null values in case a referenced product was deleted from DB
    const populatedItems = (user.wishlist || []).filter((item) => item !== null);

    return res.status(200).json({
      success: true,
      count: populatedItems.length,
      wishlist: populatedItems
    });
  } catch (error) {
    console.error("getWishlist Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error loading wishlist",
      error: error.message
    });
  }
};

// @desc    Remove product from user's wishlist
// @route   DELETE /wishlist/:productId
// @access  Protected
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Validate productId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format"
      });
    }

    // 2. Find user
    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found"
      });
    }

    // 3. Check if product is in wishlist
    const isInWishlist = user.wishlist.some(
      (id) => id && id.toString() === productId
    );

    if (!isInWishlist) {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist"
      });
    }

    // 4. Remove product reference & save
    user.wishlist = user.wishlist.filter(
      (id) => id && id.toString() !== productId
    );
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      wishlist: user.wishlist
    });
  } catch (error) {
    console.error("removeFromWishlist Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error removing product from wishlist",
      error: error.message
    });
  }
};

// @desc    Toggle product in user's wishlist (Bonus Challenge)
// @route   PATCH /wishlist/:productId/toggle
// @access  Protected
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format"
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const user = await Customer.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found"
      });
    }

    const index = user.wishlist.findIndex(
      (id) => id && id.toString() === productId
    );

    let saved = false;
    if (index > -1) {
      user.wishlist.splice(index, 1);
      saved = false;
    } else {
      user.wishlist.push(productId);
      saved = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      saved,
      isWishlisted: saved,
      message: saved ? "Product added to wishlist" : "Product removed from wishlist",
      wishlist: user.wishlist
    });
  } catch (error) {
    console.error("toggleWishlist Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error toggling wishlist",
      error: error.message
    });
  }
};

module.exports = {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist
};
