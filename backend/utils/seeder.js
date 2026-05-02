require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

const PLACEHOLDER_IMG = {
  public_id: "cricketnepal/placeholder",
  url: "https://placehold.co/800x800/16a34a/ffffff?text=CricketNepal",
};

// ── USERS ─────────────────────────────────────────
const users = [
  {
    name: "Admin User",
    email: "admin@cricketnepal.com",
    password: "Admin@123",
    role: "admin",
    isActive: true,
  },
  {
    name: "SG Sports Nepal",
    email: "seller@cricketnepal.com",
    password: "Seller@123",
    role: "seller",
    isActive: true,
  },
  {
    name: "Ram Bahadur",
    email: "user@cricketnepal.com",
    password: "User@123",
    role: "user",
    isActive: true,
  },
];

// ── PRODUCTS ─────────────────────────────────────
const getProducts = (sellerId) => [
  {
    seller: sellerId,
    name: "SG Nexus Plus English Willow Cricket Bat",
    description: "Grade 1 English Willow bat for professional play.",
    price: 18500,
    discountPrice: 16999,
    category: "Bats",
    brand: "SG",
    images: [PLACEHOLDER_IMG],
    stock: 25,
    sizes: ["Short Handle", "Long Handle"],
    isFeatured: true,
  },
  {
    seller: sellerId,
    name: "MRF Genius Grand Edition Bat",
    description: "Kashmir Willow bat used by professionals.",
    price: 9500,
    discountPrice: 8499,
    category: "Bats",
    brand: "MRF",
    images: [PLACEHOLDER_IMG],
    stock: 40,
  },
  {
    seller: sellerId,
    name: "Kookaburra Turf Cricket Ball",
    description: "Official leather match ball.",
    price: 3200,
    discountPrice: 2799,
    category: "Balls",
    brand: "Kookaburra",
    images: [PLACEHOLDER_IMG],
    stock: 100,
  },
  {
    seller: sellerId,
    name: "GM Prima Batting Gloves",
    description: "Premium batting gloves.",
    price: 4500,
    discountPrice: 3999,
    category: "Gloves",
    brand: "GM",
    images: [PLACEHOLDER_IMG],
    stock: 60,
    sizes: ["S", "M", "L", "XL"],
  },
  {
    seller: sellerId,
    name: "Masuri Vision Helmet",
    description: "ICC approved cricket helmet.",
    price: 12000,
    discountPrice: 10999,
    category: "Helmets",
    brand: "Masuri",
    images: [PLACEHOLDER_IMG],
    stock: 30,
    sizes: ["S", "M", "L"],
  },
  {
    seller: sellerId,
    name: "Nepal Cricket Jersey",
    description: "Official Nepal cricket jersey.",
    price: 2800,
    discountPrice: 2499,
    category: "Jerseys",
    brand: "Nepal Cricket",
    images: [PLACEHOLDER_IMG],
    stock: 150,
    sizes: ["S", "M", "L", "XL"],
  },
];

// ── IMPORT DATA ──────────────────────────────────
const importData = async () => {
  try {
    await connectDB();

    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    // Create users (runs password hashing)
    const createdUsers = [];
    for (const u of users) {
      const user = await User.create(u);
      createdUsers.push(user);
    }

    const sellerUser = createdUsers[1];

    console.log(`✅ ${createdUsers.length} users seeded`);

    const products = getProducts(sellerUser._id);

    // IMPORTANT: use create (NOT insertMany)
    for (const product of products) {
      await Product.create(product);
    }

    console.log(`✅ ${products.length} products seeded`);

    console.log("\n🎉 Database seeded successfully!\n");

    process.exit();
  } catch (error) {
    console.error(`❌ SEED ERROR: ${error.message}`);
    process.exit(1);
  }
};

// ── DESTROY DATA ────────────────────────────────
const destroyData = async () => {
  try {
    await connectDB();

    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    console.log("🗑️ All data destroyed");
    process.exit();
  } catch (error) {
    console.error(`❌ DESTROY ERROR: ${error.message}`);
    process.exit(1);
  }
};

// ── RUN ─────────────────────────────────────────
if (process.argv[2] === "-d") {
  destroyData();
} else {
  importData();
}
