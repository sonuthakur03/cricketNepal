// routes/wishlistRoutes.js
const express = require('express');
const router = express.Router();
const { getWishlist, toggleWishlist, clearWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

router.use(protect); // All wishlist routes require authentication

router.get('/', getWishlist);
router.post('/:productId', toggleWishlist);
router.delete('/', clearWishlist);

module.exports = router;
