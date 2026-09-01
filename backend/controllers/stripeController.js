// controllers/stripeController.js
// Stripe Payment Integration — no merchant account needed for testing
// Test cards: 4242 4242 4242 4242 (success) | 4000 0000 0000 0002 (decline)

const asyncHandler = require("express-async-handler");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Order = require("../models/Order");
const Product = require("../models/Product");
const { deductOrderStock } = require("../utils/inventoryHelper");

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Create Stripe Payment Intent
// @route POST /api/stripe/create-intent/:orderId
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const createPaymentIntent = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).populate(
    "user",
    "name email",
  );

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (order.user._id.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized");
  }
  if (order.isPaid) {
    res.status(400);
    throw new Error("Order already paid");
  }

  // Stripe works in smallest currency unit
  // USD: cents, NPR: paisa (but Stripe doesn't support NPR directly)
  // We'll use USD and convert: approximate 1 USD = 133 NPR
  // For production, use a real FX rate from an API
  const NPR_TO_USD = 0.0075; // approx
  const amountInCents = Math.round(order.totalPrice * NPR_TO_USD * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    metadata: {
      orderId: order._id.toString(),
      orderRef: order._id.toString().slice(-8).toUpperCase(),
      customerName: order.user.name,
      customerEmail: order.user.email,
    },
    description: `Pitch Nepal Order #${order._id.toString().slice(-8).toUpperCase()}`,
    receipt_email: order.user.email,
  });

  res.status(200).json({
    success: true,
    data: {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountInCents,
      currency: "usd",
      amountNPR: order.totalPrice,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Confirm Stripe payment after frontend confirms it
// @route POST /api/stripe/confirm/:orderId
// @access Private
// ─────────────────────────────────────────────────────────────────────────────
const confirmStripePayment = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (order.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error("Not authorized");
  }
  if (order.isPaid) {
    res.status(400);
    throw new Error("Already paid");
  }
  if (!paymentIntentId) {
    res.status(400);
    throw new Error("Missing paymentIntentId");
  }

  // Verify with Stripe directly — never trust the client
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

  if (paymentIntent.status !== "succeeded") {
    res.status(400);
    throw new Error(
      `Stripe payment not succeeded. Status: ${paymentIntent.status}`,
    );
  }

  // Double-check the metadata matches this order
  if (paymentIntent.metadata.orderId !== order._id.toString()) {
    res.status(400);
    throw new Error("Payment intent does not match this order");
  }

  // Atomically deduct inventory with overdraft prevention (ACID)
  await deductOrderStock(order.orderItems);

  order.isPaid = true;
  order.paidAt = Date.now();
  order.orderStatus = "confirmed";
  order.paymentResult = {
    transaction_id: paymentIntent.id,
    status: "succeeded",
    paid_amount: order.totalPrice,
    payment_method: "stripe",
    verified_at: new Date(),
  };
  await order.save();

  res.status(200).json({ success: true, data: order });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Stripe webhook — handles payment events from Stripe servers
// @route POST /api/stripe/webhook
// @access Public (Stripe only, verified by signature)
// ─────────────────────────────────────────────────────────────────────────────
const stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    // Webhook secret not configured — skip signature verification in dev
    return res.status(200).json({ received: true });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    res.status(400);
    throw new Error(`Webhook signature failed: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    const order = await Order.findById(pi.metadata.orderId);
    if (order && !order.isPaid) {
      await deductOrderStock(order.orderItems);
      order.isPaid = true;
      order.paidAt = Date.now();
      order.orderStatus = "confirmed";
      order.paymentResult = {
        transaction_id: pi.id,
        status: "succeeded",
        paid_amount: order.totalPrice,
        payment_method: "stripe",
        verified_at: new Date(),
      };
      await order.save();
    }
  }

  res.status(200).json({ received: true });
});

module.exports = { createPaymentIntent, confirmStripePayment, stripeWebhook };
