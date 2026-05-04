// routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrder,
  initiateKhaltiPayment,
  verifyKhaltiPayment,
  verifyEsewaPayment,
  cancelOrder,
  sellerConfirmOrder,
  markCodPaid,
  getSellerOrders,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/orderController");
const { protect, authorize } = require("../middleware/auth");

// Named routes BEFORE /:id
router.post("/", protect, createOrder);
router.get("/my-orders", protect, getMyOrders);
router.get(
  "/seller-orders",
  protect,
  authorize("seller", "admin"),
  getSellerOrders,
);
router.get("/admin", protect, authorize("admin"), getAllOrders);

// Single order
router.get("/:id", protect, getOrder);

// Payment — Khalti v2 (two-step: initiate → redirect → verify)
router.post("/:id/pay/khalti/initiate", protect, initiateKhaltiPayment);
router.post("/:id/pay/khalti/verify", protect, verifyKhaltiPayment);

// Payment — eSewa (verify after redirect callback)
router.post("/:id/pay/esewa", protect, verifyEsewaPayment);

// Order actions
router.put("/:id/cancel", protect, cancelOrder);
router.put(
  "/:id/confirm",
  protect,
  authorize("seller", "admin"),
  sellerConfirmOrder,
);
router.put(
  "/:id/mark-paid",
  protect,
  authorize("seller", "admin"),
  markCodPaid,
);
router.put("/:id/status", protect, authorize("admin"), updateOrderStatus);

module.exports = router;
