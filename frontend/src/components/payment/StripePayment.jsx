// src/components/payment/StripePayment.jsx
// Stripe card payment — no merchant account needed
// Test card: 4242 4242 4242 4242 | any future date | any CVC

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { HiOutlineLockClosed, HiOutlineCreditCard } from "react-icons/hi";
import api from "../../utils/api";
import { formatPrice, getErrorMessage } from "../../utils/helpers";

const loadStripeJs = () =>
  new Promise((resolve, reject) => {
    if (window.Stripe) return resolve(window.Stripe);
    const s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/";
    s.onload = () => resolve(window.Stripe);
    s.onerror = reject;
    document.head.appendChild(s);
  });

export default function StripePayment({ orderId, totalNPR, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [clientSecret, setCS] = useState("");
  const [piId, setPiId] = useState("");
  const [cardError, setCardError] = useState("");
  const [cardComplete, setComplete] = useState(false);
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);
  const cardRef = useRef(null);
  const initDone = useRef(false);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    (async () => {
      try {
        const { data } = await api.post(`/stripe/create-intent/${orderId}`);
        setCS(data.data.clientSecret);
        setPiId(data.data.paymentIntentId);

        const Stripe = await loadStripeJs();
        const key =
          import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder";
        stripeRef.current = Stripe(key);
        elementsRef.current = stripeRef.current.elements();

        const isDark = document.documentElement.classList.contains("dark");
        cardRef.current = elementsRef.current.create("card", {
          hidePostalCode: true,
          style: {
            base: {
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              fontSize: "15px",
              color: isDark ? "#f4f4f0" : "#1a1a16",
              "::placeholder": { color: "#8f8f85" },
            },
            invalid: { color: "#ef4444" },
          },
        });
        cardRef.current.mount("#stripe-card-el");
        cardRef.current.on("change", (e) => {
          setCardError(e.error?.message || "");
          setComplete(e.complete);
        });
        setReady(true);
      } catch (err) {
        toast.error("Could not load payment form: " + getErrorMessage(err));
      }
    })();
    return () => {
      if (cardRef.current) cardRef.current.destroy();
    };
  }, [orderId]);

  const handlePay = async () => {
    if (!cardComplete) {
      setCardError("Please enter complete card details");
      return;
    }
    setLoading(true);
    try {
      const { error, paymentIntent } =
        await stripeRef.current.confirmCardPayment(clientSecret, {
          payment_method: { card: cardRef.current },
        });
      if (error) {
        setCardError(error.message);
        return;
      }
      if (paymentIntent.status === "succeeded") {
        await api.post(`/stripe/confirm/${orderId}`, {
          paymentIntentId: paymentIntent.id,
        });
        toast.success("Payment successful! 🎉");
        onSuccess();
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label flex items-center gap-1.5">
          <HiOutlineCreditCard className="w-3.5 h-3.5" /> Card Details
        </label>
        <div className="relative">
          <div
            id="stripe-card-el"
            className={`input py-4 ${ready ? "" : "invisible"}`}
          />
          {!ready && (
            <div className="skeleton h-12 rounded-xl absolute inset-0" />
          )}
        </div>
        {cardError && (
          <p className="text-xs text-red-500 mt-1.5">⚠ {cardError}</p>
        )}
      </div>

      {/* Test hints */}
      <div className="rounded-xl bg-surface-50 dark:bg-surface-800/50 p-3 text-xs space-y-1.5">
        <p className="font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Test Cards
        </p>
        <div className="font-mono text-[var(--color-text-muted)] grid grid-cols-2 gap-x-4 gap-y-1">
          <span className="text-emerald-600 dark:text-emerald-400">
            ✓ Success
          </span>
          <span>4242 4242 4242 4242</span>
          <span className="text-red-500">✗ Decline</span>
          <span>4000 0000 0000 0002</span>
          <span>Expiry / CVC</span>
          <span>Any future / any 3 digits</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--color-text-muted)] mb-0.5">
            Total amount
          </p>
          <p className="font-bold font-mono text-xl text-gold-500">
            {formatPrice(totalNPR)}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Charged in USD via Stripe
          </p>
        </div>
        <button
          onClick={handlePay}
          disabled={loading || !ready || !cardComplete}
          className="btn-primary gap-2"
        >
          <HiOutlineLockClosed className="w-4 h-4" />
          {loading ? "Processing…" : "Pay Now"}
        </button>
      </div>

      <p className="text-center text-xs text-[var(--color-text-muted)] flex items-center justify-center gap-1">
        <HiOutlineLockClosed className="w-3 h-3" />
        Secured by <strong className="mx-0.5">Stripe</strong> · Card details
        never stored
      </p>
    </div>
  );
}
