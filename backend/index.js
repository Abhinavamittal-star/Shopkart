const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Load environment variables from the backend folder regardless of the working directory.
dotenv.config({ path: path.join(__dirname, ".env") });

const connectDB = require("./config/db.js");
const customerRoutes = require("./routes/customer.routes.js");
const productRoutes = require("./routes/product.routes.js");
const wishlistRoutes = require("./routes/wishlist.routes.js");
const cartRoutes = require("./routes/cart.routes.js");
const orderRoutes = require("./routes/order.routes.js");
const seedData = require("./seedProducts.js");

const app = express();
const frontendDistPath = path.join(__dirname, "../frontend/frontend/dist");

// Middleware
const allowedOrigins = (process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
if (process.env.NODE_ENV !== "production") {
  allowedOrigins.push("http://localhost:5173", "http://127.0.0.1:5173");
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to ShopKart Customer & Product Catalog API Service",
    status: "Active",
    timestamp: new Date()
  });
});

// Keep unknown API requests as JSON responses rather than serving the frontend.
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Serve the built React app from the same origin as the API.
app.use(express.static(frontendDistPath));
app.get("*", (req, res, next) => {
  res.sendFile(path.join(frontendDistPath, "index.html"), (error) => {
    if (error) next(error);
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

const startServer = async () => {
  if (process.env.NODE_ENV === "production") {
    const requiredVariables = ["MONGO_URI", "JWT_SECRET", "CLIENT_URL"];
    const missingVariables = requiredVariables.filter((key) => !process.env[key]);
    if (missingVariables.length) {
      throw new Error(`Missing required production environment variables: ${missingVariables.join(", ")}`);
    }
    if (process.env.PAYMENT_GATEWAY !== "razorpay") {
      throw new Error("Production must use PAYMENT_GATEWAY=razorpay");
    }
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Production Razorpay credentials are required");
    }
  }

  await connectDB();
  await seedData();

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[ShopKart Backend] Server running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error("[ShopKart Backend] Startup failed:", error.message);
  process.exitCode = 1;
});
