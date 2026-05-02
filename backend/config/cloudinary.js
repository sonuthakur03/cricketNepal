// config/cloudinary.js
// Cloudinary configuration for image uploads (free tier)

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with env credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage engine for product images
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'cricketnepal/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

// Storage engine for user avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'cricketnepal/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 200, height: 200, crop: 'fill', quality: 'auto' }],
  },
});

// Multer upload instances
const uploadProductImage = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
});

module.exports = { cloudinary, uploadProductImage, uploadAvatar };
