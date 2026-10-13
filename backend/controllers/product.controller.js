const mongoose = require("mongoose");
const Product = require("../models/product.model");

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, stock } = req.body;

    // 1. Missing required field validation
    if (!name || !description || price === undefined || !category || !image || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (name, description, price, category, image, stock)"
      });
    }

    // 2. Validate price > 0
    const numericPrice = Number(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid price: Price must be a number greater than 0"
      });
    }

    // 3. Validate stock >= 0
    const numericStock = Number(stock);
    if (isNaN(numericStock) || numericStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock: Stock cannot be negative"
      });
    }

    // 4. Create Product
    const product = await Product.create({
      name,
      description,
      price: numericPrice,
      category,
      image,
      stock: numericStock
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error("Create Product Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error creating product",
      error: error.message
    });
  }
};


const getProducts = async (req, res) => {
  try {
    const { search, category } = req.query;
    const query = {};

    // Dynamic Search (case-insensitive name match)
    if (search && search.trim() !== "") {
      query.name = { $regex: search.trim(), $options: "i" };
    }

    // Dynamic Category Filter
    if (category && category.trim() !== "" && category.trim() !== "All Categories") {
      query.category = { $regex: `^${category.trim()}$`, $options: "i" };
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error("Get Products Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching products",
      error: error.message
    });
  }
};


const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format"
      });
    }

    // 2. Find Product
    const product = await Product.findById(id);

    // 3. Product not found check
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error("Get Product By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching product details",
      error: error.message
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById
};
