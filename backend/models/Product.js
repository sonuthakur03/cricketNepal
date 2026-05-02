// models/Product.js
// Full product schema for cricket gear sold in Nepal

const mongoose = require('mongoose');
const slugify = require('slugify');

// Sub-schema for product reviews
const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please enter product name'],
      trim: true,
      maxlength: [100, 'Product name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Please enter product description'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please enter product price'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    // Category — primary classification
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Bats',
        'Balls',
        'Gloves',
        'Pads',
        'Helmets',
        'Jerseys',
        'Shoes',
        'Bags',
        'Accessories',
        'Training Equipment',
      ],
    },
    brand: {
      type: String,
      required: [true, 'Please enter brand name'],
      trim: true,
    },
    images: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    stock: {
      type: Number,
      required: [true, 'Please enter stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    // Sizes applicable for jerseys, pads, helmets, gloves
    sizes: {
      type: [String],
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size', ''],
      default: [],
    },
    // Color variants
    colors: {
      type: [String],
      default: [],
    },
    // Product specifications (key-value pairs)
    specifications: [
      {
        key: { type: String },
        value: { type: String },
      },
    ],
    reviews: [reviewSchema],
    rating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Pre-save: Auto-generate slug from name ────────────────────────────────
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// ── Virtual: Calculate discount percentage ────────────────────────────────
productSchema.virtual('discountPercent').get(function () {
  if (this.discountPrice && this.price > 0) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});

// ── Virtual: Final selling price ─────────────────────────────────────────
productSchema.virtual('finalPrice').get(function () {
  return this.discountPrice > 0 ? this.discountPrice : this.price;
});

// ── Index for fast search ─────────────────────────────────────────────────
productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
productSchema.index({ category: 1, brand: 1, price: 1 });
productSchema.index({ seller: 1 });

module.exports = mongoose.model('Product', productSchema);
