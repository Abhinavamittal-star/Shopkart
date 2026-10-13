const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const {
  createPaymentOrder,
  verifyPayment,
  getOrders,
  getOrderById
} = require("../controllers/order.controller");

const router = express.Router();
router.use(protect);
router.post("/create-payment-order", createPaymentOrder);
router.post("/verify-payment", verifyPayment);
router.get("/", getOrders);
router.get("/:id", getOrderById);

module.exports = router;
