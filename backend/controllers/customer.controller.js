const Customer = require("../models/customer.model");
const generateToken = require("../utils/generateToken");

// @desc    Register a new customer
// @route   POST /customers/register
// @access  Public
const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // 1. Mandatory fields check
    if (!fullName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: "All fields (fullName, email, password, phone) are required"
      });
    }

    // 2. Password length validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters"
      });
    }

    // 3. Email uniqueness check
    const existingCustomer = await Customer.findOne({ email: email.toLowerCase() });
    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered"
      });
    }

    // 4. Create customer (password is hashed in pre-save hook)
    const customer = await Customer.create({
      fullName,
      email: email.toLowerCase(),
      password,
      phone
    });

    // 5. Response excluding password
    return res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      customer: {
        _id: customer._id,
        fullName: customer.fullName,
        email: customer.email,
        phone: customer.phone,
        createdAt: customer.createdAt
      }
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message
    });
  }
};

// @desc    Authenticate customer & set HttpOnly cookie
// @route   POST /customers/login
// @access  Public
const loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Mandatory fields check
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password"
      });
    }

    // 2. Find customer
    const customer = await Customer.findOne({ email: email.toLowerCase() });
    if (!customer) {
      // Generic error for security
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // 3. Compare password using bcrypt
    const isMatch = await customer.comparePassword(password);
    if (!isMatch) {
      // Generic error for security
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // 4. Generate JWT & attach to HttpOnly cookie
    generateToken(res, customer._id);

    return res.status(200).json({
      success: true,
      message: "Login successful"
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message
    });
  }
};

// @desc    Get currently authenticated customer profile
// @route   GET /customers/me
// @access  Protected
const getProfile = async (req, res) => {
  try {
    // req.user is set by auth middleware
    return res.status(200).json({
      _id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      phone: req.user.phone,
      wishlist: req.user.wishlist || [],
      createdAt: req.user.createdAt
    });
  } catch (error) {
    console.error("GetProfile Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching profile",
      error: error.message
    });
  }
};

// @desc    Logout customer & clear HttpOnly cookie
// @route   POST /customers/logout
// @access  Protected
const logoutCustomer = async (req, res) => {
  try {
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(0),
      sameSite: "lax"
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during logout",
      error: error.message
    });
  }
};

// @desc    Change password for authenticated customer (Bonus Challenge)
// @route   PATCH /customers/change-password
// @access  Protected
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old password and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long"
      });
    }

    // Fetch customer with password included
    const customer = await Customer.findById(req.user._id);

    // Verify old password
    const isMatch = await customer.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect old password"
      });
    }

    // Update password (pre-save hook will hash it)
    customer.password = newPassword;
    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    console.error("ChangePassword Error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating password",
      error: error.message
    });
  }
};

module.exports = {
  registerCustomer,
  loginCustomer,
  getProfile,
  logoutCustomer,
  changePassword
};
