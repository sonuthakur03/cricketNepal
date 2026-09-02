// controllers/orderController.js
const asyncHandler = require("express-async-handler");
const axios = require("axios");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { deductOrderStock, restoreOrderStock } = require("../utils/inventoryHelper");

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: pricing breakdown (Single Source of Truth)
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
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}`);
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

  // For COD orders, reserve stock immediately at order creation to prevent overdraft
  if (paymentMethod === "cod") {
    await deductOrderStock(verifiedItems);
  }

  const order = await Order.create({
    user: req.user.id,
    orderItems: verifiedItems,
    shippingAddress,
    paymentMethod,
    ...pricing,
    orderStatus: paymentMethod === "cod" ? "pending" : "pending",
  });

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
  res.status(200).json({
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

  const frontendBase = (
    process.env.FRONTEND_URL || "http://localhost:5173"
  )
    .split(",")[0]
    .trim()
    .replace(/\/$/, "");

  const returnUrl = `${frontendBase}/payment/khalti/callback?orderId=${order._id}`;

  const rawKey =
    process.env.KHALTI_SECRET_KEY ||
    "Key 825405e3ec9744c8b21c4355204481b4";
  const authHeader = rawKey.startsWith("Key ") ? rawKey : `Key ${rawKey}`;

  // Khalti requires a 10-digit mobile number (e.g. 98XXXXXXXX)
  const rawPhone = order.shippingAddress?.phone || "";
  const cleanPhone = rawPhone.replace(/\D/g, "").slice(-10) || "9800000000";
  const customerName =
    order.shippingAddress?.fullName || req.user?.name || "Cricket Customer";

  try {
    const { data } = await axios.post(
      "https://a.khalti.com/api/v2/epayment/initiate/",
      {
        return_url: returnUrl,
        website_url: frontendBase,
        amount: Math.round(order.totalPrice * 100), // in paisa
        purchase_order_id: order._id.toString(),
        purchase_order_name: `Pitch Nepal Order #${order._id.toString().slice(-8).toUpperCase()}`,
        customer_info: {
          name: customerName,
          phone: cleanPhone,
          email: req.user?.email || "support@pitchnepal.com",
        },
      },
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      },
    );

    res.status(200).json({
      success: true,
      data: { payment_url: data.payment_url, pidx: data.pidx },
    });
  } catch (err) {
    const errData = err.response?.data;
    const msg = errData
      ? typeof errData === "object"
        ? JSON.stringify(errData)
        : errData
      : err.message;
    console.error("[Khalti initiate error]:", msg);
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

  const rawKey =
    process.env.KHALTI_SECRET_KEY ||
    "Key 825405e3ec9744c8b21c4355204481b4";
  const authHeader = rawKey.startsWith("Key ") ? rawKey : `Key ${rawKey}`;

  try {
    const { data } = await axios.post(
      "https://a.khalti.com/api/v2/epayment/lookup/",
      { pidx },
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      },
    );

    if (data.status !== "Completed") {
      res.status(400);
      throw new Error(`Payment not completed. Khalti status: ${data.status}`);
    }

    // Atomically deduct inventory with overdraft prevention (ACID)
    await deductOrderStock(order.orderItems);

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
// @desc  Cancel order (restores stock if deducted)
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

  // Restore inventory if it was paid online OR if it was a COD order
  if (order.isPaid || order.paymentMethod === "cod") {
    await restoreOrderStock(order.orderItems);
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

  // Breakdown by payment method
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
      pendingRevenue: rev[0]?.pendingRevenue || 0,
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
  res.status(200).json({
    success: true,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    stats,
    data: orders,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Update order status (seller or admin authorized)
// ─────────────────────────────────────────────────────────────────────────────
const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  // Authorization check: User must be an admin OR a seller of items in this order
  const isSeller = order.orderItems.some(
    (i) => i.seller.toString() === req.user.id,
  );
  const isAdmin = req.user.role === "admin";
  if (!isSeller && !isAdmin) {
    res.status(403);
    throw new Error("Not authorized to update status of this order");
  }

  const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
  if (req.body.orderStatus && !validStatuses.includes(req.body.orderStatus)) {
    res.status(400);
    throw new Error(`Invalid status. Allowed statuses: ${validStatuses.join(", ")}`);
  }

  // If cancelling order via status update, restore stock (ACID consistency)
  if (req.body.orderStatus === "cancelled" && order.orderStatus !== "cancelled") {
    if (order.isPaid || order.paymentMethod === "cod") {
      await restoreOrderStock(order.orderItems);
    }
    order.cancelledAt = Date.now();
    order.cancelReason = req.body.reason || "Cancelled by seller/admin";
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
  cancelOrder,
  sellerConfirmOrder,
  markCodPaid,
  getSellerOrders,
  getAllOrders,
  updateOrderStatus,
};

