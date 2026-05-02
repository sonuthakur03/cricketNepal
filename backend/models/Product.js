const mongoose = require("mongoose");
const slugify = require("slugify");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true },
);

const productSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: [true, "Please enter product name"],
      trim: true,
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },

    slug: {
      type: String,
      unique: true,
    },

    description: {
      type: String,
      required: [true, "Please enter product description"],
      maxlength: [2000],
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discountPrice: {
      type: Number,
      default: 0,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Bats",
        "Balls",
        "Gloves",
        "Pads",
        "Helmets",
        "Jerseys",
        "Shoes",
        "Bags",
        "Accessories",
        "Training Equipment",
      ],
    },

    brand: {
      type: String,
      required: true,
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
      required: true,
      min: 0,
      default: 0,
    },

    // ✅ FIXED: flexible sizes (no enum)
    sizes: {
      type: [String],
      default: [],
    },

    colors: {
      type: [String],
      default: [],
    },

    specifications: [
      {
        key: String,
        value: String,
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
  },
);

// slug
productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// discount %
productSchema.virtual("discountPercent").get(function () {
  if (this.discountPrice && this.price > 0) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});

// final price
productSchema.virtual("finalPrice").get(function () {
  return this.discountPrice > 0 ? this.discountPrice : this.price;
});

// indexes
productSchema.index({
  name: "text",
  description: "text",
  brand: "text",
  tags: "text",
});

productSchema.index({ category: 1, brand: 1, price: 1 });
productSchema.index({ seller: 1 });

module.exports = mongoose.model("Product", productSchema);
