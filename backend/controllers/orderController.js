// controllers/orderController.js
// Order placement, payment verification (Khalti + eSewa), and order management

const asyncHandler = require('express-async-handler');
const axios = require('axios');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Calculate pricing breakdown
// ─────────────────────────────────────────────────────────────────────────────
const calculatePricing = (items) => {
  const itemsPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  // Free shipping above NPR 5000, else NPR 150
  const shippingPrice = itemsPrice >= 5000 ? 0 : 150;
  // 13% VAT (Nepal)
  const taxPrice = Math.round(itemsPrice * 0.13);
  const totalPrice = itemsPrice + shippingPrice + taxPrice;
  return { itemsPrice, shippingPrice, taxPrice, totalPrice };
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create new order
// @route   POST /api/orders
// @access  Private (user)
// ─────────────────────────────────────────────────────────────────────────────
const createOrder = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items provided');
  }

  // Verify products exist and have sufficient stock
  const verifiedItems = await Promise.all(
    orderItems.map(async (item) => {
      const product = await Product.findById(item.product).populate('seller', '_id');
      if (!product) throw new Error(`Product not found: ${item.product}`);
      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for: ${product.name}`);
      }
      return {
        product: product._id,
        seller: product.seller._id,
        name: product.name,
        image: product.images[0]?.url || '',
        price: product.discountPrice > 0 ? product.discountPrice : product.price,
        quantity: item.quantity,
        size: item.size || '',
        color: item.color || '',
      };
    })
  );

  const { itemsPrice, shippingPrice, taxPrice, totalPrice } = calculatePricing(verifiedItems);

  const order = await Order.create({
    user: req.user.id,
    orderItems: verifiedItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
  });

  // Deduct stock immediately on COD orders
  if (paymentMethod === 'cod') {
    await Promise.all(
      verifiedItems.map((item) =>
        Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
      )
    );
    order.orderStatus = 'confirmed';
    await order.save();
  }

  res.status(201).json({ success: true, data: order });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get logged-in user's orders
// @route   GET /api/orders/my-orders
// @access  Private
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
      .populate('orderItems.product', 'name slug images'),
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
// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('orderItems.product', 'name images slug');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Only the order owner, a seller involved, or admin can view
  const isOwner = order.user._id.toString() === req.user.id;
  const isSeller = order.orderItems.some((i) => i.seller.toString() === req.user.id);
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isSeller && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.status(200).json({ success: true, data: order });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify Khalti payment and update order
// @route   POST /api/orders/:id/pay/khalti
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const verifyKhaltiPayment = asyncHandler(async (req, res) => {
  const { token, amount } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.user.toString() !== req.user.id) { res.status(403); throw new Error('Not authorized'); }
  if (order.isPaid) { res.status(400); throw new Error('Order already paid'); }

  // Verify with Khalti API
  try {
    const response = await axios.post(
      `${process.env.KHALTI_BASE_URL}/payment/verify/`,
      { token, amount },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { idx, state, amount: paidAmount, mobile } = response.data;

    if (state?.name !== 'Completed') {
      res.status(400);
      throw new Error('Khalti payment not completed');
    }

    // Update order as paid
    order.isPaid = true;
    order.paidAt = Date.now();
    order.orderStatus = 'confirmed';
    order.paymentResult = {
      transaction_id: idx,
      status: state.name,
      paid_amount: paidAmount / 100, // Khalti uses paisa
      payment_method: 'khalti',
      verified_at: new Date(),
      khalti_token: token,
      khalti_mobile: mobile,
    };
    await order.save();

    // Deduct stock after successful payment
    await Promise.all(
      order.orderItems.map((item) =>
        Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
      )
    );

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    if (err.response) {
      res.status(400);
      throw new Error(`Khalti verification failed: ${err.response.data?.detail || 'Unknown error'}`);
    }
    throw err;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Verify eSewa payment and update order
// @route   POST /api/orders/:id/pay/esewa
// @access  Private
//
// eSewa flow:
//   1. Frontend sends user to eSewa payment URL (built client-side)
//   2. eSewa redirects to success URL with ?oid=...&amt=...&refId=...
//   3. Frontend calls this endpoint with those params for server-side verification
// ─────────────────────────────────────────────────────────────────────────────
const verifyEsewaPayment = asyncHandler(async (req, res) => {
  const { oid, amt, refId } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.user.toString() !== req.user.id) { res.status(403); throw new Error('Not authorized'); }
  if (order.isPaid) { res.status(400); throw new Error('Order already paid'); }

  // Verify with eSewa's status check endpoint
  try {
    const verifyUrl = `${process.env.ESEWA_BASE_URL}/api/epay/transaction/status/`;
    const response = await axios.get(verifyUrl, {
      params: {
        product_code: process.env.ESEWA_MERCHANT_ID,
        transaction_uuid: oid,
        total_amount: amt,
      },
    });

    const { status, ref_id } = response.data;

    if (status !== 'COMPLETE') {
      res.status(400);
      throw new Error(`eSewa payment status: ${status}`);
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.orderStatus = 'confirmed';
    order.paymentResult = {
      transaction_id: oid,
      status: 'COMPLETE',
      paid_amount: Number(amt),
      payment_method: 'esewa',
      verified_at: new Date(),
      esewa_ref_id: ref_id || refId,
    };
    await order.save();

    await Promise.all(
      order.orderItems.map((item) =>
        Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
      )
    );

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    if (err.response) {
      res.status(400);
      throw new Error(`eSewa verification failed: ${JSON.stringify(err.response.data)}`);
    }
    throw err;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Cancel an order (user or admin)
// @route   PUT /api/orders/:id/cancel
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }

  const isOwner = order.user.toString() === req.user.id;
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorized');
  }

  const cancellableStatuses = ['pending', 'confirmed'];
  if (!cancellableStatuses.includes(order.orderStatus)) {
    res.status(400);
    throw new Error(`Cannot cancel an order that is already '${order.orderStatus}'`);
  }

  // Restore stock
  await Promise.all(
    order.orderItems.map((item) =>
      Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } })
    )
  );

  order.orderStatus = 'cancelled';
  order.cancelledAt = Date.now();
  order.cancelReason = req.body.reason || 'Cancelled by user';
  await order.save();

  res.status(200).json({ success: true, data: order });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get seller's orders (items belonging to their products)
// @route   GET /api/orders/seller-orders
// @access  Private (seller)
// ─────────────────────────────────────────────────────────────────────────────
const getSellerOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    Order.find({ 'orderItems.seller': req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name images'),
    Order.countDocuments({ 'orderItems.seller': req.user.id }),
  ]);

  // Calculate seller-specific revenue from their items only
  const sellerRevenue = await Order.aggregate([
    { $match: { 'orderItems.seller': req.user._id, isPaid: true } },
    { $unwind: '$orderItems' },
    { $match: { 'orderItems.seller': req.user._id } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } },
        totalOrders: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    revenue: sellerRevenue[0] || { totalRevenue: 0, totalOrders: 0 },
    data: orders,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Admin: Get all orders
// @route   GET /api/orders/admin
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────────────────────
const getAllOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filterQuery = {};
  if (req.query.status) filterQuery.orderStatus = req.query.status;
  if (req.query.paymentMethod) filterQuery.paymentMethod = req.query.paymentMethod;

  const [orders, total] = await Promise.all([
    Order.find(filterQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')
      .populate('orderItems.product', 'name'),
    Order.countDocuments(filterQuery),
  ]);

  // Dashboard stats
  const stats = await Order.aggregate([
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 },
        revenue: { $sum: { $cond: ['$isPaid', '$totalPrice', 0] } },
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
// @desc    Admin: Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (admin)
// ─────────────────────────────────────────────────────────────────────────────
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus, trackingNumber } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) { res.status(404); throw new Error('Order not found'); }

  order.orderStatus = orderStatus;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (orderStatus === 'delivered') {
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
  verifyKhaltiPayment,
  verifyEsewaPayment,
  cancelOrder,
  getSellerOrders,
  getAllOrders,
  updateOrderStatus,
};
