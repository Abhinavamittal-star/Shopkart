const express = require("express");
const router = express.Router();
const {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  toggleWishlist
} = require("../controllers/wishlist.controller");
const { protect } = require("../middlewares/auth.middleware");

// Protect all wishlist endpoints
router.use(protect);

// GET current user's wishlist
router.get("/", getWishlist);

// POST add product to wishlist
router.post("/:productId", addToWishlist);

// DELETE remove product from wishlist
router.delete("/:productId", removeFromWishlist);

// PATCH toggle product in wishlist
router.patch("/:productId/toggle", toggleWishlist);

module.exports = router;
