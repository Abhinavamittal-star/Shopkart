const mongoose = require("mongoose");
const dns = require("dns");

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/shopkart";

  if (uri.startsWith("mongodb+srv://")) {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1"]);
    } catch (dnsErr) {
      console.warn("[MongoDB] DNS server setup warning:", dnsErr.message);
    }
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    if (process.env.NODE_ENV === "production") {
      throw error;
    }

    console.log(`[MongoDB] Could not connect to primary instance (${error.message}). Attempting In-Memory MongoDB fallback...`);
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      const conn = await mongoose.connect(mongoUri);
      console.log(`[MongoDB] Connected to In-Memory Database: ${conn.connection.host}`);
      return conn;
    } catch (fallbackError) {
      console.error(`[MongoDB] Error initializing database: ${fallbackError.message}`);
      console.error("[MongoDB] Please ensure MongoDB service is started or MONGO_URI is set in .env");
    }
  }
};

module.exports = connectDB;
