// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const {
  register, login, logout, getMe, updateProfile,
  changePassword, forgotPassword, resetPassword, verifyEmail,
  uploadAvatarImage,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { uploadAvatar } = require('../config/cloudinary');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout); // Allow clearing cookies even if token has expired
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Avatar upload
router.put('/me/avatar', protect, uploadAvatar.single('avatar'), uploadAvatarImage);

module.exports = router;
