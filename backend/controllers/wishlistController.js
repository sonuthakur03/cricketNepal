// controllers/wishlistController.js
// Manage user wishlist (add, remove, get)

const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate({
    path: 'wishlist',
    select: 'name images price discountPrice rating category brand stock isActive',
    match: { isActive: true },
  });

  res.status(200).json({ success: true, count: user.wishlist.length, data: user.wishlist });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Toggle product in wishlist (add if absent, remove if present)
// @route   POST /api/wishlist/:productId
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const toggleWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);
  if (!product) { res.status(404); throw new Error('Product not found'); }

  const user = await User.findById(req.user.id);
  const isInWishlist = user.wishlist.includes(req.params.productId);

  if (isInWishlist) {
    user.wishlist = user.wishlist.filter((id) => id.toString() !== req.params.productId);
  } else {
    user.wishlist.push(req.params.productId);
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: isInWishlist ? 'Removed from wishlist' : 'Added to wishlist',
    inWishlist: !isInWishlist,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Clear entire wishlist
// @route   DELETE /api/wishlist
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const clearWishlist = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { wishlist: [] });
  res.status(200).json({ success: true, message: 'Wishlist cleared' });
});

module.exports = { getWishlist, toggleWishlist, clearWishlist };
