// routes/stripeRoutes.js
const express = require("express");
const router = express.Router();
const {
  createPaymentIntent,
  confirmStripePayment,
  stripeWebhook,
} = require("../controllers/stripeController");
const { protect } = require("../middleware/auth");

// Webhook must use raw body — mount BEFORE express.json() in server.js
// We handle that by checking content-type in server.js
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook,
);

// Protected routes
router.post("/create-intent/:orderId", protect, createPaymentIntent);
router.post("/confirm/:orderId", protect, confirmStripePayment);

module.exports = router;
