// controllers/adminController.js
// Admin panel: manage users, sellers, products, and view platform stats

const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { cloudinary } = require('../config/cloudinary');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get platform dashboard stats
// @route   GET /api/admin/stats
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────────────────────
const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalSellers,
    totalProducts,
    totalOrders,
    revenueData,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    User.countDocuments({ role: 'seller' }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Order.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email'),
    Product.find().sort({ numReviews: -1 }).limit(5).select('name images price rating numReviews'),
  ]);

  // Monthly revenue for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyRevenue = await Order.aggregate([
    { $match: { isPaid: true, createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      totalRevenue: revenueData[0]?.total || 0,
      monthlyRevenue,
      recentOrders,
      topProducts,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────────────────────
const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filterQuery = {};
  if (req.query.role) filterQuery.role = req.query.role;
  if (req.query.search) {
    filterQuery.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filterQuery).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password'),
    User.countDocuments(filterQuery),
  ]);

  res.status(200).json({ success: true, total, totalPages: Math.ceil(total / limit), currentPage: page, data: users });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────────────────────
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.status(200).json({ success: true, data: user });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update user role or status (admin action)
// @route   PUT /api/admin/users/:id
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────────────────────
const updateUser = asyncHandler(async (req, res) => {
  const allowedUpdates = ['role', 'isActive', 'sellerInfo'];
  const updates = {};
  allowedUpdates.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!user) { res.status(404); throw new Error('User not found'); }

  res.status(200).json({ success: true, data: user });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete user and all their products
// @route   DELETE /api/admin/users/:id
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────────────────────
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.role === 'admin') { res.status(400); throw new Error('Cannot delete an admin account'); }

  // Delete all products (and their Cloudinary images) if seller
  if (user.role === 'seller') {
    const products = await Product.find({ seller: user._id });
    for (const product of products) {
      for (const image of product.images) {
        if (image.public_id) await cloudinary.uploader.destroy(image.public_id);
      }
      await product.deleteOne();
    }
  }

  // Delete avatar from Cloudinary
  if (user.avatar?.public_id) {
    await cloudinary.uploader.destroy(user.avatar.public_id);
  }

  await user.deleteOne();

  res.status(200).json({ success: true, message: 'User and related data deleted' });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Approve or reject seller account
// @route   PUT /api/admin/sellers/:id/approve
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────────────────────
const approveSeller = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error('User not found'); }
  if (user.role !== 'seller') { res.status(400); throw new Error('User is not a seller'); }

  user.sellerInfo.isApproved = req.body.isApproved;
  await user.save();

  res.status(200).json({
    success: true,
    message: `Seller ${req.body.isApproved ? 'approved' : 'rejected'}`,
    data: user,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Admin: Get all products
// @route   GET /api/admin/products
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────────────────────
const getAllProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filterQuery = {};
  if (req.query.category) filterQuery.category = req.query.category;
  if (req.query.search) {
    filterQuery.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { brand: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [products, total] = await Promise.all([
    Product.find(filterQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('seller', 'name email')
      .select('-reviews'),
    Product.countDocuments(filterQuery),
  ]);

  res.status(200).json({ success: true, total, totalPages: Math.ceil(total / limit), currentPage: page, data: products });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Admin: Toggle product featured status
// @route   PUT /api/admin/products/:id/featured
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────────────────────
const toggleFeatured = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  product.isFeatured = !product.isFeatured;
  await product.save();

  res.status(200).json({
    success: true,
    message: `Product ${product.isFeatured ? 'featured' : 'unfeatured'}`,
    data: product,
  });
});

module.exports = {
  getDashboardStats,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  approveSeller,
  getAllProducts,
  toggleFeatured,
};
