// src/pages/OrderDetailPage.jsx — Order detail view with delivered-item review modal & retry payment

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineTruck,
  HiOutlineCash,
  HiArrowLeft,
  HiOutlineRefresh,
  HiStar,
  HiOutlineX,
  HiOutlineSparkles,
} from "react-icons/hi";
import api from "../utils/api";
import useAuthStore from "../context/authStore";
import useCartStore from "../context/cartStore";
import {
  formatPrice,
  formatDate,
  getOrderStatusConfig,
  getErrorMessage,
} from "../utils/helpers";
import { StarInput } from "../components/common/UI";

const STATUS_STEPS = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
];

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const clearCart = useCartStore((s) => s.clearCart);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Review modal state for delivered items
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchOrder = () => {
    setLoading(true);
    api
      .get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.data))
      .catch(() => toast.error("Order not found"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  // Retry payment for unpaid orders (eSewa & Khalti)
  const handleCompletePayment = async () => {
    setActionLoading(true);
    try {
      if (order.paymentMethod === "khalti") {
        const { data } = await api.post(`/orders/${order._id}/pay/khalti/initiate`);
        const url = data.data?.payment_url || data.payment_url;
        if (url) {
          window.location.href = url;
        } else {
          toast.error("Could not initiate Khalti payment");
        }
        return;
      }

      if (order.paymentMethod === "esewa") {
        const { data } = await api.post(`/orders/${order._id}/pay/esewa/initiate`);
        const formData = data.data;
        const form = document.createElement("form");
        form.method = "POST";
        form.action =
          formData.payment_url ||
          formData.esewa_url ||
          "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
        Object.entries(formData).forEach(([k, v]) => {
          if (k === "esewa_url" || k === "payment_url") return;
          const inp = document.createElement("input");
          inp.type = "hidden";
          inp.name = k;
          inp.value = v;
          form.appendChild(inp);
        });
        document.body.appendChild(form);
        form.submit();
        return;
      }

      toast.info("Please contact support or re-order for other payment methods.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel order
  const handleCancelOrder = async () => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setActionLoading(true);
    try {
      await api.put(`/orders/${order._id}/cancel`, { reason: "User cancelled" });
      toast.success("Order cancelled");
      fetchOrder();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // Submit product review for delivered item
  const handleOpenReview = (item) => {
    setReviewItem(item);
    setReviewRating(5);
    setReviewComment("");
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewItem) return;
    const productId = reviewItem.product?._id || reviewItem.product;
    if (!reviewRating || reviewRating < 1) {
      toast.error("Please select a star rating between 1 and 5");
      return;
    }
    if (!reviewComment.trim() || reviewComment.trim().length < 5) {
      toast.error("Please provide at least 5 characters of feedback");
      return;
    }
    setSubmittingReview(true);
    try {
      await api.post(`/products/${productId}/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      toast.success("Thank you! Your verified review has been published ⭐");
      setReviewItem(null);
      fetchOrder();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading)
    return (
      <div className="page-container py-24 pt-28 flex justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--gold-400)', borderTopColor: 'transparent' }} />
      </div>
    );

  if (!order)
    return (
      <div className="page-container py-24 text-center">
        <h2 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>Order not found</h2>
        <Link to="/orders" className="btn-primary">
          Back to Orders
        </Link>
      </div>
    );

  const statusConfig = getOrderStatusConfig(order.orderStatus);
  const currentStep = STATUS_STEPS.indexOf(order.orderStatus);
  const isDelivered = order.orderStatus === "delivered";

  return (
    <div className="page-container py-8 pt-24 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Header / Back Link */}
      <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-sm transition-colors hover:text-gold-400"
          style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}
        >
          <HiArrowLeft className="w-4 h-4" /> Back to My Orders
        </Link>
        <span className={`badge ${statusConfig.color} font-bold text-xs`}>
          {statusConfig.label}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Tracking & Ordered Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Banner */}
          <div className="card-glass p-6 rounded-2xl" style={{ border: '1px solid var(--border)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-heading)' }}>
                  Order #{order._id.slice(-8).toUpperCase()}
                </p>
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                  Placed on {formatDate(order.createdAt)}
                </h1>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Payment Method: <span className="font-semibold uppercase" style={{ color: 'var(--text-primary)' }}>{order.paymentMethod}</span>
                  {order.isPaid ? ' (Paid Online)' : ' (Cash on Delivery)'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!order.isPaid && order.paymentMethod !== "cod" && order.orderStatus !== "cancelled" && (
                  <button
                    onClick={handleCompletePayment}
                    disabled={actionLoading}
                    className="btn-primary text-xs py-2 px-4"
                  >
                    <HiOutlineRefresh className="w-4 h-4" /> Complete Payment
                  </button>
                )}
                {["pending", "confirmed"].includes(order.orderStatus) && (
                  <button
                    onClick={handleCancelOrder}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

            {/* Delivery Progress Stepper */}
            {order.orderStatus !== "cancelled" && (
              <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex justify-between items-center relative">
                  {/* Background progress bar */}
                  <div
                    className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 rounded-full z-0"
                    style={{ background: 'var(--border-subtle)' }}
                  />
                  <div
                    className="absolute top-1/2 left-0 -translate-y-1/2 h-1 rounded-full transition-all duration-500 z-0"
                    style={{
                      width: `${(Math.max(0, currentStep) / (STATUS_STEPS.length - 1)) * 100}%`,
                      background: 'linear-gradient(90deg, var(--gold-400), #22c55e)',
                    }}
                  />

                  {STATUS_STEPS.map((step, idx) => {
                    const isDone = idx <= currentStep;
                    const isCurrent = idx === currentStep;
                    return (
                      <div key={step} className="flex flex-col items-center relative z-10">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                          style={{
                            background: isDone ? (idx === STATUS_STEPS.length - 1 ? '#22c55e' : 'var(--gold-400)') : 'var(--bg-secondary)',
                            color: isDone ? '#080808' : 'var(--text-muted)',
                            border: `2px solid ${isCurrent ? 'var(--gold-300)' : 'var(--border-subtle)'}`,
                            boxShadow: isCurrent ? '0 0 16px rgba(201,162,39,0.5)' : 'none',
                          }}
                        >
                          {isDone ? '✓' : idx + 1}
                        </div>
                        <span className="text-[11px] capitalize mt-2 font-medium text-center hidden sm:block" style={{ color: isDone ? 'var(--text-primary)' : 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Ordered Equipment Items */}
          <div className="card-glass p-6 rounded-2xl space-y-4" style={{ border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                Equipment in Order ({order.orderItems?.length})
              </h2>
              {isDelivered && (
                <span className="badge badge-green text-xs font-semibold flex items-center gap-1">
                  <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Delivered & Verified
                </span>
              )}
            </div>

            <div className="divide-y divide-white/5">
              {order.orderItems?.map((item) => (
                <div key={item._id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image || '/images/products/bat.jpg'}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover"
                      style={{ background: '#111', border: '1px solid var(--border-subtle)' }}
                    />
                    <div>
                      <Link
                        to={`/products/${item.product?.slug || item.product?._id || item.product}`}
                        className="font-semibold text-sm hover:text-gold-400 transition-colors block"
                        style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
                      >
                        {item.name}
                      </Link>
                      <div className="flex gap-3 text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        <span>Qty: {item.quantity}</span>
                        {item.size && <span>Size: {item.size}</span>}
                        {item.color && <span>Color: {item.color}</span>}
                      </div>
                      <p className="text-xs font-bold mt-1" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-mono)' }}>
                        {formatPrice(item.price)} each
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2">
                    <span className="text-sm font-bold" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-mono)' }}>
                      {formatPrice(item.price * item.quantity)}
                    </span>

                    {/* Review Button if Delivered */}
                    {isDelivered && (
                      <button
                        onClick={() => handleOpenReview(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                        style={{
                          background: 'linear-gradient(135deg, rgba(201,162,39,0.2), rgba(201,162,39,0.08))',
                          border: '1px solid var(--border)',
                          color: 'var(--gold-300)',
                          fontFamily: 'var(--font-heading)',
                        }}
                      >
                        <HiStar className="w-3.5 h-3.5 text-gold-400" /> Review Equipment
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Delivery Address */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="card-glass p-6 rounded-2xl space-y-4" style={{ border: '1px solid var(--border)' }}>
            <h2 className="font-bold text-lg" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              Payment Summary
            </h2>
            <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>
              <div className="flex justify-between">
                <span>Items Total</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {formatPrice(order.itemsPrice || order.totalPrice - (order.shippingPrice || 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {order.shippingPrice === 0 ? 'FREE' : formatPrice(order.shippingPrice || 0)}
                </span>
              </div>
              <div className="divider-gold my-2" />
              <div className="flex justify-between text-base font-bold">
                <span style={{ color: 'var(--text-primary)' }}>Total Amount</span>
                <span style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-mono)' }}>
                  {formatPrice(order.totalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="card-glass p-6 rounded-2xl space-y-3" style={{ border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-1">
              <HiOutlineTruck className="w-5 h-5 text-gold-400" style={{ color: 'var(--gold-400)' }} />
              <h2 className="font-bold text-base" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                Delivery Address
              </h2>
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {order.shippingAddress?.fullName || user?.name}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {order.shippingAddress?.phone || user?.phone}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.district}, {order.shippingAddress?.province}
            </p>
          </div>
        </div>
      </div>

      {/* Review Modal for Delivered Items */}
      <AnimatePresence>
        {reviewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={(e) => { if (e.target === e.currentTarget) setReviewItem(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="card-glass p-7 rounded-2xl w-full max-w-md relative"
              style={{ border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
            >
              <button
                onClick={() => setReviewItem(null)}
                className="absolute top-4 right-4 p-2 rounded-xl text-muted hover:text-white hover:bg-white/5 transition-colors"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <img
                  src={reviewItem.image || '/images/products/bat.jpg'}
                  alt={reviewItem.name}
                  className="w-14 h-14 rounded-xl object-cover"
                  style={{ border: '1px solid var(--border)' }}
                />
                <div>
                  <span className="badge badge-green text-[10px] font-bold uppercase mb-1">
                    ✓ Verified Delivered Item
                  </span>
                  <h3 className="font-bold text-sm line-clamp-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                    {reviewItem.name}
                  </h3>
                </div>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="label">Your Rating</label>
                  <div className="py-1">
                    <StarInput value={reviewRating} onChange={setReviewRating} />
                  </div>
                </div>

                <div>
                  <label className="label">Performance & Craftsmanship Feedback</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share how this equipment performed on the pitch (grip, balance, durability)..."
                    rows={4}
                    className="input resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewItem(null)}
                    className="btn-secondary px-5 py-2.5 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="btn-primary px-6 py-2.5 text-xs"
                  >
                    {submittingReview ? 'Publishing…' : 'Publish Verified Review'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
