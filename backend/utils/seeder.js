// utils/seeder.js
// Seeds the database with sample cricket products and a default admin
// Run: npm run seed
// Destroy: npm run seed -- -d

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

const PLACEHOLDER_IMG = {
  public_id: 'cricketnepal/placeholder',
  url: 'https://placehold.co/800x800/16a34a/ffffff?text=CricketNepal',
};

// ── Sample Users ─────────────────────────────────────────────────────────────
const users = [
  {
    name: 'Admin User',
    email: 'admin@cricketnepal.com',
    password: 'Admin@123',
    role: 'admin',
    isVerified: true,
    isActive: true,
  },
  {
    name: 'SG Sports Nepal',
    email: 'seller@cricketnepal.com',
    password: 'Seller@123',
    role: 'seller',
    isVerified: true,
    isActive: true,
    sellerInfo: {
      storeName: 'SG Sports Nepal',
      storeDescription: 'Official distributor of SG cricket equipment in Nepal',
      isApproved: true,
    },
  },
  {
    name: 'Ram Bahadur',
    email: 'user@cricketnepal.com',
    password: 'User@123',
    role: 'user',
    isVerified: true,
    isActive: true,
  },
];

// ── Sample Products (sellerId injected at runtime) ────────────────────────────
const getProducts = (sellerId) => [
  // BATS
  {
    seller: sellerId,
    name: 'SG Nexus Plus English Willow Cricket Bat',
    description: 'Grade 1 English Willow bat, hand-crafted for professional play. Ideal for all batting styles. Comes with a full toe guard, grip, and bat cover.',
    price: 18500,
    discountPrice: 16999,
    category: 'Bats',
    brand: 'SG',
    images: [PLACEHOLDER_IMG],
    stock: 25,
    sizes: ['Short Handle', 'Long Handle'],
    isFeatured: true,
    rating: 4.7,
    numReviews: 34,
    tags: ['english willow', 'professional', 'bat'],
    specifications: [
      { key: 'Wood', value: 'Grade 1 English Willow' },
      { key: 'Handle', value: 'Short Handle' },
      { key: 'Weight', value: '1.1 - 1.2 kg' },
    ],
  },
  {
    seller: sellerId,
    name: 'MRF Genius Grand Edition Bat',
    description: 'Used by Virat Kohli, the MRF Genius Grand Edition offers exceptional balance and power. Kashmir Willow construction for durability.',
    price: 9500,
    discountPrice: 8499,
    category: 'Bats',
    brand: 'MRF',
    images: [PLACEHOLDER_IMG],
    stock: 40,
    isFeatured: true,
    rating: 4.5,
    numReviews: 58,
    tags: ['kashmir willow', 'mrf', 'bat'],
    specifications: [
      { key: 'Wood', value: 'Kashmir Willow' },
      { key: 'Handle', value: 'Short Handle' },
    ],
  },
  // BALLS
  {
    seller: sellerId,
    name: 'Kookaburra Turf Cricket Ball (Red)',
    description: 'Official match ball used in international cricket. 5.5 oz weight, 22.4 cm circumference. Genuine leather construction with alum tanned leather.',
    price: 3200,
    discountPrice: 2799,
    category: 'Balls',
    brand: 'Kookaburra',
    images: [PLACEHOLDER_IMG],
    stock: 100,
    isFeatured: true,
    rating: 4.8,
    numReviews: 120,
    tags: ['leather ball', 'match ball', 'red ball'],
    specifications: [
      { key: 'Weight', value: '5.5 oz' },
      { key: 'Circumference', value: '22.4 cm' },
      { key: 'Leather', value: 'Alum Tanned' },
    ],
  },
  {
    seller: sellerId,
    name: 'SG Club Tennis Cricket Ball Pack (6)',
    description: 'High-quality tennis balls for tape ball and informal cricket. Pack of 6. Suitable for practice and tape ball tournaments popular in Nepal.',
    price: 650,
    discountPrice: 0,
    category: 'Balls',
    brand: 'SG',
    images: [PLACEHOLDER_IMG],
    stock: 200,
    rating: 4.3,
    numReviews: 45,
    tags: ['tennis ball', 'practice', 'tape ball'],
  },
  // GLOVES
  {
    seller: sellerId,
    name: 'GM Prima Batting Gloves',
    description: 'Premium batting gloves with full-length spandex back, natural rubber foam on palm for excellent grip and comfort. Suitable for all batting levels.',
    price: 4500,
    discountPrice: 3999,
    category: 'Gloves',
    brand: 'GM',
    images: [PLACEHOLDER_IMG],
    stock: 60,
    sizes: ['S', 'M', 'L', 'XL'],
    isFeatured: true,
    rating: 4.6,
    numReviews: 27,
    tags: ['batting gloves', 'gm', 'protection'],
    specifications: [
      { key: 'Palm', value: 'Natural rubber foam' },
      { key: 'Back', value: 'Full-length spandex' },
    ],
  },
  {
    seller: sellerId,
    name: 'SS Wicket-Keeping Gloves',
    description: 'Professional wicket-keeping gloves with padded fingers and palm. Superior grip for confident catching. Comes in a pair.',
    price: 3800,
    discountPrice: 3299,
    category: 'Gloves',
    brand: 'SS',
    images: [PLACEHOLDER_IMG],
    stock: 35,
    sizes: ['M', 'L'],
    rating: 4.4,
    numReviews: 19,
    tags: ['wicketkeeping', 'ss', 'gloves'],
  },
  // PADS
  {
    seller: sellerId,
    name: 'SG Test Batting Pads',
    description: 'Lightweight batting pads used in Test cricket. High-density foam with cane construction for maximum protection. Comfortable fit with three velcro straps.',
    price: 5500,
    discountPrice: 4999,
    category: 'Pads',
    brand: 'SG',
    images: [PLACEHOLDER_IMG],
    stock: 45,
    sizes: ['S', 'M', 'L'],
    isFeatured: false,
    rating: 4.5,
    numReviews: 22,
    tags: ['batting pads', 'sg', 'protection'],
    specifications: [
      { key: 'Straps', value: '3 Velcro' },
      { key: 'Construction', value: 'Cane + High-density foam' },
    ],
  },
  // HELMETS
  {
    seller: sellerId,
    name: 'Masuri Vision Series Cricket Helmet',
    description: 'ICC-approved cricket helmet with titanium grille. Adjustable dial-fit system. 360° adjustable peak. Suitable for all levels of play.',
    price: 12000,
    discountPrice: 10999,
    category: 'Helmets',
    brand: 'Masuri',
    images: [PLACEHOLDER_IMG],
    stock: 30,
    sizes: ['S', 'M', 'L', 'XL'],
    isFeatured: true,
    rating: 4.9,
    numReviews: 41,
    tags: ['helmet', 'icc approved', 'masuri', 'protection'],
    specifications: [
      { key: 'Grille', value: 'Titanium' },
      { key: 'Certification', value: 'ICC Approved' },
      { key: 'Fit', value: 'Dial-fit adjustable' },
    ],
  },
  // JERSEYS
  {
    seller: sellerId,
    name: 'Nepal Cricket Team Official Jersey 2024',
    description: 'Official replica jersey of Nepal National Cricket Team. Made from moisture-wicking polyester fabric. Available in all sizes.',
    price: 2800,
    discountPrice: 2499,
    category: 'Jerseys',
    brand: 'Nepal Cricket',
    images: [PLACEHOLDER_IMG],
    stock: 150,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Blue', 'White'],
    isFeatured: true,
    rating: 4.7,
    numReviews: 88,
    tags: ['nepal cricket', 'jersey', 'national team', 'fan gear'],
  },
  {
    seller: sellerId,
    name: 'Custom Cricket Team Jersey (Set of 11)',
    description: 'Order custom cricket jerseys for your team. Choose your colors, numbers, and name printing. Minimum order: 11 jerseys.',
    price: 22000,
    discountPrice: 19999,
    category: 'Jerseys',
    brand: 'CricketNepal',
    images: [PLACEHOLDER_IMG],
    stock: 50,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    rating: 4.6,
    numReviews: 14,
    tags: ['custom jersey', 'team kit', 'bulk order'],
  },
  // SHOES
  {
    seller: sellerId,
    name: 'Adidas CricketGrip 22 Cricket Shoes',
    description: 'Lightweight cricket shoes with TPU spike plate for excellent grip on grass pitches. Breathable mesh upper with reinforced toe cap.',
    price: 8500,
    discountPrice: 7499,
    category: 'Shoes',
    brand: 'Adidas',
    images: [PLACEHOLDER_IMG],
    stock: 55,
    sizes: ['7', '8', '9', '10', '11'],
    colors: ['White/Black', 'All White'],
    isFeatured: true,
    rating: 4.5,
    numReviews: 33,
    tags: ['cricket shoes', 'adidas', 'spikes'],
    specifications: [
      { key: 'Spike Plate', value: 'TPU' },
      { key: 'Upper', value: 'Breathable Mesh' },
    ],
  },
  // BAGS
  {
    seller: sellerId,
    name: 'Kookaburra Pro 2.0 Cricket Duffle Bag',
    description: 'Large-capacity cricket bag with dedicated bat pocket (fits up to 3 bats), padded shoe compartment, and multiple accessory pockets. Waterproof base.',
    price: 6500,
    discountPrice: 5999,
    category: 'Bags',
    brand: 'Kookaburra',
    images: [PLACEHOLDER_IMG],
    stock: 40,
    isFeatured: false,
    rating: 4.4,
    numReviews: 17,
    tags: ['cricket bag', 'kookaburra', 'duffle'],
  },
  // ACCESSORIES
  {
    seller: sellerId,
    name: 'SG Players Grade Batting Grip (Pack of 3)',
    description: 'High-quality octopus grip for cricket bats. Anti-slip texture for better control. Pack of 3 grips.',
    price: 450,
    discountPrice: 0,
    category: 'Accessories',
    brand: 'SG',
    images: [PLACEHOLDER_IMG],
    stock: 300,
    colors: ['Black', 'Red', 'Blue', 'Green'],
    rating: 4.3,
    numReviews: 67,
    tags: ['bat grip', 'accessories', 'grip'],
  },
  {
    seller: sellerId,
    name: 'GM Abdo Guard (Box)',
    description: 'Protective abdominal guard for male cricketers. High-density polyethylene shell with foam padding. Fits inside trousers.',
    price: 1200,
    discountPrice: 999,
    category: 'Accessories',
    brand: 'GM',
    images: [PLACEHOLDER_IMG],
    stock: 80,
    sizes: ['S', 'M', 'L'],
    rating: 4.2,
    numReviews: 12,
    tags: ['abdo guard', 'protection', 'accessories'],
  },
  {
    seller: sellerId,
    name: 'Cricket Training Aid — Catching Cradle Net',
    description: 'Portable catching cradle for solo fielding practice. Steel frame with durable net. Easy to set up and take down. Great for ground-level catching drills.',
    price: 4500,
    discountPrice: 3999,
    category: 'Training Equipment',
    brand: 'CricketNepal',
    images: [PLACEHOLDER_IMG],
    stock: 20,
    isFeatured: false,
    rating: 4.1,
    numReviews: 8,
    tags: ['training', 'fielding', 'catching', 'net'],
  },
];

// ── Seed / Destroy ────────────────────────────────────────────────────────────
const importData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    // Hash passwords and insert users
    const createdUsers = await User.insertMany(
      users.map((u) => ({ ...u })) // passwords hashed via pre-save hook
    );

    const adminUser = createdUsers[0];
    const sellerUser = createdUsers[1];

    console.log(`✅ ${createdUsers.length} users seeded`);

    // Insert products with seller reference
    const products = getProducts(sellerUser._id);
    await Product.insertMany(products);
    console.log(`✅ ${products.length} products seeded`);

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Admin:  admin@cricketnepal.com / Admin@123');
    console.log('  Seller: seller@cricketnepal.com / Seller@123');
    console.log('  User:   user@cricketnepal.com  / User@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await connectDB();
    await Order.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();
    console.log('🗑️  All data destroyed');
    process.exit(0);
  } catch (error) {
    console.error(`❌ Destroy failed: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
