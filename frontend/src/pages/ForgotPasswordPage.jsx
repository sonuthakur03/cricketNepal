// src/pages/ForgotPasswordPage.jsx — Premium dark redesign with full validation

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineMail, HiOutlineCheckCircle, HiArrowLeft, HiOutlineExclamationCircle } from 'react-icons/hi'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { getErrorMessage } from '../utils/helpers'
import { validateEmail } from '../utils/validators'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleBlur = () => {
    setTouched(true)
    const val = validateEmail(email)
    setError(val.isValid ? '' : val.error)
  }

  const handleChange = (e) => {
    setEmail(e.target.value)
    if (touched || error) {
      const val = validateEmail(e.target.value)
      setError(val.isValid ? '' : val.error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched(true)
    const val = validateEmail(email)
    if (!val.isValid) {
      setError(val.error)
      toast.error(val.error)
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: email.trim() })
      setSent(true)
      toast.success('Reset link sent!', {
        style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
      })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16 relative overflow-hidden"
      style={{ background: 'var(--bg-primary)', position: 'fixed', inset: 0, zIndex: 100, overflowY: 'auto' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(201,162,39,0.07) 0%, transparent 70%)' }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(201,162,39,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3 mb-6">
            <svg width="44" height="44" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="11" fill="url(#fpGrad)" />
              <rect x="11" y="9" width="2.5" height="18" rx="1.25" fill="#0a0a0a" />
              <rect x="18.75" y="9" width="2.5" height="18" rx="1.25" fill="#0a0a0a" />
              <rect x="26.5" y="9" width="2.5" height="18" rx="1.25" fill="#0a0a0a" />
              <rect x="9.5" y="7.5" width="7.5" height="2.5" rx="1.25" fill="#0a0a0a" />
              <rect x="21" y="7.5" width="9" height="2.5" rx="1.25" fill="#0a0a0a" />
              <defs>
                <linearGradient id="fpGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ECC84A" />
                  <stop offset="50%" stopColor="#C9A227" />
                  <stop offset="100%" stopColor="#A07820" />
                </linearGradient>
              </defs>
            </svg>
            <span
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}
            >
              Pitch<span style={{ color: 'var(--gold-400)' }}>Nepal</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
            Reset Password
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            We'll send a link to your registered email
          </p>
        </div>

        {/* Card */}
        <div className="card-glass p-7 rounded-2xl" style={{ border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
                style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)' }}
              >
                <HiOutlineCheckCircle className="w-9 h-9" style={{ color: '#4ade80' }} />
              </motion.div>
              <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                Check Your Inbox
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                We sent a 15-minute reset link to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>
              </p>
              <Link to="/login" className="btn-primary w-full inline-block text-center mt-4">
                Back to Sign In →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="label">Registered Email</label>
                <div className="relative">
                  <HiOutlineMail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors"
                    style={{ color: touched && error ? '#ef4444' : 'var(--text-muted)' }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="your@email.com"
                    className={`input pl-10 ${touched && error ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                    autoFocus
                  />
                </div>
                <AnimatePresence>
                  {touched && error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -4, height: 0 }}
                      className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400"
                    >
                      <HiOutlineExclamationCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base mt-2">
                {loading ? 'Sending…' : 'Send Reset Link →'}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm transition-colors"
                  style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-display)' }}
                >
                  <HiArrowLeft className="w-4 h-4" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
