// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, createProduct, updateProduct,
  deleteProduct, deleteProductImage, addReview, deleteReview,
  getProductMeta, getMyProducts,
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');
const { uploadProductImage } = require('../config/cloudinary');

// Public routes
router.get('/meta', getProductMeta);
router.get('/', getProducts);
router.get('/:id', getProduct);

// Protected routes
router.get('/seller/my-products', protect, authorize('seller', 'admin'), getMyProducts);

router.post(
  '/',
  protect,
  authorize('seller', 'admin'),
  uploadProductImage.array('images', 5), // max 5 images
  createProduct
);

router.put(
  '/:id',
  protect,
  authorize('seller', 'admin'),
  uploadProductImage.array('images', 5),
  updateProduct
);

router.delete('/:id', protect, authorize('seller', 'admin'), deleteProduct);
router.delete('/:id/images/:imageId', protect, authorize('seller', 'admin'), deleteProductImage);

// Review routes
router.post('/:id/reviews', protect, authorize('user', 'admin'), addReview);
router.delete('/:id/reviews/:reviewId', protect, deleteReview);

module.exports = router;
