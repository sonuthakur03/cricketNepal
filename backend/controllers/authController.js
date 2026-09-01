// controllers/authController.js
// Handles user registration, login, logout, and password reset

const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { sendTokenResponse } = require('../utils/tokenHelper');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Prevent external role escalation — only 'user' or 'seller' allowed on self-register
  const allowedRoles = ['user', 'seller'];
  const assignedRole = allowedRoles.includes(role) ? role : 'user';

  // Check if email is already taken
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(400);
    throw new Error('Email is already registered');
  }

  const user = await User.create({ name, email, password, role: assignedRole });

  // Generate email verification token
  const verifyToken = user.getEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Send verification email
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email/${verifyToken}`;
  try {
    await sendEmail({
      to: user.email,
      subject: 'Welcome to CricketNepal — Verify Your Email',
      html: `
        <h2>Welcome to CricketNepal, ${user.name}! 🏏</h2>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verifyUrl}" style="background:#16a34a;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">
          Verify Email
        </a>
        <p>This link expires in 24 hours.</p>
      `,
    });
  } catch (err) {
    // Don't block registration if email fails
    console.error('Verification email failed:', err.message);
  }

  sendTokenResponse(user, 201, res, 'Registration successful! Please verify your email.');
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // Explicitly select password (it's excluded by default)
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account has been suspended. Contact support.');
  }

  sendTokenResponse(user, 200, res, 'Login successful');
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Logout user (clear cookie)
// @route   POST /api/auth/logout
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get currently authenticated user
// @route   GET /api/auth/me
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate('wishlist', 'name images price discountPrice');

  res.status(200).json({ success: true, data: user });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone', 'address'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  // Handle seller info update
  if (req.user.role === 'seller' && req.body.sellerInfo) {
    updates.sellerInfo = { ...req.user.sellerInfo, ...req.body.sellerInfo };
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: user });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password changed successfully');
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Forgot password — send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    res.status(404);
    throw new Error('No account with that email found');
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'CricketNepal — Password Reset Request',
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click below to set a new password:</p>
        <a href="${resetUrl}" style="background:#16a34a;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">
          Reset Password
        </a>
        <p>This link expires in <strong>15 minutes</strong>.</p>
        <p>If you didn't request this, ignore this email.</p>
      `,
    });

    res.status(200).json({ success: true, message: 'Password reset email sent' });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500);
    throw new Error('Email could not be sent');
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Reset password using token
// @route   PUT /api/auth/reset-password/:token
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  // Hash the URL token to compare with stored hash
  const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired reset token');
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res, 'Password reset successful');
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const verifyEmail = asyncHandler(async (req, res) => {
  const emailVerificationToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    emailVerificationToken,
    emailVerificationExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired verification link');
  }

  user.isVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpire = undefined;
  await user.save();

  res.status(200).json({ success: true, message: 'Email verified successfully! You can now login.' });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Upload avatar image
// @route   PUT /api/auth/me/avatar
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const uploadAvatarImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image');
  }
  const { cloudinary } = require('../config/cloudinary');

  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Remove old avatar from Cloudinary if not default
  if (user.avatar?.public_id && !user.avatar.public_id.includes('default')) {
    await cloudinary.uploader.destroy(user.avatar.public_id).catch(() => {});
  }

  user.avatar = { public_id: req.file.filename, url: req.file.path };
  await user.save();

  res.status(200).json({ success: true, data: user.avatar });
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  uploadAvatarImage,
};
