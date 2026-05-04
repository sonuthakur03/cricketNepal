// src/pages/OrderDetailPage.jsx
// Full order detail view with retry payment + seller COD confirmation

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineTruck,
  HiOutlineCash,
  HiArrowLeft,
  HiOutlineRefresh,
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

  // ── Retry Khalti — server-side initiation ──────────────────────────────────
  const handleRetryKhalti = async () => {
    setActionLoading(true);
    try {
      const { data } = await api.post(
        `/orders/${order._id}/pay/khalti/initiate`,
      );
      window.location.href = data.data.payment_url; // redirect to Khalti
    } catch (err) {
      toast.error(getErrorMessage(err));
      setActionLoading(false);
    }
  };

  // ── Retry eSewa payment ─────────────────────────────────────────────────────
  const handleRetryEsewa = async () => {
    setActionLoading(true);
    try {
      const { data } = await api.post(`/esewa/initiate/${order._id}`);
      const p = data.data;
      const form = document.createElement("form");
      form.method = "POST";
      form.action = p.payment_url;
      Object.entries({
        amount: p.amount,
        tax_amount: p.tax_amount,
        product_service_charge: p.product_service_charge,
        product_delivery_charge: p.product_delivery_charge,
        total_amount: p.total_amount,
        transaction_uuid: p.transaction_uuid,
        product_code: p.product_code,
        success_url: p.success_url,
        failure_url: p.failure_url,
        signed_field_names: p.signed_field_names,
        signature: p.signature,
      }).forEach(([k, v]) => {
        const inp = document.createElement("input");
        inp.type = "hidden";
        inp.name = k;
        inp.value = v;
        form.appendChild(inp);
      });
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      toast.error(getErrorMessage(err));
      setActionLoading(false);
    }
  };

  // ── Cancel order ────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!window.confirm("Cancel this order?")) return;
    setActionLoading(true);
    try {
      await api.put(`/orders/${order._id}/cancel`, {
        reason: "Cancelled by customer",
      });
      toast.success("Order cancelled");
      fetchOrder();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // ── Seller: confirm order ───────────────────────────────────────────────────
  const handleSellerConfirm = async () => {
    setActionLoading(true);
    try {
      await api.put(`/orders/${order._id}/confirm`);
      toast.success("Order confirmed!");
      fetchOrder();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  // ── Seller: mark COD as paid ────────────────────────────────────────────────
  const handleMarkPaid = async () => {
    if (!window.confirm("Mark this COD order as paid and delivered?")) return;
    setActionLoading(true);
    try {
      await api.put(`/orders/${order._id}/mark-paid`);
      toast.success("Order marked as paid and delivered!");
      fetchOrder();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="page-container pt-28 min-h-screen">
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      </div>
    );

  if (!order)
    return (
      <div className="page-container pt-28 min-h-screen text-center py-20">
        <p className="text-xl font-bold mb-4">Order not found</p>
        <Link to="/orders" className="btn-primary">
          Back to Orders
        </Link>
      </div>
    );

  const { label, color } = getOrderStatusConfig(order.orderStatus);
  const currentStepIdx = STATUS_STEPS.indexOf(order.orderStatus);
  const isBuyer =
    order.user?._id?.toString() === user?._id ||
    order.user?.toString() === user?._id;
  const isSeller = order.orderItems?.some(
    (i) => i.seller?.toString() === user?._id,
  );
  const isAdmin = user?.role === "admin";
  const canCancel =
    ["pending", "confirmed"].includes(order.orderStatus) &&
    (isBuyer || isAdmin);
  const canRetryPayment =
    !order.isPaid && order.orderStatus !== "cancelled" && isBuyer;

  return (
    <div className="page-container pt-24 py-12 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="btn-ghost py-2 px-3">
          <HiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1
            className="text-2xl font-black"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Order #{order._id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <span className={`${color} ml-auto`}>{label}</span>
      </div>

      {/* Status timeline (hide if cancelled) */}
      {order.orderStatus !== "cancelled" && (
        <div className="card p-5 mb-6">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-4 h-0.5 bg-slate-200 dark:bg-slate-700 z-0" />
            <div
              className="absolute left-0 top-4 h-0.5 bg-amber-500 z-0 transition-all duration-500"
              style={{
                width: `${Math.max(0, (currentStepIdx / (STATUS_STEPS.length - 1)) * 100)}%`,
              }}
            />
            {STATUS_STEPS.map((step, i) => (
              <div
                key={step}
                className="flex flex-col items-center gap-1.5 z-10"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    i <= currentStepIdx
                      ? "bg-amber-500 border-amber-500 text-white"
                      : "bg-white dark:bg-dark-900 border-slate-300 dark:border-slate-600 text-slate-400"
                  }`}
                >
                  {i < currentStepIdx ? "✓" : i + 1}
                </div>
                <span
                  className={`text-xs font-medium capitalize hidden sm:block ${
                    i <= currentStepIdx
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-[var(--color-text-muted)]"
                  }`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Action banners */}
          {canRetryPayment && (
            <div
              className={`card p-4 border-2 ${order.paymentMethod === "khalti" ? "border-purple-300 dark:border-purple-700" : "border-green-300 dark:border-green-700"}`}
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="font-bold text-sm">Payment Pending</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Complete your {order.paymentMethod.toUpperCase()} payment to
                    confirm this order.
                  </p>
                </div>
                {order.paymentMethod === "khalti" && (
                  <button
                    onClick={handleRetryKhalti}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm transition-colors"
                  >
                    <HiOutlineRefresh className="w-4 h-4" /> Pay with Khalti
                  </button>
                )}
                {order.paymentMethod === "esewa" && (
                  <button
                    onClick={handleRetryEsewa}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors"
                  >
                    <HiOutlineRefresh className="w-4 h-4" /> Pay with eSewa
                  </button>
                )}
                {order.paymentMethod === "cod" && (
                  <div className="badge-gold text-sm">Pay on delivery</div>
                )}
              </div>
            </div>
          )}

          {/* Seller actions */}
          {(isSeller || isAdmin) && (
            <div className="card p-4 border-2 border-amber-200 dark:border-amber-800">
              <p className="font-bold text-sm mb-3">Seller Actions</p>
              <div className="flex flex-wrap gap-3">
                {order.orderStatus === "pending" && (
                  <button
                    onClick={handleSellerConfirm}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm"
                  >
                    <HiOutlineCheckCircle className="w-4 h-4" /> Confirm Order
                  </button>
                )}
                {order.paymentMethod === "cod" &&
                  !order.isPaid &&
                  order.orderStatus !== "cancelled" && (
                    <button
                      onClick={handleMarkPaid}
                      disabled={actionLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm"
                    >
                      <HiOutlineCash className="w-4 h-4" /> Mark COD as Paid &
                      Delivered
                    </button>
                  )}
              </div>
            </div>
          )}

          {/* Order items */}
          <div className="card p-5">
            <h2
              className="font-bold mb-4"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Items ({order.orderItems?.length})
            </h2>
            <div className="space-y-4">
              {order.orderItems?.map((item) => (
                <div key={item._id} className="flex gap-4">
                  <Link
                    to={`/products/${item.product?.slug || item.product?._id}`}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 flex-shrink-0"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.product?.slug || item.product?._id}`}
                      className="font-semibold text-sm hover:text-amber-600 transition-colors line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    {item.size && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Size: {item.size}
                      </p>
                    )}
                    {item.color && (
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Color: {item.color}
                      </p>
                    )}
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-sm flex-shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping address */}
          <div className="card p-5">
            <h2
              className="font-bold mb-3"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              <HiOutlineTruck className="inline w-5 h-5 mr-1" /> Shipping
              Address
            </h2>
            <div className="text-sm text-[var(--color-text-muted)] space-y-1">
              <p className="font-semibold text-[var(--color-text)]">
                {order.shippingAddress?.fullName}
              </p>
              <p>{order.shippingAddress?.phone}</p>
              <p>
                {order.shippingAddress?.street}, {order.shippingAddress?.city}
              </p>
              <p>
                {order.shippingAddress?.district},{" "}
                {order.shippingAddress?.province}
              </p>
            </div>
            {order.trackingNumber && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                  Tracking Number
                </p>
                <p className="font-mono text-sm font-bold">
                  {order.trackingNumber}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: summary + actions */}
        <div className="space-y-5">
          {/* Price summary */}
          <div className="card p-5">
            <h2
              className="font-bold mb-4"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Order Summary
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[var(--color-text-muted)]">
                <span>Subtotal</span>
                <span>{formatPrice(order.itemsPrice)}</span>
              </div>
              <div className="flex justify-between text-[var(--color-text-muted)]">
                <span>Shipping</span>
                <span
                  className={
                    order.shippingPrice === 0
                      ? "text-green-600 font-semibold"
                      : ""
                  }
                >
                  {order.shippingPrice === 0
                    ? "FREE"
                    : formatPrice(order.shippingPrice)}
                </span>
              </div>
              <div className="flex justify-between text-[var(--color-text-muted)]">
                <span>VAT (13%)</span>
                <span>{formatPrice(order.taxPrice)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-[var(--color-border)]">
                <span>Total</span>
                <span className="text-amber-600 dark:text-amber-400">
                  {formatPrice(order.totalPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment info */}
          <div className="card p-5">
            <h2
              className="font-bold mb-3"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Payment
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Method</span>
                <span className="font-semibold uppercase">
                  {order.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Status</span>
                <span
                  className={
                    order.isPaid
                      ? "text-green-600 font-bold"
                      : "text-amber-600 font-bold"
                  }
                >
                  {order.isPaid
                    ? `✓ Paid on ${formatDate(order.paidAt)}`
                    : "⏳ Unpaid"}
                </span>
              </div>
              {order.paymentResult?.transaction_id && (
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-muted)]">Txn ID</span>
                  <span className="font-mono text-xs">
                    {order.paymentResult.transaction_id.slice(-12)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cancel button */}
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-red-600 border-2 border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <HiOutlineXCircle className="w-4 h-4" /> Cancel Order
            </button>
          )}

          <Link
            to="/orders"
            className="btn-secondary w-full text-center text-sm py-2.5"
          >
            ← Back to Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
