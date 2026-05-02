// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  register, login, logout, getMe, updateProfile,
  changePassword, forgotPassword, resetPassword, verifyEmail,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadAvatar } = require('../config/cloudinary');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Avatar upload
router.put('/me/avatar', protect, uploadAvatar.single('avatar'), async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('Please upload an image'); }
  const User = require('../models/User');
  const { cloudinary } = require('../config/cloudinary');

  const user = await User.findById(req.user.id);

  // Remove old avatar from Cloudinary
  if (user.avatar?.public_id) {
    await cloudinary.uploader.destroy(user.avatar.public_id);
  }

  user.avatar = { public_id: req.file.filename, url: req.file.path };
  await user.save();

  res.status(200).json({ success: true, data: user.avatar });
});

module.exports = router;
