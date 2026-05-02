// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const {
  getDashboardStats, getAllUsers, getUser, updateUser,
  deleteUser, approveSeller, getAllProducts, toggleFeatured,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Apply admin auth to all routes in this file
router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/users/:id', getUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/sellers/:id/approve', approveSeller);
router.get('/products', getAllProducts);
router.put('/products/:id/featured', toggleFeatured);

module.exports = router;
