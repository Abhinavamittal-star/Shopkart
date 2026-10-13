const express = require("express");
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById
} = require("../controllers/product.controller");

// Product endpoints
router.post("/", createProduct);
router.get("/", getProducts);
router.get("/:id", getProductById);

module.exports = router;
