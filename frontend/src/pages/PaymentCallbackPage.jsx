// src/pages/PaymentCallbackPage.jsx
// eSewa v2 redirects with base64-encoded JSON in ?data= query param
// We decode it and send to our backend for HMAC verification

import { useEffect, useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi'
import api from '../utils/api'
import useCartStore from '../context/cartStore'
import { getErrorMessage } from '../utils/helpers'

// ── eSewa Success Handler ─────────────────────────────────────────────────────
// eSewa v2 redirects to: /payment/esewa/success?orderId=xxx&data=BASE64_JSON
export function EsewaSuccessPage() {
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()
  const clearCart       = useCartStore((s) => s.clearCart)
  const [status, setStatus]   = useState('verifying')   // 'verifying' | 'success' | 'error'
  const [errMsg, setErrMsg]   = useState('')

  useEffect(() => {
    const orderId      = searchParams.get('orderId')
    const encodedData  = searchParams.get('data')   // base64 from eSewa

    if (!orderId || !encodedData) {
      setStatus('error')
      setErrMsg('Missing payment parameters. Please contact support.')
      return
    }

    // Send base64 payload to backend for HMAC verification + status API check
    api.post(`/esewa/verify/${orderId}`, { encodedData })
      .then(() => {
        clearCart()
        setStatus('success')
        // Auto-redirect to orders after 4 seconds
        setTimeout(() => navigate('/orders'), 4000)
      })
      .catch((err) => {
        setStatus('error')
        setErrMsg(getErrorMessage(err))
      })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center page-container py-20">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center max-w-sm"
      >
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"
              style={{ borderWidth: 4 }} />
            <h2 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
              Verifying eSewa Payment…
            </h2>
            <p className="text-[var(--color-text-muted)] mt-2 text-sm">
              Please wait — do not close this tab.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineCheckCircle className="w-9 h-9 text-primary-600" />
            </div>
            <h2 className="text-2xl font-black mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
              Payment Successful! 🎉
            </h2>
            <p className="text-[var(--color-text-muted)] mb-2 text-sm">
              Your eSewa payment was verified. Redirecting to your orders…
            </p>
            <div className="w-32 h-1 bg-primary-100 dark:bg-primary-900 rounded-full mx-auto mt-4 overflow-hidden">
              <motion.div
                className="h-full bg-primary-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 4, ease: 'linear' }}
              />
            </div>
            <Link to="/orders" className="btn-primary mt-5 inline-block">View My Orders</Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineXCircle className="w-9 h-9 text-red-500" />
            </div>
            <h2 className="text-2xl font-black mb-2 text-red-600" style={{ fontFamily: 'Syne, sans-serif' }}>
              Verification Failed
            </h2>
            <p className="text-[var(--color-text-muted)] mb-5 text-sm">{errMsg}</p>
            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              Your order is saved. You can retry payment from My Orders, or contact support.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/orders"   className="btn-secondary">My Orders</Link>
              <Link to="/products" className="btn-primary">Continue Shopping</Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

// ── eSewa Failure / Cancellation ──────────────────────────────────────────────
// eSewa redirects here when user cancels or payment fails
export function EsewaFailurePage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')

  useEffect(() => {
    // Notify backend that payment was cancelled (keeps order in pending)
    if (orderId) {
      api.post(`/esewa/failure/${orderId}`).catch(() => {})
    }
  }, [orderId])

  return (
    <div className="min-h-screen flex items-center justify-center page-container py-20">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
          <HiOutlineXCircle className="w-9 h-9 text-red-500" />
        </div>
        <h2 className="text-2xl font-black mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
          eSewa Payment Cancelled
        </h2>
        <p className="text-[var(--color-text-muted)] mb-5 text-sm">
          Your payment was not completed. Your order is saved — you can retry payment from My Orders.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/orders"   className="btn-secondary">My Orders</Link>
          <Link to="/products" className="btn-primary">Continue Shopping</Link>
        </div>
      </div>
    </div>
  )
}

// ── 404 Not Found ─────────────────────────────────────────────────────────────
export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center page-container py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="text-8xl mb-4">🏏</div>
        <h1 className="text-6xl font-black text-primary-600 mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
          404
        </h1>
        <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
          Page Not Found
        </h2>
        <p className="text-[var(--color-text-muted)] mb-8 max-w-sm mx-auto">
          Looks like this page is out for six. Let's get you back in the game.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/"         className="btn-primary">Go Home</Link>
          <Link to="/products" className="btn-secondary">Browse Products</Link>
        </div>
      </motion.div>
    </div>
  )
}
