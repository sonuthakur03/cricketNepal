// controllers/orderController.js
const asyncHandler = require("express-async-handler");
const axios = require("axios");
const Order = require("../models/Order");
const Product = require("../models/Product");

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: pricing breakdown
// ─────────────────────────────────────────────────────────────────────────────
const calculatePricing = (items) => {
  const itemsPrice = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const shippingPrice = itemsPrice >= 5000 ? 0 : 150;
  const taxPrice = Math.round(itemsPrice * 0.13);
  const totalPrice = itemsPrice + shippingPrice + taxPrice;
  return { itemsPrice, shippingPrice, taxPrice, totalPrice };
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Create order
// @route POST /api/orders
// ─────────────────────────────────────────────────────────────────────────────
const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body;
  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error("No order items");
  }

  const verifiedItems = await Promise.all(
    orderItems.map(async (item) => {
      const product = await Product.findById(item.product).populate(
        "seller",
        "_id",
      );
      if (!product) throw new Error(`Product not found: ${item.product}`);
      if (product.stock < item.quantity)
        throw new Error(`Insufficient stock: ${product.name}`);
      return {
        product: product._id,
        seller: product.seller._id,
        name: product.name,
        image: product.images[0]?.url || "",
        price:
          product.discountPrice > 0 ? product.discountPrice : product.price,
        quantity: item.quantity,
        size: item.size || "",
        color: item.color || "",
      };
    }),
  );

  const pricing = calculatePricing(verifiedItems);
  const order = await Order.create({
    user: req.user.id,
    orderItems: verifiedItems,
    shippingAddress,
    paymentMethod,
    ...pricing,
  });

  if (paymentMethod === "cod") {
    order.orderStatus = "pending"; // seller must confirm
    await order.save();
  }

  res.status(201).json({ success: true, data: order });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get my orders
// ─────────────────────────────────────────────────────────────────────────────
const getMyOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("orderItems.product", "name slug images"),
    Order.countDocuments({ user: req.user.id }),
  ]);
  res
    .status(200)
    .json({
      success: true,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: orders,
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get single order
// ─────────────────────────────────────────────────────────────────────────────
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email phone")
    .populate("orderItems.product", "name images slug");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const isOwner = order.user._id.toString() === req.user.id;
  const isSeller = order.orderItems.some(
    (i) => i.seller.toString() === req.user.id,
  );
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isSeller && !isAdmin) {
    res.status(403);
    throw new Error("Not authorized");
  }

  res.status(200).json({ success: true, data: order });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Initiate Khalti payment (v2) — returns payment URL
// @route POST /api/orders/:id/pay/khalti/initiate
// ─────────────────────────────────────────────────────────────────────────────
const initiateKhaltiPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
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

  const returnUrl = `${process.env.FRONTEND_URL}/payment/khalti/callback?orderId=${order._id}`;

  try {
    const { data } = await axios.post(
      "https://a.khalti.com/api/v2/epayment/initiate/",
      {
        return_url: returnUrl,
        website_url: process.env.FRONTEND_URL || "http://localhost:5173",
        amount: Math.round(order.totalPrice * 100), // in paisa
        purchase_order_id: order._id.toString(),
        purchase_order_name: `Pitch Nepal Order #${order._id.toString().slice(-8).toUpperCase()}`,
        customer_info: {
          name: order.shippingAddress.fullName,
          phone: order.shippingAddress.phone,
        },
      },
      { headers: { Authorization: `Key ${process.env.KHALTI_SECRET_KEY}` } },
    );
    // data.payment_url is where we redirect the user
    res
      .status(200)
      .json({
        success: true,
        data: { payment_url: data.payment_url, pidx: data.pidx },
      });
  } catch (err) {
    const msg = err.response?.data
      ? JSON.stringify(err.response.data)
      : err.message;
    res.status(502);
    throw new Error(`Khalti initiation failed: ${msg}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Verify Khalti payment after callback — uses pidx lookup
// @route POST /api/orders/:id/pay/khalti/verify
// ─────────────────────────────────────────────────────────────────────────────
const verifyKhaltiPayment = asyncHandler(async (req, res) => {
  const { pidx } = req.body;
  const order = await Order.findById(req.params.id);
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
  if (!pidx) {
    res.status(400);
    throw new Error("Missing pidx");
  }

  try {
    const { data } = await axios.post(
      "https://a.khalti.com/api/v2/epayment/lookup/",
      { pidx },
      { headers: { Authorization: `Key ${process.env.KHALTI_SECRET_KEY}` } },
    );

    if (data.status !== "Completed") {
      res.status(400);
      throw new Error(`Payment not completed. Khalti status: ${data.status}`);
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.orderStatus = "confirmed";
    order.paymentResult = {
      transaction_id: data.transaction_id || pidx,
      status: "Completed",
      paid_amount: data.total_amount / 100,
      payment_method: "khalti",
      verified_at: new Date(),
      khalti_token: pidx,
      khalti_mobile: data.user?.mobile || "",
    };
    await order.save();

    await Promise.all(
      order.orderItems.map((item) =>
        Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        }),
      ),
    );
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    if (err.response) {
      res.status(400);
      throw new Error(
        `Khalti lookup failed: ${JSON.stringify(err.response.data)}`,
      );
    }
    throw err;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Verify eSewa payment
// @route POST /api/orders/:id/pay/esewa
// ─────────────────────────────────────────────────────────────────────────────
const verifyEsewaPayment = asyncHandler(async (req, res) => {
  // eSewa v2 sends base64-encoded JSON in the ?data= query param
  // Frontend decodes it and sends { encodedData } here
  const { encodedData } = req.body;
  if (!encodedData) {
    res.status(400);
    throw new Error("Missing eSewa data");
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encodedData, "base64").toString("utf8"));
  } catch {
    res.status(400);
    throw new Error("Invalid eSewa payload encoding");
  }

  const { transaction_uuid, total_amount, status } = payload;
  const order = await Order.findById(req.params.id);
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

  if (status !== "COMPLETE") {
    res.status(400);
    throw new Error(`eSewa status: ${status}`);
  }

  // Cross-check with eSewa status API
  try {
    const statusUrl =
      process.env.NODE_ENV === "production"
        ? "https://epay.esewa.com.np/api/epay/transaction/status/"
        : "https://rc-epay.esewa.com.np/api/epay/transaction/status/";

    const { data } = await axios.get(statusUrl, {
      params: {
        product_code: process.env.ESEWA_MERCHANT_ID || "EPAYTEST",
        transaction_uuid,
        total_amount,
      },
    });

    if (data.status !== "COMPLETE") {
      res.status(400);
      throw new Error(`eSewa API status: ${data.status}`);
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.orderStatus = "confirmed";
    order.paymentResult = {
      transaction_id: transaction_uuid,
      status: "COMPLETE",
      paid_amount: Number(total_amount),
      payment_method: "esewa",
      verified_at: new Date(),
      esewa_ref_id: data.ref_id || "",
    };
    await order.save();

    await Promise.all(
      order.orderItems.map((item) =>
        Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        }),
      ),
    );
    res.status(200).json({ success: true, data: order });
  } catch (err) {
    if (err.response) {
      res.status(400);
      throw new Error(`eSewa API error: ${JSON.stringify(err.response.data)}`);
    }
    throw err;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Cancel order
// ─────────────────────────────────────────────────────────────────────────────
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (order.user.toString() !== req.user.id && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized");
  }
  if (!["pending", "confirmed"].includes(order.orderStatus)) {
    res.status(400);
    throw new Error(`Cannot cancel '${order.orderStatus}' order`);
  }

  if (order.isPaid) {
    await Promise.all(
      order.orderItems.map((item) =>
        Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        }),
      ),
    );
  }
  order.orderStatus = "cancelled";
  order.cancelledAt = Date.now();
  order.cancelReason = req.body.reason || "Cancelled by user";
  await order.save();
  res.status(200).json({ success: true, data: order });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Seller confirms pending order
// ─────────────────────────────────────────────────────────────────────────────
const sellerConfirmOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  const isSeller = order.orderItems.some(
    (i) => i.seller.toString() === req.user.id,
  );
  if (!isSeller && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized");
  }
  if (order.orderStatus !== "pending") {
    res.status(400);
    throw new Error(`Order is already '${order.orderStatus}'`);
  }
  order.orderStatus = "confirmed";
  await order.save();
  res.status(200).json({ success: true, data: order });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Seller marks COD as paid + delivered
// ─────────────────────────────────────────────────────────────────────────────
const markCodPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  const isSeller = order.orderItems.some(
    (i) => i.seller.toString() === req.user.id,
  );
  if (!isSeller && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized");
  }
  if (order.paymentMethod !== "cod") {
    res.status(400);
    throw new Error("Only COD orders");
  }
  if (order.isPaid) {
    res.status(400);
    throw new Error("Already paid");
  }

  order.isPaid = true;
  order.paidAt = Date.now();
  order.orderStatus = "delivered";
  order.isDelivered = true;
  order.deliveredAt = Date.now();
  order.paymentResult = {
    transaction_id: `COD-${order._id.toString().slice(-8).toUpperCase()}`,
    status: "PAID",
    paid_amount: order.totalPrice,
    payment_method: "cod",
    verified_at: new Date(),
  };

  // Deduct stock for COD (was held on order creation)
  await Promise.all(
    order.orderItems.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      }),
    ),
  );

  await order.save();
  res.status(200).json({ success: true, data: order });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get seller orders
// ─────────────────────────────────────────────────────────────────────────────
const getSellerOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find({ "orderItems.seller": req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email")
      .populate("orderItems.product", "name images"),
    Order.countDocuments({ "orderItems.seller": req.user.id }),
  ]);
  const rev = await Order.aggregate([
    // Count ALL non-cancelled orders as earned revenue:
    // - isPaid: true  → already paid (Khalti / eSewa)
    // - paymentMethod: cod + confirmed/processing/shipped/delivered → COD is guaranteed
    {
      $match: {
        "orderItems.seller": req.user._id,
        orderStatus: { $nin: ["cancelled", "pending"] },
      },
    },
    { $unwind: "$orderItems" },
    { $match: { "orderItems.seller": req.user._id } },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] },
        },
        totalOrders: { $sum: 1 },
        paidRevenue: {
          $sum: {
            $cond: [
              "$isPaid",
              { $multiply: ["$orderItems.price", "$orderItems.quantity"] },
              0,
            ],
          },
        },
        pendingRevenue: {
          $sum: {
            $cond: [
              "$isPaid",
              0,
              { $multiply: ["$orderItems.price", "$orderItems.quantity"] },
            ],
          },
        },
      },
    },
  ]);

  // Also get breakdown by payment method
  const codStats = await Order.aggregate([
    {
      $match: {
        "orderItems.seller": req.user._id,
        paymentMethod: "cod",
        orderStatus: { $nin: ["cancelled", "pending"] },
      },
    },
    {
      $group: {
        _id: "$isPaid",
        count: { $sum: 1 },
        amount: { $sum: "$totalPrice" },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    revenue: {
      totalRevenue: rev[0]?.totalRevenue || 0,
      paidRevenue: rev[0]?.paidRevenue || 0,
      pendingRevenue: rev[0]?.pendingRevenue || 0, // COD confirmed but not yet collected
      totalOrders: rev[0]?.totalOrders || 0,
      codStats,
    },
    data: orders,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Admin: Get all orders
// ─────────────────────────────────────────────────────────────────────────────
const getAllOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const q = {};
  if (req.query.status) q.orderStatus = req.query.status;
  if (req.query.paymentMethod) q.paymentMethod = req.query.paymentMethod;
  const [orders, total] = await Promise.all([
    Order.find(q)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email")
      .populate("orderItems.product", "name"),
    Order.countDocuments(q),
  ]);
  const stats = await Order.aggregate([
    {
      $group: {
        _id: "$orderStatus",
        count: { $sum: 1 },
        revenue: { $sum: { $cond: ["$isPaid", "$totalPrice", 0] } },
      },
    },
  ]);
  res
    .status(200)
    .json({
      success: true,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      stats,
      data: orders,
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Admin: Update order status
// ─────────────────────────────────────────────────────────────────────────────
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  order.orderStatus = req.body.orderStatus;
  if (req.body.trackingNumber) order.trackingNumber = req.body.trackingNumber;
  if (req.body.orderStatus === "delivered") {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
  }
  await order.save();
  res.status(200).json({ success: true, data: order });
});

module.exports = {
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
};
