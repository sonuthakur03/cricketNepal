// controllers/esewaController.js
// Full eSewa v2 integration for Nepal
// Docs: https://developer.esewa.com.np/

const asyncHandler = require('express-async-handler');
const axios = require('axios');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Generate eSewa HMAC-SHA256 signature
// Required for eSewa v2 API — signature prevents request tampering
// ─────────────────────────────────────────────────────────────────────────────
const generateEsewaSignature = (message, secretKey) => {
  return crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('base64');
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Initiate eSewa payment — returns signed form fields to frontend
// @route   POST /api/esewa/initiate/:orderId
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const initiateEsewaPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized');
  }

  if (order.isPaid) {
    res.status(400);
    throw new Error('Order is already paid');
  }

  const merchantCode = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
  const secretKey    = process.env.ESEWA_SECRET_KEY   || '8gBm/:&EnhH.1/q'; // eSewa test secret
  const successUrl   = `${process.env.FRONTEND_URL}/payment/esewa/success?orderId=${order._id}`;
  const failureUrl   = `${process.env.FRONTEND_URL}/payment/esewa/failure?orderId=${order._id}`;

  // eSewa v2 amounts (must be exact, no decimals)
  const amount              = Math.round(order.itemsPrice);
  const taxAmount           = Math.round(order.taxPrice);
  const serviceCharge       = 0;
  const deliveryCharge      = Math.round(order.shippingPrice);
  const totalAmount         = Math.round(order.totalPrice);
  const transactionUUID     = order._id.toString();
  const productCode         = merchantCode;

  // eSewa v2 requires HMAC of this exact string
  const signatureMessage = `total_amount=${totalAmount},transaction_uuid=${transactionUUID},product_code=${productCode}`;
  const signature = generateEsewaSignature(signatureMessage, secretKey);

  res.status(200).json({
    success: true,
    data: {
      // All fields needed for the frontend form POST to eSewa
      amount,
      tax_amount:           taxAmount,
      product_service_charge: serviceCharge,
      product_delivery_charge: deliveryCharge,
      total_amount:         totalAmount,
      transaction_uuid:     transactionUUID,
      product_code:         productCode,
      success_url:          successUrl,
      failure_url:          failureUrl,
      signed_field_names:   'total_amount,transaction_uuid,product_code',
      signature,
      // The eSewa payment URL (test vs production)
      payment_url: process.env.NODE_ENV === 'production'
        ? 'https://epay.esewa.com.np/api/epay/main/v2/form'
        : 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify eSewa payment after redirect callback
// @route   POST /api/esewa/verify/:orderId
// @access  Private
//
// eSewa redirects to success_url with a base64-encoded JSON in ?data=
// We decode it, re-verify the signature, then call eSewa's status API
// ─────────────────────────────────────────────────────────────────────────────
const verifyEsewaPayment = asyncHandler(async (req, res) => {
  const { encodedData } = req.body; // base64 string from eSewa callback ?data=...

  if (!encodedData) {
    res.status(400);
    throw new Error('Missing eSewa payment data');
  }

  // Decode the base64 payload from eSewa
  let esewaPayload;
  try {
    const decoded = Buffer.from(encodedData, 'base64').toString('utf8');
    esewaPayload = JSON.parse(decoded);
  } catch {
    res.status(400);
    throw new Error('Invalid eSewa payment payload');
  }

  const {
    transaction_uuid,
    total_amount,
    status,
    transaction_code,
    signed_field_names,
    signature: receivedSignature,
  } = esewaPayload;

  const order = await Order.findById(req.params.orderId);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.user.toString() !== req.user.id) { res.status(403); throw new Error('Not authorized'); }
  if (order.isPaid) { res.status(400); throw new Error('Order already paid'); }

  // ── Step 1: Verify signature locally ──────────────────────────────────────
  const secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
  const signedFields = signed_field_names.split(',');
  const signatureMessage = signedFields.map((f) => `${f}=${esewaPayload[f]}`).join(',');
  const expectedSignature = generateEsewaSignature(signatureMessage, secretKey);

  if (expectedSignature !== receivedSignature) {
    res.status(400);
    throw new Error('eSewa signature mismatch — possible tampering detected');
  }

  // ── Step 2: Double-check with eSewa status API ─────────────────────────────
  const statusUrl = process.env.NODE_ENV === 'production'
    ? 'https://epay.esewa.com.np/api/epay/transaction/status/'
    : 'https://rc-epay.esewa.com.np/api/epay/transaction/status/';

  let esewaStatus;
  try {
    const { data } = await axios.get(statusUrl, {
      params: {
        product_code: process.env.ESEWA_MERCHANT_ID || 'EPAYTEST',
        transaction_uuid,
        total_amount,
      },
    });
    esewaStatus = data;
  } catch (err) {
    res.status(502);
    throw new Error(`eSewa status check failed: ${err.message}`);
  }

  if (esewaStatus.status !== 'COMPLETE') {
    res.status(400);
    throw new Error(`eSewa payment not complete. Status: ${esewaStatus.status}`);
  }

  // ── Step 3: Mark order as paid ─────────────────────────────────────────────
  order.isPaid      = true;
  order.paidAt      = Date.now();
  order.orderStatus = 'confirmed';
  order.paymentResult = {
    transaction_id:  transaction_uuid,
    status:          'COMPLETE',
    paid_amount:     Number(total_amount),
    payment_method:  'esewa',
    verified_at:     new Date(),
    esewa_ref_id:    esewaStatus.ref_id || transaction_code,
  };
  await order.save();

  // Deduct stock
  await Promise.all(
    order.orderItems.map((item) =>
      Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
    )
  );

  res.status(200).json({ success: true, message: 'Payment verified', data: order });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Handle eSewa payment failure / cancellation
// @route   POST /api/esewa/failure/:orderId
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const esewaFailure = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId);

  // Keep the order in pending state so the user can retry payment
  if (order && order.orderStatus === 'pending') {
    order.notes = 'eSewa payment failed or cancelled by user';
    await order.save();
  }

  res.status(200).json({
    success: false,
    message: 'eSewa payment failed or was cancelled. Your order is saved — you can retry payment from My Orders.',
  });
});

module.exports = { initiateEsewaPayment, verifyEsewaPayment, esewaFailure };
