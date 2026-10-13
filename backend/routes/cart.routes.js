const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem
} = require("../controllers/cart.controller");

const router = express.Router();
router.use(protect);
router.get("/", getCart);
router.post("/items", addCartItem);
router.patch("/items/:productId", updateCartItem);
router.delete("/items/:productId", removeCartItem);

module.exports = router;
