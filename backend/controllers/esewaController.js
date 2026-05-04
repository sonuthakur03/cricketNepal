// controllers/esewaController.js
const asyncHandler = require("express-async-handler");
const axios = require("axios");
const crypto = require("crypto");
const Order = require("../models/Order");
const Product = require("../models/Product");

const generateEsewaSignature = (message, secretKey) =>
  crypto.createHmac("sha256", secretKey).update(message).digest("base64");

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Initiate eSewa payment — returns signed form fields
// @route POST /api/esewa/initiate/:orderId
// ─────────────────────────────────────────────────────────────────────────────
const initiateEsewaPayment = asyncHandler(async (req, res) => {
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
    throw new Error("Order already paid");
  }

  const merchantCode = process.env.ESEWA_MERCHANT_ID || "EPAYTEST";
  const secretKey = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

  // ── IMPORTANT: transaction_uuid must be unique per attempt ─────────────────
  // Using only order._id causes "Duplicate transaction UUID" on retry.
  // Append a short timestamp suffix so each attempt gets a fresh UUID.
  // We store it on the order so we can look it up on callback.
  const transactionUUID = `${order._id}-${Date.now()}`;

  // Save the UUID on the order so callback can find the order from it
  order.paymentResult = {
    ...(order.paymentResult || {}),
    esewa_transaction_uuid: transactionUUID,
  };
  await order.save();

  const amount = Math.round(order.itemsPrice);
  const taxAmount = Math.round(order.taxPrice);
  const deliveryCharge = Math.round(order.shippingPrice);
  const totalAmount = Math.round(order.totalPrice);
  const productCode = merchantCode;

  const signatureMessage = `total_amount=${totalAmount},transaction_uuid=${transactionUUID},product_code=${productCode}`;
  const signature = generateEsewaSignature(signatureMessage, secretKey);

  // success_url — eSewa will append ?data=BASE64 to this URL
  // We include orderId so the callback page can find the order
  // Clean URLs — no query params so eSewa can append ?data=BASE64 cleanly
  const successUrl = `${frontendUrl}/payment/esewa/success`;
  const failureUrl = `${frontendUrl}/payment/esewa/failure`;

  // eSewa payment URL
  // ESEWA_BASE_URL can be either:
  //   https://rc-epay.esewa.com.np                        (just the domain)
  //   https://rc-epay.esewa.com.np/api/epay/main/v2/form  (full URL)
  const esewaBase =
    process.env.ESEWA_BASE_URL || "https://rc-epay.esewa.com.np";
  const paymentUrl = esewaBase.includes("/api/epay")
    ? esewaBase // already the full URL
    : `${esewaBase}/api/epay/main/v2/form`;

  res.status(200).json({
    success: true,
    data: {
      amount,
      tax_amount: taxAmount,
      product_service_charge: 0,
      product_delivery_charge: deliveryCharge,
      total_amount: totalAmount,
      transaction_uuid: transactionUUID,
      product_code: productCode,
      success_url: successUrl,
      failure_url: failureUrl,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
      payment_url: paymentUrl,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Verify eSewa payment after redirect
// @route POST /api/esewa/verify/:orderId
// ─────────────────────────────────────────────────────────────────────────────
const verifyEsewaPayment = asyncHandler(async (req, res) => {
  const { encodedData } = req.body;
  if (!encodedData) {
    res.status(400);
    throw new Error("Missing eSewa encoded data");
  }

  // Decode base64 payload
  let payload;
  try {
    payload = JSON.parse(Buffer.from(encodedData, "base64").toString("utf8"));
  } catch {
    res.status(400);
    throw new Error("Invalid eSewa payload — could not decode base64");
  }

  const {
    transaction_uuid,
    total_amount,
    status,
    transaction_code,
    signed_field_names,
    signature: received,
  } = payload;

  // Find order by ID (passed as URL param from callback page)
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
    throw new Error("Order already paid");
  }

  // Verify HMAC signature
  const secretKey = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
  const fields = (
    signed_field_names || "total_amount,transaction_uuid,product_code"
  ).split(",");
  const sigMsg = fields.map((f) => `${f}=${payload[f]}`).join(",");
  const expected = generateEsewaSignature(sigMsg, secretKey);

  if (expected !== received) {
    res.status(400);
    throw new Error("eSewa signature verification failed");
  }

  // Cross-check with eSewa status API
  const statusUrl =
    process.env.NODE_ENV === "production"
      ? "https://epay.esewa.com.np/api/epay/transaction/status/"
      : "https://rc-epay.esewa.com.np/api/epay/transaction/status/";

  let esewaStatus;
  try {
    const { data } = await axios.get(statusUrl, {
      params: {
        product_code: process.env.ESEWA_MERCHANT_ID || "EPAYTEST",
        transaction_uuid,
        total_amount,
      },
    });
    esewaStatus = data;
  } catch (err) {
    res.status(502);
    throw new Error(`eSewa status API error: ${err.message}`);
  }

  if (esewaStatus.status !== "COMPLETE") {
    res.status(400);
    throw new Error(
      `eSewa payment not complete. Status: ${esewaStatus.status}`,
    );
  }

  // Mark order paid
  order.isPaid = true;
  order.paidAt = Date.now();
  order.orderStatus = "confirmed";
  order.paymentResult = {
    transaction_id: transaction_uuid,
    status: "COMPLETE",
    paid_amount: Number(total_amount),
    payment_method: "esewa",
    verified_at: new Date(),
    esewa_ref_id: esewaStatus.ref_id || transaction_code || "",
  };
  await order.save();

  await Promise.all(
    order.orderItems.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      }),
    ),
  );

  res
    .status(200)
    .json({ success: true, message: "eSewa payment verified", data: order });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  eSewa payment failure/cancel
// @route POST /api/esewa/failure/:orderId
// ─────────────────────────────────────────────────────────────────────────────
const esewaFailure = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).catch(() => null);
  if (order && order.orderStatus === "pending") {
    order.notes = "eSewa payment cancelled by user";
    await order.save();
  }
  res.status(200).json({ success: false, message: "eSewa payment cancelled" });
});

module.exports = { initiateEsewaPayment, verifyEsewaPayment, esewaFailure };
