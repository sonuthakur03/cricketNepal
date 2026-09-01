// controllers/productController.js
// Full product CRUD, search, filters, reviews, wishlist

const asyncHandler = require("express-async-handler");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { cloudinary } = require("../config/cloudinary");

/**
 * Helper to safely parse and sanitize FormData / body fields for products (DRY)
 */
const parseProductFormData = (body, files = [], existingImages = []) => {
  const data = { ...body };

  // Append new images from multer if uploaded
  if (files && files.length > 0) {
    const newImages = files.map((f) => ({
      public_id: f.filename,
      url: f.path,
    }));
    data.images = [...existingImages, ...newImages];
  }

  // Parse specifications JSON if provided as string
  if (data.specifications !== undefined) {
    if (typeof data.specifications === "string") {
      try {
        data.specifications = JSON.parse(data.specifications);
      } catch {
        data.specifications = [];
      }
    }
  }

  // Parse comma-separated arrays
  ["sizes", "colors", "tags"].forEach((key) => {
    if (typeof data[key] === "string") {
      data[key] = data[key]
        ? data[key]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
    }
  });

  // FormData sends booleans as strings — convert them
  if (typeof data.isFeatured === "string") {
    data.isFeatured = data.isFeatured === "true";
  }
  if (typeof data.isActive === "string") {
    data.isActive = data.isActive === "true";
  }

  // Convert numeric strings
  if (data.price !== undefined && data.price !== "") {
    data.price = Number(data.price);
  }
  if (data.discountPrice !== undefined && data.discountPrice !== "") {
    data.discountPrice = Number(data.discountPrice);
  }
  if (data.stock !== undefined && data.stock !== "") {
    data.stock = Number(data.stock);
  }

  return data;
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all products with filters, sorting, search, pagination
// @route   GET /api/products
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getProducts = asyncHandler(async (req, res) => {
  const {
    keyword,
    category,
    brand,
    minPrice,
    maxPrice,
    rating,
    sort,
    page = 1,
    limit = 12,
    featured,
  } = req.query;

  const query = { isActive: true };

  // Full-text search
  if (keyword) {
    query.$text = { $search: keyword };
  }

  // Category filter
  if (category) query.category = category;

  // Brand filter (supports comma-separated: ?brand=SG,MRF)
  if (brand) query.brand = { $in: brand.split(",") };

  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Rating filter
  if (rating) query.rating = { $gte: Number(rating) };

  // Featured filter
  if (featured === "true") query.isFeatured = true;

  // Sorting options
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    "price-asc": { price: 1 },
    "price-desc": { price: -1 },
    rating: { rating: -1 },
    popular: { numReviews: -1 },
  };
  const sortBy = sortMap[sort] || { createdAt: -1 };

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate("seller", "name sellerInfo.storeName")
      .sort(sortBy)
      .skip(skip)
      .limit(limitNum)
      .select("-reviews"), // Exclude reviews from list for performance
    Product.countDocuments(query),
  ]);

  res.status(200).json({
    success: true,
    count: products.length,
    total,
    totalPages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    data: products,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single product by ID or slug
// @route   GET /api/products/:id
// @access  Public (Optional auth allows seller/admin to view inactive products)
// ─────────────────────────────────────────────────────────────────────────────
const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Support both ObjectId and slug lookups
  const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };

  const product = await Product.findOne(query)
    .populate(
      "seller",
      "name sellerInfo.storeName sellerInfo.storeDescription avatar",
    )
    .populate("reviews.user", "name avatar");

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // If product is inactive, only the owner seller or an admin can access it
  if (!product.isActive) {
    const isOwner = req.user && product.seller?._id.toString() === req.user.id;
    const isAdmin = req.user && req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      res.status(404);
      throw new Error("Product not found");
    }
  }

  res.status(200).json({ success: true, data: product });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create product (Seller/Admin only)
// @route   POST /api/products
// @access  Private (seller, admin)
// ─────────────────────────────────────────────────────────────────────────────
const createProduct = asyncHandler(async (req, res) => {
  const productData = parseProductFormData(req.body, req.files);
  // Seller always comes from the authenticated user — never trust the body
  productData.seller = req.user.id;

  const product = await Product.create(productData);

  res.status(201).json({ success: true, data: product });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (product owner seller or admin)
// ─────────────────────────────────────────────────────────────────────────────
const updateProduct = asyncHandler(async (req, res) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Only the seller who owns it or an admin can update
  if (product.seller.toString() !== req.user.id && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to update this product");
  }

  const parsedUpdates = parseProductFormData(req.body, req.files, product.images || []);

  // Whitelist update fields — prevent overriding seller and reviews directly
  const allowed = [
    "name",
    "description",
    "price",
    "discountPrice",
    "category",
    "brand",
    "stock",
    "sizes",
    "colors",
    "tags",
    "specifications",
    "isFeatured",
    "isActive",
    "images",
  ];

  const updates = {};
  allowed.forEach((key) => {
    if (parsedUpdates[key] !== undefined) updates[key] = parsedUpdates[key];
  });

  product = await Product.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: product });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (product owner seller or admin)
// ─────────────────────────────────────────────────────────────────────────────
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (product.seller.toString() !== req.user.id && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to delete this product");
  }

  // Delete images from Cloudinary
  for (const image of product.images) {
    if (image.public_id) {
      await cloudinary.uploader.destroy(image.public_id).catch(() => {});
    }
  }

  await product.deleteOne();

  res
    .status(200)
    .json({ success: true, message: "Product deleted successfully" });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a single product image
// @route   DELETE /api/products/:id/images/:imageId
// @access  Private (product owner seller or admin)
// ─────────────────────────────────────────────────────────────────────────────
const deleteProductImage = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (product.seller.toString() !== req.user.id && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized");
  }

  const image = product.images.find(
    (img) => img.public_id === req.params.imageId,
  );
  if (!image) {
    res.status(404);
    throw new Error("Image not found");
  }

  await cloudinary.uploader.destroy(req.params.imageId).catch(() => {});
  product.images = product.images.filter(
    (img) => img.public_id !== req.params.imageId,
  );
  await product.save();

  res.status(200).json({ success: true, data: product.images });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Check if user is eligible to review product (delivered order required)
// @route   GET /api/products/:id/can-review
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const canReviewProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
  const product = await Product.findOne(query);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Sellers cannot review their own product
  if (product.seller.toString() === req.user.id) {
    return res.status(200).json({
      success: true,
      canReview: false,
      isSeller: true,
      reason: "Sellers cannot review their own equipment",
    });
  }

  const existingReview = product.reviews.find(
    (r) => r.user.toString() === req.user.id,
  );

  // Admin can always review
  if (req.user.role === "admin") {
    return res.status(200).json({
      success: true,
      canReview: true,
      hasDeliveredOrder: true,
      existingReview: existingReview || null,
    });
  }

  // Regular user must have a delivered order containing this product
  const deliveredOrder = await Order.findOne({
    user: req.user.id,
    orderStatus: "delivered",
    "orderItems.product": product._id,
  });

  res.status(200).json({
    success: true,
    canReview: !!deliveredOrder,
    hasDeliveredOrder: !!deliveredOrder,
    existingReview: existingReview || null,
    reason: !deliveredOrder
      ? "Reviews are unlocked after this equipment has been delivered to your address."
      : null,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Add/Update review for a product (verified delivery required)
// @route   POST /api/products/:id/reviews
// @access  Private (user, admin)
// ─────────────────────────────────────────────────────────────────────────────
const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error("Please provide a rating between 1 and 5 stars");
  }

  const { id } = req.params;
  const query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };
  const product = await Product.findOne(query);

  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  // Security: Prevent sellers from reviewing their own products
  if (product.seller.toString() === req.user.id) {
    res.status(400);
    throw new Error("Sellers are not permitted to review their own products");
  }

  // Verification check: User must have a delivered order containing this product
  if (req.user.role !== "admin") {
    const deliveredOrder = await Order.findOne({
      user: req.user.id,
      orderStatus: "delivered",
      "orderItems.product": product._id,
    });

    if (!deliveredOrder) {
      res.status(403);
      throw new Error(
        "Verified Delivery Required: You can only review this equipment after your order has been delivered.",
      );
    }
  }

  // Check if user already reviewed this product
  const existingReview = product.reviews.find(
    (r) => r.user.toString() === req.user.id,
  );

  if (existingReview) {
    // Update existing review
    existingReview.rating = Number(rating);
    existingReview.comment = comment;
  } else {
    // Add new review
    product.reviews.push({
      user: req.user.id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    });
  }

  product.numReviews = product.reviews.length;
  product.rating =
    product.reviews.length > 0
      ? product.reviews.reduce((acc, r) => acc + r.rating, 0) /
        product.reviews.length
      : 0;

  await product.save();

  res.status(201).json({
    success: true,
    message: existingReview ? "Review updated successfully" : "Review submitted successfully",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a review
// @route   DELETE /api/products/:id/reviews/:reviewId
// @access  Private (review owner or admin)
// ─────────────────────────────────────────────────────────────────────────────
const deleteReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const review = product.reviews.id(req.params.reviewId);
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }

  if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to delete this review");
  }

  product.reviews.pull(req.params.reviewId);
  product.numReviews = product.reviews.length;
  product.rating =
    product.reviews.length > 0
      ? product.reviews.reduce((acc, r) => acc + r.rating, 0) /
        product.reviews.length
      : 0;

  await product.save();

  res.status(200).json({ success: true, message: "Review deleted" });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all distinct brands and categories (for filter dropdowns)
// @route   GET /api/products/meta
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getProductMeta = asyncHandler(async (req, res) => {
  const [brands, categories] = await Promise.all([
    Product.distinct("brand", { isActive: true }),
    Product.distinct("category", { isActive: true }),
  ]);

  res.status(200).json({ success: true, data: { brands, categories } });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get seller's own products
// @route   GET /api/products/my-products
// @access  Private (seller)
// ─────────────────────────────────────────────────────────────────────────────
const getMyProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ seller: req.user.id }).sort({
    createdAt: -1,
  });
  res
    .status(200)
    .json({ success: true, count: products.length, data: products });
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  addReview,
  canReviewProduct,
  deleteReview,
  getProductMeta,
  getMyProducts,
};

