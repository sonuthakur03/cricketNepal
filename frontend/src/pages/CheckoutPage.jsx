// src/pages/CheckoutPage.jsx
// Multi-step checkout: Shipping → Payment → Confirm
// Supports Khalti, eSewa v2 (HMAC signed), and Cash on Delivery

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { HiOutlineCheckCircle } from 'react-icons/hi'
import api from '../utils/api'
import useCartStore from '../context/cartStore'
import useAuthStore from '../context/authStore'
import { formatPrice, NEPAL_PROVINCES, NEPAL_CITIES, getErrorMessage } from '../utils/helpers'

const PAYMENT_METHODS = [
  { value: 'khalti', label: 'Khalti',           icon: '🟣', desc: 'Pay via Khalti digital wallet' },
  { value: 'esewa',  label: 'eSewa',            icon: '🟢', desc: 'Pay via eSewa mobile money' },
  { value: 'cod',    label: 'Cash on Delivery', icon: '💵', desc: 'Pay when your order arrives' },
]

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, getSubtotal, getShipping, getTax, getTotal, clearCart } = useCartStore()
  const { user } = useAuthStore()

  const [step, setStep]             = useState(1)
  const [loading, setLoading]       = useState(false)
  const [orderId, setOrderId]       = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('khalti')

  const [shipping, setShipping] = useState({
    fullName: user?.name || '', phone: user?.phone || '',
    street: user?.address?.street || '', city: user?.address?.city || 'Kathmandu',
    district: user?.address?.district || '', province: user?.address?.province || 'Bagmati',
    postalCode: '',
  })

  const subtotal = getSubtotal(); const shippingCost = getShipping()
  const tax = getTax();           const total = getTotal()

  if (items.length === 0 && !orderId) {
    return (
      <div className="page-container pt-28 py-20 text-center min-h-screen">
        <div className="text-5xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Your cart is empty</h2>
        <Link to="/products" className="btn-primary">Shop Now</Link>
      </div>
    )
  }

  const placeOrder = async () => {
    const { data } = await api.post('/orders', {
      orderItems: items.map((i) => ({ product: i.product, quantity: i.quantity, size: i.size, color: i.color })),
      shippingAddress: shipping,
      paymentMethod,
    })
    return data.data._id
  }

  // ── Khalti ──────────────────────────────────────────────────────────────────
  const handleKhalti = async (newOrderId) => {
    let KhaltiCheckout
    try { KhaltiCheckout = (await import('khalti-checkout-web')).default }
    catch { toast.error('Run: npm install khalti-checkout-web'); return }

    new KhaltiCheckout({
      publicKey: import.meta.env.VITE_KHALTI_PUBLIC_KEY || 'test_public_key_dc74e0fd57cb46cd93832aee0a390234',
      productIdentity: newOrderId,
      productName: 'CricketNepal Order',
      productUrl: window.location.origin,
      paymentPreference: ['KHALTI', 'EBANKING', 'MOBILE_BANKING', 'CONNECT_IPS', 'SCT'],
      eventHandler: {
        onSuccess: async (payload) => {
          try {
            await api.post(`/orders/${newOrderId}/pay/khalti`, { token: payload.token, amount: payload.amount })
            clearCart(); setStep(3)
            toast.success('Payment successful! 🎉')
          } catch (err) { toast.error('Khalti verification failed: ' + getErrorMessage(err)) }
        },
        onError: () => toast.error('Khalti payment failed.'),
        onClose: () => toast('Payment window closed.'),
      },
    }).show({ amount: total * 100 })
  }

  // ── eSewa v2 (server-side HMAC signature) ───────────────────────────────────
  const handleEsewa = async (newOrderId) => {
    // Ask backend for signed form fields
    const { data } = await api.post(`/esewa/initiate/${newOrderId}`)
    const p = data.data

    const form = document.createElement('form')
    form.method = 'POST'
    form.action = p.payment_url

    const fields = {
      amount: p.amount, tax_amount: p.tax_amount,
      product_service_charge: p.product_service_charge,
      product_delivery_charge: p.product_delivery_charge,
      total_amount: p.total_amount, transaction_uuid: p.transaction_uuid,
      product_code: p.product_code, success_url: p.success_url,
      failure_url: p.failure_url, signed_field_names: p.signed_field_names,
      signature: p.signature,
    }
    Object.entries(fields).forEach(([k, v]) => {
      const inp = document.createElement('input')
      inp.type = 'hidden'; inp.name = k; inp.value = v
      form.appendChild(inp)
    })
    document.body.appendChild(form)
    form.submit()
  }

  // ── Main handler ────────────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setLoading(true)
    try {
      const newOrderId = await placeOrder()
      setOrderId(newOrderId)
      if (paymentMethod === 'cod') { clearCart(); setStep(3); toast.success('Order placed! 🎉'); return }
      if (paymentMethod === 'khalti') { await handleKhalti(newOrderId); return }
      if (paymentMethod === 'esewa')  { await handleEsewa(newOrderId);  return }
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally { setLoading(false) }
  }

  if (step === 3) {
    return (
      <div className="page-container pt-28 py-20 min-h-screen flex items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center mx-auto mb-5">
            <HiOutlineCheckCircle className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-3xl font-black mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Order Placed! 🏏</h1>
          <p className="text-[var(--color-text-muted)] mb-6">
            Order ID: <strong className="font-mono text-sm">#{orderId?.slice(-8).toUpperCase()}</strong>
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/orders" className="btn-primary">Track Order</Link>
            <Link to="/products" className="btn-secondary">Continue Shopping</Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="page-container pt-24 py-12 min-h-screen">
      <h1 className="text-3xl font-black mb-8" style={{ fontFamily: 'Syne, sans-serif' }}>Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8 text-sm font-semibold flex-wrap">
        {['Shipping', 'Payment', 'Confirm'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step > i+1 ? 'bg-primary-600 text-white' :
              step === i+1 ? 'bg-primary-600 text-white ring-4 ring-primary-200 dark:ring-primary-900' :
              'bg-slate-200 dark:bg-slate-700 text-[var(--color-text-muted)]'}`}>
              {step > i+1 ? '✓' : i+1}
            </div>
            <span className={step === i+1 ? 'text-primary-600' : 'text-[var(--color-text-muted)]'}>{s}</span>
            {i < 2 && <div className={`h-0.5 w-8 ${step > i+1 ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-700'}`} />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* Step 1: Shipping */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
              <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'Syne, sans-serif' }}>Shipping Address</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Full Name *</label>
                  <input className="input" value={shipping.fullName} required onChange={(e) => setShipping({...shipping, fullName: e.target.value})} />
                </div>
                <div>
                  <label className="label">Phone *</label>
                  <input className="input" value={shipping.phone} placeholder="+977 98XXXXXXXX" onChange={(e) => setShipping({...shipping, phone: e.target.value})} />
                </div>
                <div>
                  <label className="label">Province *</label>
                  <select className="input" value={shipping.province} onChange={(e) => setShipping({...shipping, province: e.target.value})}>
                    {NEPAL_PROVINCES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">City *</label>
                  <input list="cities-co" className="input" value={shipping.city} onChange={(e) => setShipping({...shipping, city: e.target.value})} />
                  <datalist id="cities-co">{NEPAL_CITIES.map((c) => <option key={c} value={c} />)}</datalist>
                </div>
                <div>
                  <label className="label">District *</label>
                  <input className="input" value={shipping.district} onChange={(e) => setShipping({...shipping, district: e.target.value})} />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Street / Tole *</label>
                  <input className="input" value={shipping.street} placeholder="Ward no., Tole, Landmark" onChange={(e) => setShipping({...shipping, street: e.target.value})} />
                </div>
              </div>
              <button onClick={() => {
                if (!shipping.fullName || !shipping.phone || !shipping.street || !shipping.city || !shipping.district)
                  { toast.error('Please fill all required fields'); return }
                setStep(2)
              }} className="btn-primary mt-6 w-full">Continue to Payment →</button>
            </motion.div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6">
              <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'Syne, sans-serif' }}>Payment Method</h2>
              <div className="space-y-3 mb-5">
                {PAYMENT_METHODS.map((pm) => (
                  <label key={pm.value} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === pm.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-[var(--color-border)] hover:border-primary-400'}`}>
                    <input type="radio" name="payment" value={pm.value} checked={paymentMethod === pm.value}
                      onChange={() => setPaymentMethod(pm.value)} className="w-4 h-4 accent-primary-600" />
                    <span className="text-2xl">{pm.icon}</span>
                    <div>
                      <p className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{pm.label}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{pm.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {paymentMethod === 'khalti' && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 text-sm mb-4">
                  <p className="font-semibold text-purple-700 dark:text-purple-400 mb-1">Khalti Test Credentials</p>
                  <p className="text-purple-600 dark:text-purple-300 font-mono text-xs">ID: 9800000000 · MPIN: 1111 · OTP: 987654</p>
                </div>
              )}
              {paymentMethod === 'esewa' && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-sm mb-4">
                  <p className="font-semibold text-green-700 dark:text-green-400 mb-1">eSewa Test Credentials</p>
                  <p className="text-green-600 dark:text-green-300 font-mono text-xs">ID: 9806800001 · Password: Nepal@123 · Token: 123456</p>
                  <p className="text-green-600 dark:text-green-300 text-xs mt-1">You will be redirected to eSewa's secure payment page.</p>
                </div>
              )}
              {paymentMethod === 'cod' && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm mb-4">
                  <p className="font-semibold text-amber-700 dark:text-amber-400">Pay cash when your order is delivered. Available across all provinces of Nepal.</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
                <button onClick={handlePlaceOrder} disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Processing...' : paymentMethod === 'cod' ? 'Place Order' : `Pay ${formatPrice(total)}`}
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Order summary */}
        <div className="card p-5 h-fit sticky top-24">
          <h3 className="font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>Order Summary</h3>
          <div className="space-y-3 mb-4 max-h-56 overflow-y-auto custom-scrollbar">
            {items.map((item) => (
              <div key={`${item.product}-${item.size}-${item.color}`} className="flex gap-3">
                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold line-clamp-1">{item.name}</p>
                  {item.size && <p className="text-xs text-[var(--color-text-muted)]">Size: {item.size}</p>}
                  <p className="text-xs text-primary-600">×{item.quantity}</p>
                </div>
                <p className="text-xs font-bold">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm pt-3 border-t border-[var(--color-border)]">
            <div className="flex justify-between text-[var(--color-text-muted)]"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between text-[var(--color-text-muted)]">
              <span>Shipping</span>
              <span className={shippingCost === 0 ? 'text-primary-600 font-semibold' : ''}>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost)}</span>
            </div>
            <div className="flex justify-between text-[var(--color-text-muted)]"><span>VAT (13%)</span><span>{formatPrice(tax)}</span></div>
            <div className="flex justify-between font-bold pt-2 border-t border-[var(--color-border)]">
              <span>Total</span><span className="text-primary-600 dark:text-primary-400">{formatPrice(total)}</span>
            </div>
          </div>
          {step === 2 && shipping.fullName && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">Delivering to</p>
              <p className="text-sm font-semibold">{shipping.fullName}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{shipping.street}, {shipping.city}, {shipping.district}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{shipping.phone}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
