// controllers/productController.js
// Full product CRUD, search, filters, reviews, wishlist

const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

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
  if (brand) query.brand = { $in: brand.split(',') };

  // Price range filter
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  // Rating filter
  if (rating) query.rating = { $gte: Number(rating) };

  // Featured filter
  if (featured === 'true') query.isFeatured = true;

  // Sorting options
  const sortMap = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    rating: { rating: -1 },
    popular: { numReviews: -1 },
  };
  const sortBy = sortMap[sort] || { createdAt: -1 };

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(query)
      .populate('seller', 'name sellerInfo.storeName')
      .sort(sortBy)
      .skip(skip)
      .limit(limitNum)
      .select('-reviews'), // Exclude reviews from list for performance
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
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Support both ObjectId and slug lookups
  const query = id.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: id }
    : { slug: id };

  const product = await Product.findOne({ ...query, isActive: true })
    .populate('seller', 'name sellerInfo.storeName sellerInfo.storeDescription avatar')
    .populate('reviews.user', 'name avatar');

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  res.status(200).json({ success: true, data: product });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create product (Seller/Admin only)
// @route   POST /api/products
// @access  Private (seller, admin)
// ─────────────────────────────────────────────────────────────────────────────
const createProduct = asyncHandler(async (req, res) => {
  // Attach the logged-in seller as the product owner
  req.body.seller = req.user.id;

  // Handle uploaded images from multer/cloudinary
  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map((file) => ({
      public_id: file.filename,
      url: file.path,
    }));
  }

  // Parse specifications if sent as JSON string
  if (req.body.specifications && typeof req.body.specifications === 'string') {
    req.body.specifications = JSON.parse(req.body.specifications);
  }

  // Parse arrays sent as comma-separated strings
  if (req.body.sizes && typeof req.body.sizes === 'string') {
    req.body.sizes = req.body.sizes.split(',').map((s) => s.trim());
  }
  if (req.body.colors && typeof req.body.colors === 'string') {
    req.body.colors = req.body.colors.split(',').map((s) => s.trim());
  }
  if (req.body.tags && typeof req.body.tags === 'string') {
    req.body.tags = req.body.tags.split(',').map((s) => s.trim());
  }

  const product = await Product.create(req.body);

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
    throw new Error('Product not found');
  }

  // Only the seller who owns it or an admin can update
  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this product');
  }

  // Handle new image uploads
  if (req.files && req.files.length > 0) {
    const newImages = req.files.map((file) => ({
      public_id: file.filename,
      url: file.path,
    }));
    req.body.images = [...(product.images || []), ...newImages];
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
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
    throw new Error('Product not found');
  }

  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this product');
  }

  // Delete images from Cloudinary
  for (const image of product.images) {
    if (image.public_id) {
      await cloudinary.uploader.destroy(image.public_id);
    }
  }

  await product.deleteOne();

  res.status(200).json({ success: true, message: 'Product deleted successfully' });
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
    throw new Error('Product not found');
  }

  if (product.seller.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }

  const image = product.images.find((img) => img.public_id === req.params.imageId);
  if (!image) {
    res.status(404);
    throw new Error('Image not found');
  }

  await cloudinary.uploader.destroy(req.params.imageId);
  product.images = product.images.filter((img) => img.public_id !== req.params.imageId);
  await product.save();

  res.status(200).json({ success: true, data: product.images });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Add/Update review for a product
// @route   POST /api/products/:id/reviews
// @access  Private (user)
// ─────────────────────────────────────────────────────────────────────────────
const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if user already reviewed this product
  const existingReview = product.reviews.find(
    (r) => r.user.toString() === req.user.id
  );

  if (existingReview) {
    // Update existing review
    existingReview.rating = rating;
    existingReview.comment = comment;
  } else {
    // Add new review
    product.reviews.push({
      user: req.user.id,
      name: req.user.name,
      rating: Number(rating),
      comment,
    });
    product.numReviews = product.reviews.length;
  }

  // Recalculate average rating
  product.rating =
    product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;

  await product.save();

  res.status(201).json({ success: true, message: 'Review submitted successfully' });
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
    throw new Error('Product not found');
  }

  const review = product.reviews.id(req.params.reviewId);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this review');
  }

  review.deleteOne();
  product.numReviews = product.reviews.length;
  product.rating =
    product.reviews.length > 0
      ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length
      : 0;

  await product.save();

  res.status(200).json({ success: true, message: 'Review deleted' });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all distinct brands and categories (for filter dropdowns)
// @route   GET /api/products/meta
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getProductMeta = asyncHandler(async (req, res) => {
  const [brands, categories] = await Promise.all([
    Product.distinct('brand', { isActive: true }),
    Product.distinct('category', { isActive: true }),
  ]);

  res.status(200).json({ success: true, data: { brands, categories } });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get seller's own products
// @route   GET /api/products/my-products
// @access  Private (seller)
// ─────────────────────────────────────────────────────────────────────────────
const getMyProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ seller: req.user.id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: products.length, data: products });
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  addReview,
  deleteReview,
  getProductMeta,
  getMyProducts,
};
