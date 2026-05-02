// models/Order.js
// Order schema with Khalti/eSewa payment support

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  size: { type: String, default: '' },
  color: { type: String, default: '' },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [orderItemSchema],

    // Shipping address
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String, required: true },
      province: { type: String, required: true },
      postalCode: { type: String, default: '' },
    },

    // Pricing breakdown
    itemsPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    taxPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },

    // Payment info
    paymentMethod: {
      type: String,
      required: true,
      enum: ['khalti', 'esewa', 'cod'], // Cash on Delivery also supported
    },
    paymentResult: {
      // Populated after successful payment verification
      transaction_id: { type: String },
      status: { type: String },
      paid_amount: { type: Number },
      payment_method: { type: String },
      verified_at: { type: Date },
      // Khalti-specific
      khalti_token: { type: String },
      khalti_mobile: { type: String },
      // eSewa-specific
      esewa_ref_id: { type: String },
    },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },

    // Fulfillment status
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },

    // Order tracking
    trackingNumber: { type: String, default: '' },
    notes: { type: String, default: '' },

    // Cancellation info
    cancelledAt: { type: Date },
    cancelReason: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

// ── Index for common queries ──────────────────────────────────────────────
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ 'orderItems.seller': 1 });

module.exports = mongoose.model('Order', orderSchema);
