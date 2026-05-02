// src/components/cart/CartDrawer.jsx
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineX, HiOutlineTrash, HiOutlineShoppingBag } from 'react-icons/hi'
import useCartStore from '../../context/cartStore'
import { formatPrice } from '../../utils/helpers'

function CartItem({ item }) {
  const { updateQuantity, removeItem } = useCartStore()

  return (
    <div className="flex gap-3 py-3 border-b border-[var(--color-border)] last:border-0">
      <Link to={`/products/${item.slug || item.product}`} className="flex-shrink-0">
        <img src={item.image} alt={item.name}
          className="w-16 h-16 rounded-xl object-cover bg-slate-100 dark:bg-slate-800" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/products/${item.slug || item.product}`}
          className="font-semibold text-sm leading-tight hover:text-primary-600 transition-colors line-clamp-2"
          style={{ fontFamily: 'Syne, sans-serif' }}>
          {item.name}
        </Link>
        {(item.size || item.color) && (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {[item.size, item.color].filter(Boolean).join(' · ')}
          </p>
        )}
        <p className="text-primary-600 dark:text-primary-400 font-bold text-sm mt-1">
          {formatPrice(item.price)}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center border border-[var(--color-border)] rounded-lg overflow-hidden">
            <button
              onClick={() => updateQuantity(item.product, item.size, item.color, item.quantity - 1)}
              className="px-2.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-bold">
              −
            </button>
            <span className="px-3 py-1 text-sm font-semibold border-x border-[var(--color-border)]">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.product, item.size, item.color, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
              className="px-2.5 py-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-bold disabled:opacity-40">
              +
            </button>
          </div>
          <button
            onClick={() => removeItem(item.product, item.size, item.color)}
            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold text-sm">{formatPrice(item.price * item.quantity)}</p>
      </div>
    </div>
  )
}

export default function CartDrawer() {
  const { items, isOpen, closeCart, clearCart, getSubtotal, getShipping, getTax, getTotal } = useCartStore()
  const subtotal = getSubtotal()
  const shipping = getShipping()
  const tax = getTax()
  const total = getTotal()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={closeCart}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--color-bg)] shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <h2 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
                Your Cart
                {items.length > 0 && (
                  <span className="ml-2 badge-green">{items.length} items</span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button onClick={clearCart}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    Clear all
                  </button>
                )}
                <button onClick={closeCart} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <HiOutlineX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 custom-scrollbar">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <HiOutlineShoppingBag className="w-10 h-10 text-[var(--color-text-muted)]" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>Your cart is empty</p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">Add some cricket gear to get started!</p>
                  </div>
                  <Link to="/products" onClick={closeCart} className="btn-primary">
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div className="py-2">
                  {items.map((item, i) => (
                    <CartItem key={`${item.product}-${item.size}-${item.color}-${i}`} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* Totals + Checkout */}
            {items.length > 0 && (
              <div className="border-t border-[var(--color-border)] px-5 py-4 space-y-3">
                {/* Free shipping progress */}
                {subtotal < 5000 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Add <strong>{formatPrice(5000 - subtotal)}</strong> more for free shipping! 🚚
                    </p>
                    <div className="mt-1.5 h-1.5 bg-amber-200 dark:bg-amber-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${Math.min((subtotal / 5000) * 100, 100)}%` }} />
                    </div>
                  </div>
                )}
                {subtotal >= 5000 && (
                  <div className="badge-green w-full text-center py-2 rounded-xl">
                    🎉 You've unlocked free shipping!
                  </div>
                )}

                {/* Price breakdown */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-[var(--color-text-muted)]">
                    <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-[var(--color-text-muted)]">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-primary-600 font-semibold' : ''}>
                      {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[var(--color-text-muted)]">
                    <span>VAT (13%)</span><span>{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-[var(--color-border)]">
                    <span>Total</span><span className="text-primary-600 dark:text-primary-400">{formatPrice(total)}</span>
                  </div>
                </div>

                <Link to="/checkout" onClick={closeCart} className="btn-primary w-full text-center">
                  Proceed to Checkout →
                </Link>
                <Link to="/cart" onClick={closeCart}
                  className="btn-secondary w-full text-center text-sm py-2.5">
                  View Full Cart
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
