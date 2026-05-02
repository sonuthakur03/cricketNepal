// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const {
  createOrder, getMyOrders, getOrder, verifyKhaltiPayment,
  verifyEsewaPayment, cancelOrder, getSellerOrders,
  getAllOrders, updateOrderStatus,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/seller-orders', protect, authorize('seller', 'admin'), getSellerOrders);
router.get('/admin', protect, authorize('admin'), getAllOrders);
router.get('/:id', protect, getOrder);
router.post('/:id/pay/khalti', protect, verifyKhaltiPayment);
router.post('/:id/pay/esewa', protect, verifyEsewaPayment);
router.put('/:id/cancel', protect, cancelOrder);
router.put('/:id/status', protect, authorize('admin'), updateOrderStatus);

module.exports = router;


// ─────────────────────────────────────────────────────────────────────────────


// routes/adminRoutes.js
const adminExpress = require('express');
const adminRouter = adminExpress.Router();
const {
  getDashboardStats, getAllUsers, getUser, updateUser,
  deleteUser, approveSeller, getAllProducts, toggleFeatured,
} = require('../controllers/adminController');
const { protect: adminProtect, authorize: adminAuthorize } = require('../middleware/auth');

adminRouter.use(adminProtect, adminAuthorize('admin')); // All admin routes require admin role

adminRouter.get('/stats', getDashboardStats);
adminRouter.get('/users', getAllUsers);
adminRouter.get('/users/:id', getUser);
adminRouter.put('/users/:id', updateUser);
adminRouter.delete('/users/:id', deleteUser);
adminRouter.put('/sellers/:id/approve', approveSeller);
adminRouter.get('/products', getAllProducts);
adminRouter.put('/products/:id/featured', toggleFeatured);

module.exports = adminRouter;


// ─────────────────────────────────────────────────────────────────────────────


// routes/wishlistRoutes.js
const wlExpress = require('express');
const wlRouter = wlExpress.Router();
const { getWishlist, toggleWishlist, clearWishlist } = require('../controllers/wishlistController');
const { protect: wlProtect } = require('../middleware/auth');

wlRouter.use(wlProtect); // All wishlist routes require auth

wlRouter.get('/', getWishlist);
wlRouter.post('/:productId', toggleWishlist);
wlRouter.delete('/', clearWishlist);

module.exports = wlRouter;
