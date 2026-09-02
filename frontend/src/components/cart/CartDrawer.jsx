// src/components/cart/CartDrawer.jsx — Clean, Solid E-Commerce Cart Drawer
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
    <div className="flex items-center gap-4 py-4 border-b border-slate-200 dark:border-slate-800 last:border-0">
      {/* Image */}
      <Link
        to={`/products/${item.slug || item.product}`}
        className="flex-shrink-0"
      >
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/products/${item.slug || item.product}`}
          className="text-sm font-bold leading-snug line-clamp-1 hover:text-green-600 transition-colors"
        >
          {item.name}
        </Link>
        {(item.size || item.color) && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            {[item.size, item.color].filter(Boolean).join(" · ")}
          </p>
        )}
        <p className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
          {formatPrice(item.price)} each
        </p>
      </div>

      {/* Qty controls */}
      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex-shrink-0 bg-slate-50 dark:bg-slate-800">
        <button
          onClick={() =>
            updateQuantity(
              item.product,
              item.size,
              item.color,
              item.quantity - 1,
            )
          }
          className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
        >
          <HiMinus className="w-3 h-3" />
        </button>
        <span className="w-6 text-center text-xs font-bold">
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
          className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300 disabled:opacity-30"
        >
          <HiPlus className="w-3 h-3" />
        </button>
      </div>

      {/* Subtotal + remove */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-sm font-bold font-mono text-green-600 dark:text-green-400">
          {formatPrice(item.price * item.quantity)}
        </span>
        <button
          onClick={() => removeItem(item.product, item.size, item.color)}
          className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
          title="Remove item"
        >
          <HiOutlineTrash className="w-4 h-4" />
        </button>
      </div>
    </div>
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
          {/* Solid Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={closeCart}
          />

          {/* Solid Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed right-0 top-0 h-full w-full max-w-[400px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2.5">
                <HiOutlineShoppingBag className="w-5 h-5 text-green-600" />
                <div>
                  <h2 className="font-bold text-base text-slate-900 dark:text-white" style={{ fontFamily: "var(--font-heading)" }}>
                    Shopping Cart
                  </h2>
                  {items.length > 0 && (
                    <p className="text-xs text-slate-500">
                      {items.reduce((a, i) => a + i.quantity, 0)} item
                      {items.reduce((a, i) => a + i.quantity, 0) !== 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs text-slate-400 hover:text-red-500 font-semibold transition-colors px-2 py-1"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={closeCart}
                  className="w-8 h-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center transition-colors text-slate-500"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto px-5">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <HiOutlineShoppingBag className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-base mb-1" style={{ fontFamily: "var(--font-heading)" }}>
                      Your cart is empty
                    </p>
                    <p className="text-xs text-slate-500">
                      Add cricket gear to your kit to get started
                    </p>
                  </div>
                  <Link
                    to="/products"
                    onClick={closeCart}
                    className="btn-primary text-xs px-6 py-2.5"
                  >
                    Browse Equipment
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((item, i) => (
                    <CartRow
                      key={`${item.product}-${item.size}-${item.color}-${i}`}
                      item={item}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-800 px-5 py-4 space-y-3 bg-slate-50 dark:bg-slate-900/50">
                {/* Free shipping progress */}
                {subtotal < 5000 ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">
                        Add <strong className="text-slate-800 dark:text-slate-200">{formatPrice(5000 - subtotal)}</strong> for free shipping
                      </span>
                      <span className="text-green-600 font-bold">
                        {Math.round((subtotal / 5000) * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((subtotal / 5000) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 font-bold">
                    <span>✓</span> Free shipping unlocked across Nepal!
                  </div>
                )}

                {/* Price summary */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Subtotal</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Shipping</span>
                    <span className={`font-mono font-semibold ${shipping === 0 ? "text-green-600" : "text-slate-700 dark:text-slate-300"}`}>
                      {shipping === 0 ? "FREE" : formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>VAT (13%)</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span>Total</span>
                    <span className="font-mono text-green-600 text-base">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  onClick={closeCart}
                  className="btn-primary w-full justify-center text-sm py-3"
                >
                  Proceed to Checkout · {formatPrice(total)}
                </Link>
                <Link
                  to="/cart"
                  onClick={closeCart}
                  className="block text-center text-xs text-slate-500 hover:text-green-600 font-semibold transition-colors"
                >
                  View full cart page →
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
