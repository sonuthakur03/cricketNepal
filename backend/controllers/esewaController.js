// controllers/esewaController.js
const asyncHandler = require("express-async-handler");
const axios = require("axios");
const crypto = require("crypto");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { deductOrderStock } = require("../utils/inventoryHelper");

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

  const merchantCode = (process.env.ESEWA_MERCHANT_ID || "EPAYTEST").trim();
  const secretKey = (process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q").trim();
  let frontendUrl = (
    process.env.FRONTEND_URL || "http://localhost:5173"
  )
    .split(",")[0]
    .trim()
    .replace(/\/$/, "");

  if (
    !frontendUrl.startsWith("http://") &&
    !frontendUrl.startsWith("https://")
  ) {
    frontendUrl = `https://${frontendUrl}`;
  }

  // ── IMPORTANT: transaction_uuid must be unique per attempt ─────────────────
  const transactionUUID = `${order._id}-${Date.now()}`;

  // Save the UUID on the order so callback can find the order from it
  order.paymentResult = {
    ...(order.paymentResult || {}),
    esewa_transaction_uuid: transactionUUID,
  };
  await order.save();

  // eSewa v2 requires total_amount = amount + tax_amount + product_service_charge + product_delivery_charge exactly
  const amount = Math.round(Number(order.itemsPrice || 0));
  const taxAmount = Math.round(Number(order.taxPrice || 0));
  const deliveryCharge = Math.round(Number(order.shippingPrice || 0));
  const serviceCharge = 0;
  const totalAmount = amount + taxAmount + serviceCharge + deliveryCharge;
  const productCode = merchantCode;

  const signatureMessage = `total_amount=${totalAmount},transaction_uuid=${transactionUUID},product_code=${productCode}`;
  const signature = generateEsewaSignature(signatureMessage, secretKey);

  const successUrl = `${frontendUrl}/payment/esewa/success`;
  const failureUrl = `${frontendUrl}/payment/esewa/failure`;

  const esewaBase = (
    process.env.ESEWA_BASE_URL || "https://rc-epay.esewa.com.np"
  ).trim();
  const paymentUrl = esewaBase.includes("/api/epay")
    ? esewaBase
    : `${esewaBase.replace(/\/$/, "")}/api/epay/main/v2/form`;

  res.status(200).json({
    success: true,
    data: {
      amount: String(amount),
      tax_amount: String(taxAmount),
      product_service_charge: String(serviceCharge),
      product_delivery_charge: String(deliveryCharge),
      total_amount: String(totalAmount),
      transaction_uuid: String(transactionUUID),
      product_code: String(productCode),
      success_url: String(successUrl),
      failure_url: String(failureUrl),
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature: String(signature),
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
  const secretKey = (process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q").trim();
  const fields = (
    signed_field_names || "total_amount,transaction_uuid,product_code"
  ).split(",");
  const sigMsg = fields.map((f) => `${f}=${payload[f]}`).join(",");
  const expected = generateEsewaSignature(sigMsg, secretKey);

  if (expected !== received) {
    res.status(400);
    throw new Error("eSewa signature verification failed");
  }

  const merchantCode = (process.env.ESEWA_MERCHANT_ID || "EPAYTEST").trim();
  const esewaBase = (process.env.ESEWA_BASE_URL || "").trim();
  const isSandbox = merchantCode === "EPAYTEST" || esewaBase.includes("rc-epay");

  // Cross-check with appropriate eSewa status API (Sandbox or Live)
  const statusUrl = isSandbox
    ? "https://rc-epay.esewa.com.np/api/epay/transaction/status/"
    : "https://epay.esewa.com.np/api/epay/transaction/status/";

  let isVerified = status === "COMPLETE";

  try {
    const { data } = await axios.get(statusUrl, {
      params: {
        product_code: merchantCode,
        transaction_uuid,
        total_amount: total_amount.replace(/,/g, ""),
      },
    });
    if (data.status === "COMPLETE") {
      isVerified = true;
    }
  } catch (err) {
    console.warn(`[eSewa status check warning]: ${err.message}`);
    // If HMAC signature matched, we can accept if payload status was COMPLETE
    if (status !== "COMPLETE") {
      res.status(502);
      throw new Error(`eSewa status check failed: ${err.message}`);
    }
  }

  if (!isVerified) {
    res.status(400);
    throw new Error(`eSewa payment not completed. Status: ${status}`);
  }

  // Atomically deduct inventory with overdraft prevention (ACID)
  await deductOrderStock(order.orderItems);

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
