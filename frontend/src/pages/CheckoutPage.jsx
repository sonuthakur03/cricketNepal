// src/pages/CheckoutPage.jsx — Clean, Balanced Multi-Step Checkout with full validation
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { HiOutlineCheckCircle, HiOutlineExclamationCircle } from "react-icons/hi";
import api from "../utils/api";
import StripePayment from "../components/payment/StripePayment";
import useCartStore from "../context/cartStore";
import useAuthStore from "../context/authStore";
import {
  formatPrice,
  NEPAL_PROVINCES,
  NEPAL_CITIES,
  getErrorMessage,
} from "../utils/helpers";
import {
  validateName,
  validatePhone,
  validateRequiredText,
} from "../utils/validators";

const PAYMENT_METHODS = [
  {
    value: "khalti",
    label: "Khalti",
    icon: "🟣",
    desc: "Pay via Khalti digital wallet",
  },
  {
    value: "esewa",
    label: "eSewa",
    icon: "🟢",
    desc: "Pay via eSewa mobile money",
  },
  {
    value: "cod",
    label: "Cash on Delivery",
    icon: "💵",
    desc: "Pay when your order arrives",
  },
  {
    value: "stripe",
    label: "Credit / Debit Card",
    icon: "💳",
    desc: "Visa, Mastercard via Stripe",
  },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getSubtotal, getShipping, getTax, getTotal, clearCart } =
    useCartStore();
  const { user } = useAuthStore();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("khalti");
  const [stripeOrderId, setStripeOrderId] = useState(null);

  const [shipping, setShipping] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    street: user?.address?.street || "",
    city: user?.address?.city || "Kathmandu",
    district: user?.address?.district || "Kathmandu",
    province: user?.address?.province || "Bagmati",
    postalCode: "",
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const subtotal = getSubtotal();
  const shippingCost = getShipping();
  const tax = getTax();
  const total = getTotal();

  const validateField = (field, value) => {
    let err = "";
    if (field === "fullName") {
      const res = validateName(value, "Full Name", 2);
      if (!res.isValid) err = res.error;
    } else if (field === "phone") {
      const res = validatePhone(value, true);
      if (!res.isValid) err = res.error;
    } else if (field === "province") {
      if (!value) err = "Please select your province";
    } else if (field === "city") {
      const res = validateRequiredText(value, "City / Town", 2);
      if (!res.isValid) err = res.error;
    } else if (field === "district") {
      const res = validateRequiredText(value, "District", 2);
      if (!res.isValid) err = res.error;
    } else if (field === "street") {
      const res = validateRequiredText(value, "Street / Tole / Landmark", 3);
      if (!res.isValid) err = res.error;
    }
    setErrors((prev) => ({ ...prev, [field]: err }));
    return !err;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, shipping[field]);
  };

  const handleChange = (field, value) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    if (touched[field] || errors[field]) {
      validateField(field, value);
    }
  };

  const handleContinueToPayment = () => {
    const fieldsToValidate = ["fullName", "phone", "province", "city", "district", "street"];
    const newTouched = {};
    let allValid = true;

    fieldsToValidate.forEach((f) => {
      newTouched[f] = true;
      const ok = validateField(f, shipping[f]);
      if (!ok) allValid = false;
    });

    setTouched(newTouched);

    if (!allValid) {
      toast.error("Please fill in all shipping details correctly");
      return;
    }

    setStep(2);
  };

  if (items.length === 0 && !orderId) {
    return (
      <div className="page-container pt-28 py-20 text-center min-h-screen">
        <div className="text-5xl mb-4">🛒</div>
        <h2
          className="text-2xl font-bold mb-3"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Your cart is empty
        </h2>
        <Link to="/products" className="btn-primary">
          Browse Equipment
        </Link>
      </div>
    );
  }

  const placeOrder = async () => {
    const { data } = await api.post("/orders", {
      orderItems: items.map((i) => ({
        product: i.product,
        quantity: i.quantity,
        size: i.size,
        color: i.color,
      })),
      shippingAddress: shipping,
      paymentMethod,
    });
    return data.data._id;
  };

  // ── Khalti v2 ──
  const handleKhalti = async (newOrderId) => {
    const { data } = await api.post(
      `/orders/${newOrderId}/pay/khalti/initiate`,
    );
    window.location.href = data.data.payment_url;
  };

  // ── eSewa v2 ──
  const handleEsewa = async (newOrderId) => {
    const { data } = await api.post(`/orders/${newOrderId}/pay/esewa/initiate`);
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
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const newOrderId = await placeOrder();
      setOrderId(newOrderId);

      if (paymentMethod === "khalti") {
        await handleKhalti(newOrderId);
        return;
      }

      if (paymentMethod === "esewa") {
        await handleEsewa(newOrderId);
        return;
      }

      if (paymentMethod === "cod") {
        clearCart();
        setStep(3);
        toast.success("Order placed successfully!");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
      setLoading(false);
    }
  };

  // ── Confirmation Screen ──
  if (step === 3) {
    return (
      <div className="page-container pt-28 py-20 min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto card p-8 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/40 text-green-600 flex items-center justify-center mx-auto mb-5">
            <HiOutlineCheckCircle className="w-10 h-10" />
          </div>
          <h2
            className="text-2xl font-bold mb-2 text-slate-900 dark:text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Order Confirmed!
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            Thank you for your order. We're packing your cricket kit now.
            <br />
            Order ID:{" "}
            <strong className="font-mono text-slate-800 dark:text-slate-200">
              #{orderId?.slice(-8).toUpperCase()}
            </strong>
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/orders" className="btn-primary text-xs py-3 px-6">
              Track Order
            </Link>
            <Link to="/products" className="btn-secondary text-xs py-3 px-6">
              Continue Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-container pt-24 py-12 min-h-screen">
      <h1
        className="text-3xl font-bold mb-8 text-slate-900 dark:text-white"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Checkout
      </h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 text-sm font-semibold flex-wrap">
        {["Shipping", "Payment", "Confirm"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step > i + 1
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                  : step === i + 1
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
              }`}
            >
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span
              className={
                step === i + 1
                  ? "text-slate-900 dark:text-white font-bold"
                  : "text-slate-500"
              }
            >
              {s}
            </span>
            {i < 2 && (
              <div
                className={`h-0.5 w-8 ${step > i + 1 ? "bg-slate-400 dark:bg-slate-600" : "bg-slate-200 dark:bg-slate-800"}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Shipping */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card p-6"
            >
              <h2
                className="text-xl font-bold mb-5 text-slate-900 dark:text-white"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Shipping Address
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Full Name *</label>
                  <input
                    className={`input ${touched.fullName && errors.fullName ? "border-red-500 ring-1 ring-red-500/20" : ""}`}
                    value={shipping.fullName}
                    placeholder="Recipient's full name (no numbers)"
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    onBlur={() => handleBlur("fullName")}
                  />
                  <AnimatePresence>
                    {touched.fullName && errors.fullName && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400"
                      >
                        <HiOutlineExclamationCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{errors.fullName}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="label">Phone Number *</label>
                  <input
                    className={`input ${touched.phone && errors.phone ? "border-red-500 ring-1 ring-red-500/20" : ""}`}
                    value={shipping.phone}
                    placeholder="+977 98XXXXXXXX"
                    onChange={(e) => handleChange("phone", e.target.value)}
                    onBlur={() => handleBlur("phone")}
                  />
                  <AnimatePresence>
                    {touched.phone && errors.phone && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400"
                      >
                        <HiOutlineExclamationCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{errors.phone}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="label">Province *</label>
                  <select
                    className={`input ${touched.province && errors.province ? "border-red-500 ring-1 ring-red-500/20" : ""}`}
                    value={shipping.province}
                    onChange={(e) => handleChange("province", e.target.value)}
                    onBlur={() => handleBlur("province")}
                  >
                    <option value="">Select Province</option>
                    {NEPAL_PROVINCES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <AnimatePresence>
                    {touched.province && errors.province && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400"
                      >
                        <HiOutlineExclamationCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{errors.province}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="label">City / Town *</label>
                  <input
                    list="cities-co"
                    className={`input ${touched.city && errors.city ? "border-red-500 ring-1 ring-red-500/20" : ""}`}
                    value={shipping.city}
                    placeholder="e.g. Kathmandu, Pokhara"
                    onChange={(e) => handleChange("city", e.target.value)}
                    onBlur={() => handleBlur("city")}
                  />
                  <datalist id="cities-co">
                    {NEPAL_CITIES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  <AnimatePresence>
                    {touched.city && errors.city && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400"
                      >
                        <HiOutlineExclamationCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{errors.city}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="label">District *</label>
                  <input
                    className={`input ${touched.district && errors.district ? "border-red-500 ring-1 ring-red-500/20" : ""}`}
                    value={shipping.district}
                    placeholder="e.g. Kathmandu, Lalitpur"
                    onChange={(e) => handleChange("district", e.target.value)}
                    onBlur={() => handleBlur("district")}
                  />
                  <AnimatePresence>
                    {touched.district && errors.district && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400"
                      >
                        <HiOutlineExclamationCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{errors.district}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="sm:col-span-2">
                  <label className="label">Street / Tole / Landmark *</label>
                  <input
                    className={`input ${touched.street && errors.street ? "border-red-500 ring-1 ring-red-500/20" : ""}`}
                    value={shipping.street}
                    placeholder="Ward no., Tole, Landmark"
                    onChange={(e) => handleChange("street", e.target.value)}
                    onBlur={() => handleBlur("street")}
                  />
                  <AnimatePresence>
                    {touched.street && errors.street && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400"
                      >
                        <HiOutlineExclamationCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{errors.street}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <button
                type="button"
                onClick={handleContinueToPayment}
                className="btn-primary mt-6 w-full py-3.5"
              >
                Continue to Payment →
              </button>
            </motion.div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card p-6"
            >
              <h2
                className="text-xl font-bold mb-5 text-slate-900 dark:text-white"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Payment Method
              </h2>
              <div className="space-y-3 mb-5">
                {PAYMENT_METHODS.map((pm) => (
                  <label
                    key={pm.value}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                      paymentMethod === pm.value
                        ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800/60"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={pm.value}
                      checked={paymentMethod === pm.value}
                      onChange={() => setPaymentMethod(pm.value)}
                      className="w-4 h-4 accent-slate-900 dark:accent-white"
                    />
                    <span className="text-2xl">{pm.icon}</span>
                    <div>
                      <p
                        className="font-bold text-sm text-slate-900 dark:text-white"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {pm.label}
                      </p>
                      <p className="text-xs text-slate-500">
                        {pm.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {paymentMethod === "khalti" && (
                <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 text-sm mb-4">
                  <p className="font-semibold text-purple-700 dark:text-purple-400 mb-1">
                    Khalti Test Credentials
                  </p>
                  <p className="text-purple-600 dark:text-purple-300 font-mono text-xs">
                    ID: 9800000000 · MPIN: 1111 · OTP: 987654
                  </p>
                </div>
              )}
              {paymentMethod === "esewa" && (
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm mb-4">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    eSewa Test Credentials
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 font-mono text-xs">
                    ID: 9806800001 · Password: Nepal@123 · Token: 123456
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    You will be redirected to eSewa's secure payment page.
                  </p>
                </div>
              )}
              {paymentMethod === "cod" && (
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm mb-4">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    Pay cash when your order is delivered. Available across all provinces of Nepal.
                  </p>
                </div>
              )}

              {/* Stripe inline card form */}
              {paymentMethod === "stripe" && stripeOrderId && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-4">
                  <StripePayment
                    orderId={stripeOrderId}
                    totalNPR={total}
                    onSuccess={() => {
                      clearCart();
                      setStep(3);
                    }}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1 py-3"
                >
                  ← Back
                </button>
                {paymentMethod !== "stripe" && (
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="btn-primary flex-1 py-3"
                  >
                    {loading
                      ? "Processing..."
                      : paymentMethod === "cod"
                        ? "Place Order"
                        : `Pay ${formatPrice(total)}`}
                  </button>
                )}
                {paymentMethod === "stripe" && !stripeOrderId && (
                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const newOrderId = await placeOrder();
                        setStripeOrderId(newOrderId);
                      } catch (err) {
                        toast.error(getErrorMessage(err));
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                    className="btn-primary flex-1 py-3"
                  >
                    {loading ? "Processing..." : "Enter Card Details →"}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Order summary */}
        <div className="card p-5 h-fit sticky top-24">
          <h3
            className="font-bold mb-4 text-slate-900 dark:text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Order Summary
          </h3>
          <div className="space-y-3 mb-4 max-h-56 overflow-y-auto">
            {items.map((item) => (
              <div
                key={`${item.product}-${item.size}-${item.color}`}
                className="flex gap-3 items-center"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold line-clamp-1 text-slate-800 dark:text-slate-200">
                    {item.name}
                  </p>
                  {item.size && (
                    <p className="text-xs text-slate-500">
                      Size: {item.size}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 font-semibold">Qty: {item.quantity}</p>
                </div>
                <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex justify-between text-slate-500 text-xs">
              <span>Subtotal</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-xs">
              <span>Shipping</span>
              <span
                className="font-mono text-slate-700 dark:text-slate-300 font-semibold"
              >
                {shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 text-xs">
              <span>VAT (13%)</span>
              <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{formatPrice(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-3 border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
              <span>Total</span>
              <span className="font-mono">
                {formatPrice(total)}
              </span>
            </div>
          </div>
          {step === 2 && shipping.fullName && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wide">
                Delivering to
              </p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{shipping.fullName}</p>
              <p className="text-xs text-slate-500">
                {shipping.street}, {shipping.city}, {shipping.district}
              </p>
              <p className="text-xs text-slate-500">
                {shipping.phone}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
