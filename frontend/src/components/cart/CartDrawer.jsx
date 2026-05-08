// src/components/cart/CartDrawer.jsx
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineX,
  HiOutlineTrash,
  HiOutlineShoppingBag,
  HiMinus,
  HiPlus,
} from "react-icons/hi";
import useCartStore from "../../context/cartStore";
import { formatPrice } from "../../utils/helpers";

function CartRow({ item }) {
  const { updateQuantity, removeItem } = useCartStore();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-4 py-4 border-b border-[var(--color-border)] last:border-0 group"
    >
      {/* Image */}
      <Link
        to={`/products/${item.slug || item.product}`}
        className="flex-shrink-0"
      >
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface-100 dark:bg-surface-800">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>

      {/* Info — takes remaining space */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/products/${item.slug || item.product}`}
          className="text-sm font-semibold leading-snug line-clamp-1 hover:text-gold-500 transition-colors"
        >
          {item.name}
        </Link>
        {(item.size || item.color) && (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5 font-medium">
            {[item.size, item.color].filter(Boolean).join(" · ")}
          </p>
        )}
        <p className="text-xs font-mono font-semibold text-[var(--color-text-muted)] mt-0.5">
          {formatPrice(item.price)} each
        </p>
      </div>

      {/* Qty controls — compact inline */}
      <div className="flex items-center gap-0 bg-surface-100 dark:bg-surface-800 rounded-xl overflow-hidden flex-shrink-0">
        <button
          onClick={() =>
            updateQuantity(
              item.product,
              item.size,
              item.color,
              item.quantity - 1,
            )
          }
          className="w-8 h-8 flex items-center justify-center hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
        >
          <HiMinus className="w-3 h-3" />
        </button>
        <span className="w-7 text-center text-sm font-bold">
          {item.quantity}
        </span>
        <button
          onClick={() =>
            updateQuantity(
              item.product,
              item.size,
              item.color,
              item.quantity + 1,
            )
          }
          disabled={item.quantity >= item.stock}
          className="w-8 h-8 flex items-center justify-center hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30"
        >
          <HiPlus className="w-3 h-3" />
        </button>
      </div>

      {/* Subtotal + remove */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-sm font-bold font-mono">
          {formatPrice(item.price * item.quantity)}
        </span>
        <button
          onClick={() => removeItem(item.product, item.size, item.color)}
          className="text-surface-400 hover:text-red-500 transition-colors p-0.5"
        >
          <HiOutlineTrash className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    clearCart,
    getSubtotal,
    getShipping,
    getTax,
    getTotal,
  } = useCartStore();

  const subtotal = getSubtotal();
  const shipping = getShipping();
  const tax = getTax();
  const total = getTotal();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-pitch-950/60 backdrop-blur-sm z-50"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-[var(--color-bg)] z-50 flex flex-col shadow-premium"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gold-400/10 flex items-center justify-center">
                  <HiOutlineShoppingBag className="w-4 h-4 text-gold-500" />
                </div>
                <div>
                  <h2
                    className="font-bold text-base"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Your Cart
                  </h2>
                  {items.length > 0 && (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {items.reduce((a, i) => a + i.quantity, 0)} item
                      {items.reduce((a, i) => a + i.quantity, 0) !== 1
                        ? "s"
                        : ""}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-[var(--color-text-muted)] hover:text-red-500 font-medium transition-colors px-2 py-1"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={closeCart}
                  className="w-8 h-8 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 flex items-center justify-center transition-colors"
                >
                  <HiOutlineX className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto px-6 custom-scrollbar">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-5 text-center py-12">
                  <div className="w-20 h-20 rounded-3xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                    <HiOutlineShoppingBag className="w-9 h-9 text-[var(--color-text-muted)]" />
                  </div>
                  <div>
                    <p
                      className="font-bold text-base mb-1"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      Your cart is empty
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Add some cricket gear to get started
                    </p>
                  </div>
                  <Link
                    to="/products"
                    onClick={closeCart}
                    className="btn-primary"
                  >
                    Browse Products
                  </Link>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {items.map((item, i) => (
                    <CartRow
                      key={`${item.product}-${item.size}-${item.color}-${i}`}
                      item={item}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer — totals + CTA */}
            {items.length > 0 && (
              <div className="border-t border-[var(--color-border)] px-6 py-5 space-y-4 bg-[var(--color-bg-card)]">
                {/* Free shipping progress */}
                {subtotal < 5000 ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--color-text-muted)]">
                        Add{" "}
                        <strong className="text-[var(--color-text)]">
                          {formatPrice(5000 - subtotal)}
                        </strong>{" "}
                        for free shipping
                      </span>
                      <span className="text-gold-500 font-semibold">
                        {Math.round((subtotal / 5000) * 100)}%
                      </span>
                    </div>
                    <div className="h-1 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gold-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min((subtotal / 5000) * 100, 100)}%`,
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[10px]">
                      ✓
                    </span>
                    Free shipping unlocked!
                  </div>
                )}

                {/* Price summary */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-[var(--color-text-muted)]">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-[var(--color-text-muted)]">
                    <span>Shipping</span>
                    <span
                      className={`font-mono font-semibold ${shipping === 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}
                    >
                      {shipping === 0 ? "Free" : formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-[var(--color-text-muted)]">
                    <span>VAT (13%)</span>
                    <span className="font-mono">{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-[var(--color-border)]">
                    <span style={{ fontFamily: "var(--font-display)" }}>
                      Total
                    </span>
                    <span className="font-mono text-gold-500 text-lg">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  onClick={closeCart}
                  className="btn-primary w-full justify-center text-sm py-3.5"
                >
                  Checkout · {formatPrice(total)}
                </Link>
                <Link
                  to="/cart"
                  onClick={closeCart}
                  className="block text-center text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors py-1"
                >
                  View full cart →
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
