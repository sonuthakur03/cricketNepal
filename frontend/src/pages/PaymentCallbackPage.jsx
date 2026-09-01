// src/pages/PaymentCallbackPage.jsx

import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineCheckCircle, HiOutlineXCircle } from "react-icons/hi";
import api from "../utils/api";
import useCartStore from "../context/cartStore";
import { getErrorMessage } from "../utils/helpers";

// ── Shared success/error UI ───────────────────────────────────────────────────
function ResultScreen({ status, title, message, countdown }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center max-w-sm"
      >
        {status === "verifying" && (
          <>
            <div
              className="w-16 h-16 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"
              style={{ borderWidth: 4 }}
            />
            <h2
              className="text-xl font-bold"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Verifying Payment…
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-2">
              Please wait — do not close this tab.
            </p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineCheckCircle className="w-9 h-9 text-green-600" />
            </div>
            <h2
              className="text-2xl font-black mb-2"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              {title} 🎉
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-1">
              {message}
            </p>
            {countdown > 0 && (
              <p className="text-xs text-[var(--color-text-muted)] mb-4">
                Redirecting in {countdown}s…
              </p>
            )}
            <Link to="/orders" className="btn-primary inline-block">
              View My Orders
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineXCircle className="w-9 h-9 text-red-500" />
            </div>
            <h2
              className="text-2xl font-black mb-2 text-red-600"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              {title}
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-5">
              {message}
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/orders" className="btn-secondary">
                My Orders
              </Link>
              <Link to="/products" className="btn-primary">
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ── Khalti callback ───────────────────────────────────────────────────────────
// Khalti v2 redirects to: /payment/khalti/callback?pidx=...&orderId=...&status=Completed
export function KhaltiCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const clearCart = useCartStore((s) => s.clearCart);
  const [status, setStatus] = useState("verifying");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const pidx = searchParams.get("pidx");
    const orderId =
      searchParams.get("purchase_order_id") || searchParams.get("orderId");
    const txStatus = searchParams.get("status"); // 'Completed' or 'User canceled'

    if (!pidx || !orderId) {
      setStatus("error");
      setTitle("Missing Parameters");
      setMessage(
        "Khalti did not return the expected parameters. Check your order status in My Orders.",
      );
      return;
    }

    if (txStatus === "User canceled" || txStatus === "Cancelled") {
      setStatus("error");
      setTitle("Payment Cancelled");
      setMessage(
        "You cancelled the Khalti payment. Your order is saved — retry payment from My Orders.",
      );
      return;
    }

    // Verify with backend
    api
      .post(`/orders/${orderId}/pay/khalti/verify`, { pidx })
      .then(() => {
        clearCart();
        setStatus("success");
        setTitle("Payment Successful!");
        setMessage("Your Khalti payment has been verified.");
        setCountdown(4);
      })
      .catch((err) => {
        setStatus("error");
        setTitle("Verification Failed");
        setMessage(
          getErrorMessage(err) +
            ". Your order is saved — retry from My Orders.",
        );
      });
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    if (countdown === 1) {
      navigate("/orders");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  return (
    <ResultScreen
      status={status}
      title={title}
      message={message}
      countdown={countdown}
    />
  );
}

// ── eSewa success callback ────────────────────────────────────────────────────
// eSewa v2 redirects to: /payment/esewa/success?orderId=xxx&data=BASE64_JSON
export function EsewaSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const clearCart = useCartStore((s) => s.clearCart);
  const [status, setStatus] = useState("verifying");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    // eSewa redirects to /payment/esewa/success?data=BASE64
    const encodedData = searchParams.get("data");

    console.log("[eSewa callback] URL:", window.location.href);
    console.log("[eSewa callback] data param present:", !!encodedData);

    if (!encodedData) {
      setStatus("error");
      setTitle("Missing Payment Data");
      setMessage(
        "eSewa did not return payment data. Your order is saved — retry from My Orders.",
      );
      return;
    }

    // Decode base64 to get transaction_uuid which is "orderId-timestamp"
    let orderId;
    try {
      const decoded = JSON.parse(atob(encodedData));
      console.log("[eSewa callback] decoded payload:", decoded);
      // transaction_uuid format: "64abc123def456-1717000000000"
      // Extract the MongoDB ObjectId (24 hex chars) from the start
      const uuid = decoded.transaction_uuid || "";
      // MongoDB ObjectId is exactly 24 hex characters
      const match = uuid.match(/^([a-f0-9]{24})/);
      orderId = match ? match[1] : uuid.split("-")[0];
      console.log("[eSewa callback] extracted orderId:", orderId);
    } catch (e) {
      console.error("[eSewa callback] decode error:", e);
      setStatus("error");
      setTitle("Invalid Payment Data");
      setMessage("Could not read eSewa response. Please check My Orders.");
      return;
    }

    if (!orderId || orderId.length < 24) {
      setStatus("error");
      setTitle("Missing Order Reference");
      setMessage("Could not identify your order. Please check My Orders.");
      return;
    }

    api
      .post(`/esewa/verify/${orderId}`, { encodedData })
      .then(() => {
        clearCart();
        setStatus("success");
        setTitle("Payment Successful!");
        setMessage("Your eSewa payment has been verified.");
        setCountdown(4);
      })
      .catch((err) => {
        setStatus("error");
        setTitle("Verification Failed");
        setMessage(getErrorMessage(err));
      });
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    if (countdown === 1) {
      navigate("/orders");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  return (
    <ResultScreen
      status={status}
      title={title}
      message={message}
      countdown={countdown}
    />
  );
}

// ── eSewa failure ─────────────────────────────────────────────────────────────
export function EsewaFailurePage() {
  const [searchParams] = useSearchParams();
  useEffect(() => {
    // Try to get orderId from URL or from encoded data
    const orderId = searchParams.get("orderId");
    const encodedData = searchParams.get("data");
    let resolvedId = orderId;

    if (!resolvedId && encodedData) {
      try {
        const decoded = JSON.parse(atob(encodedData));
        const uuid = decoded.transaction_uuid || "";
        const match = uuid.match(/^([a-f0-9]{24})/);
        resolvedId = match ? match[1] : null;
      } catch {}
    }
    if (resolvedId) api.post(`/esewa/failure/${resolvedId}`).catch(() => {});
  }, []);
  return (
    <ResultScreen
      status="error"
      title="eSewa Payment Cancelled"
      message="Your payment was not completed. Your order is saved — you can retry from My Orders."
    />
  );
}

// ── 404 ───────────────────────────────────────────────────────────────────────
export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="text-8xl mb-4">🏏</div>
        <h1
          className="text-6xl font-black text-amber-500 mb-2"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          404
        </h1>
        <h2
          className="text-2xl font-bold mb-3"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Page Not Found
        </h2>
        <p className="text-[var(--color-text-muted)] mb-8 max-w-sm mx-auto">
          Looks like this page is out for six.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="btn-primary">
            Go Home
          </Link>
          <Link to="/products" className="btn-secondary">
            Browse Products
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
