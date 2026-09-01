require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

const img = (name) => ({
  public_id: `cricketnepal/${name}`,
  url: `/images/products/${name}.jpg`,
});

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

// ── PRODUCTS (No hyphens in text) ─────────────────
const getProducts = (sellerId) => [
  {
    seller: sellerId,
    name: "Kookaburra Gold Edition English Willow Cricket Bat",
    description: "Handcrafted Grade 1 English Willow cricket bat with balanced pickup and thick power edges for professional tournament matches.",
    price: 18500,
    discountPrice: 16999,
    category: "Bats",
    brand: "Kookaburra",
    images: [img("bat")],
    stock: 25,
    sizes: ["Short Handle", "Long Handle"],
    isFeatured: true,
  },
  {
    seller: sellerId,
    name: "SG Nexus Pro Kashmir Willow Cricket Bat",
    description: "Premium Kashmir Willow bat selected for explosive stroke play with dynamic sweet spot.",
    price: 9500,
    discountPrice: 8499,
    category: "Bats",
    brand: "SG",
    images: [img("bat")],
    stock: 40,
    sizes: ["Short Handle", "Long Handle"],
    isFeatured: true,
  },
  {
    seller: sellerId,
    name: "The Master Series Red Leather Match Cricket Ball",
    description: "Four piece alum tanned genuine leather match ball with hand stitched waxed linen seam.",
    price: 3200,
    discountPrice: 2799,
    category: "Balls",
    brand: "Kookaburra",
    images: [img("ball")],
    stock: 120,
    isFeatured: true,
  },
  {
    seller: sellerId,
    name: "Atlas Carbon Series Pro Batting Gloves",
    description: "Ultra flex multi split finger protection with carbon fiber shield inserts and premium Pittards leather palm.",
    price: 4500,
    discountPrice: 3999,
    category: "Gloves",
    brand: "GM",
    images: [img("gloves")],
    stock: 60,
    sizes: ["S", "M", "L", "XL"],
    isFeatured: true,
  },
  {
    seller: sellerId,
    name: "Aurum Pro Air Lightweight Batting Leg Guards",
    description: "High density molded foam lightweight batting pads with gold cane ribs and breathable gel knee cup.",
    price: 6500,
    discountPrice: 5899,
    category: "Pads",
    brand: "SS",
    images: [img("pads")],
    stock: 45,
    sizes: ["M", "L"],
    isFeatured: true,
  },
  {
    seller: sellerId,
    name: "Shrey Titanium Aerodynamic Cricket Helmet",
    description: "ICC safety standard certified cricket helmet with high impact composite shell and gold titanium face grille.",
    price: 12000,
    discountPrice: 10999,
    category: "Helmets",
    brand: "Shrey",
    images: [img("helmet")],
    stock: 30,
    sizes: ["S", "M", "L"],
    isFeatured: true,
  },
  {
    seller: sellerId,
    name: "Aura 77 Gold Spikes Turf Cricket Shoes",
    description: "High performance cricket spikes with metal turf studs, cushioned EVA midsole and breathable athletic mesh.",
    price: 8500,
    discountPrice: 7499,
    category: "Shoes",
    brand: "Adidas",
    images: [img("shoes")],
    stock: 35,
    sizes: ["7", "8", "9", "10", "11"],
    isFeatured: true,
  },
  {
    seller: sellerId,
    name: "Pro Guard Elite Wheelie Cricket Kit Duffle Bag",
    description: "Heavy duty ballistic cordura fabric kit bag with multi bat compartments, shoe tunnel and all terrain wheels.",
    price: 9200,
    discountPrice: 8299,
    category: "Bags",
    brand: "MRF",
    images: [img("kitbag")],
    stock: 20,
    isFeatured: true,
  },
  {
    seller: sellerId,
    name: "Nepal National Team Supporters Cricket Jersey",
    description: "Official performance athletic team jersey in breathable moisture wicking fabric with authentic gold national crest.",
    price: 2800,
    discountPrice: 2499,
    category: "Jerseys",
    brand: "Nepal Cricket",
    images: [img("jersey")],
    stock: 150,
    sizes: ["S", "M", "L", "XL"],
    isFeatured: true,
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

    for (const product of products) {
      await Product.create(product);
    }

    console.log(`✅ ${products.length} products seeded with photorealistic images`);

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
