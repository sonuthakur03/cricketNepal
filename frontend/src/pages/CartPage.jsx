// src/pages/CartPage.jsx
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineTrash, HiOutlineShoppingBag, HiArrowRight } from 'react-icons/hi'
import useCartStore from '../context/cartStore'
import { formatPrice } from '../utils/helpers'
import { StarRating } from '../components/common/UI'

function CartRow({ item, index }) {
  const { updateQuantity, removeItem } = useCartStore()
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.06 }}
      className="flex gap-4 py-5 border-b border-[var(--color-border)] last:border-0"
    >
      <Link to={`/products/${item.slug || item.product}`}
        className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/products/${item.slug || item.product}`}
          className="font-bold text-sm hover:text-primary-600 transition-colors line-clamp-2"
          style={{ fontFamily: 'Syne, sans-serif' }}>{item.name}</Link>
        {(item.size || item.color) && (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
            {[item.size, item.color].filter(Boolean).join(' · ')}
          </p>
        )}
        <p className="text-primary-600 dark:text-primary-400 font-bold mt-1">{formatPrice(item.price)}</p>
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center border border-[var(--color-border)] rounded-xl overflow-hidden">
            <button onClick={() => updateQuantity(item.product, item.size, item.color, item.quantity - 1)}
              className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors">−</button>
            <span className="px-4 py-1.5 font-semibold border-x border-[var(--color-border)]">{item.quantity}</span>
            <button onClick={() => updateQuantity(item.product, item.size, item.color, item.quantity + 1)}
              disabled={item.quantity >= item.stock}
              className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors disabled:opacity-40">+</button>
          </div>
          <button onClick={() => removeItem(item.product, item.size, item.color)}
            className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded-lg transition-colors">
            <HiOutlineTrash className="w-4 h-4" /> Remove
          </button>
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-bold">{formatPrice(item.price * item.quantity)}</p>
      </div>
    </motion.div>
  )
}

export default function CartPage() {
  const { items, clearCart, getSubtotal, getShipping, getTax, getTotal } = useCartStore()
  const navigate = useNavigate()
  const subtotal = getSubtotal(); const shipping = getShipping(); const tax = getTax(); const total = getTotal()

  if (items.length === 0) return (
    <div className="page-container pt-28 py-20 min-h-screen flex flex-col items-center justify-center gap-5 text-center">
      <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-4xl">🛒</div>
      <h1 className="text-3xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>Your cart is empty</h1>
      <p className="text-[var(--color-text-muted)]">Looks like you haven't added any cricket gear yet.</p>
      <Link to="/products" className="btn-primary px-8">Start Shopping</Link>
    </div>
  )

  return (
    <div className="page-container pt-24 py-12 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>
          Shopping Cart <span className="text-primary-600">({items.length})</span>
        </h1>
        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700 font-medium">Clear Cart</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 card p-5">
          {items.map((item, i) => <CartRow key={`${item.product}-${item.size}-${item.color}`} item={item} index={i} />)}
        </div>

        {/* Summary */}
        <div className="card p-6 h-fit sticky top-24">
          <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'Syne, sans-serif' }}>Order Summary</h2>
          {subtotal < 5000 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mb-4">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Add <strong>{formatPrice(5000 - subtotal)}</strong> more for free shipping!
              </p>
              <div className="mt-1.5 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(subtotal / 5000) * 100}%` }} />
              </div>
            </div>
          )}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-[var(--color-text-muted)]">
              <span>Subtotal ({items.reduce((a, i) => a + i.quantity, 0)} items)</span>
              <span>{formatPrice(subtotal)}</span>
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
            <div className="flex justify-between font-bold text-base pt-3 border-t border-[var(--color-border)]">
              <span>Total</span>
              <span className="text-primary-600 dark:text-primary-400 text-lg">{formatPrice(total)}</span>
            </div>
          </div>
          <button onClick={() => navigate('/checkout')} className="btn-primary w-full mt-5 text-base">
            Proceed to Checkout <HiArrowRight className="w-5 h-5" />
          </button>
          <Link to="/products" className="block text-center text-sm text-[var(--color-text-muted)] mt-3 hover:text-primary-600 transition-colors">
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
