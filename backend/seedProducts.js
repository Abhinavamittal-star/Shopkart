const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Product = require("./models/product.model");
const connectDB = require("./config/db");

dotenv.config();

const sampleProducts = [
  {
    name: "Mechanical Keyboard",
    description: "RGB mechanical gaming keyboard with tactile blue switches and detachable USB-C cable.",
    price: 2999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
    stock: 10
  },
  {
    name: "Noise Cancelling Headphones",
    description: "Wireless over-ear headphones featuring active noise cancellation, 30-hour battery life, and high-fidelity sound.",
    price: 4999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
    stock: 25
  },
  {
    name: "Ultra HD Smart TV 43 Inch",
    description: "4K Ultra HD Smart LED TV with HDR10 support, Dolby Audio, and built-in streaming applications.",
    price: 24999,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=600&q=80",
    stock: 8
  },
  {
    name: "Classic Denim Jacket",
    description: "Premium cotton indigo denim jacket with button closure, double chest pockets, and relaxed fit.",
    price: 1899,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80",
    stock: 15
  },
  {
    name: "Running Shoes Light Pro",
    description: "Lightweight breathable mesh running shoes with cushioned foam midsole and durable rubber outsole.",
    price: 2499,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
    stock: 12
  },
  {
    name: "Clean Code Handbook",
    description: "A handbook of agile software craftsmanship covering principles, patterns, and practical code refactoring.",
    price: 699,
    category: "Books",
    image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80",
    stock: 30
  },
  {
    name: "Designing Data-Intensive Applications",
    description: "The definitive guide to architecture, data models, scalability, consistency, and distributed systems.",
    price: 999,
    category: "Books",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    stock: 20
  },
  {
    name: "Stainless Steel Electric Kettle",
    description: "1.8 Liter rapid boiling electric tea kettle with auto shut-off, boil-dry protection, and LED indicator.",
    price: 1299,
    category: "Home",
    image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f6?auto=format&fit=crop&w=600&q=80",
    stock: 18
  },
  {
    name: "Ergonomic Desk Chair",
    description: "Mesh executive office chair with adjustable lumbar support, 3D armrests, and smooth rolling casters.",
    price: 7999,
    category: "Home",
    image: "https://images.unsplash.com/photo-1580481072645-022f9a6d8310?auto=format&fit=crop&w=600&q=80",
    stock: 5
  }
];

const seedData = async () => {
  try {
    await connectDB();
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(sampleProducts);
      console.log("[Seed] Sample products inserted successfully.");
    } else {
      console.log(`[Seed] Database already contains ${count} products. Skipping initial seed.`);
    }
  } catch (error) {
    console.error("[Seed] Error seeding product data:", error.message);
  }
};

module.exports = seedData;
