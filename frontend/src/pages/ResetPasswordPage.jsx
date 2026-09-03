// src/pages/ResetPasswordPage.jsx — Premium dark redesign with full validation

import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineCheckCircle,
  HiArrowLeft,
  HiOutlineExclamationCircle,
  HiCheck,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { getErrorMessage } from '../utils/helpers'
import useAuthStore from '../context/authStore'
import { validatePassword, validateConfirmPassword } from '../utils/validators'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const pwStrength = validatePassword(password)

  const validateField = (field, val, currentPw = password) => {
    let err = ''
    if (field === 'password') {
      const res = validatePassword(val)
      if (!res.isValid) err = res.error
    } else if (field === 'confirmPassword') {
      const res = validateConfirmPassword(currentPw, val)
      if (!res.isValid) err = res.error
    }
    setErrors((prev) => ({ ...prev, [field]: err }))
    return !err
  }

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    validateField(field, field === 'password' ? password : confirmPassword)
  }

  const handlePasswordChange = (val) => {
    setPassword(val)
    if (touched.password || errors.password) {
      validateField('password', val)
    }
    if (touched.confirmPassword) {
      validateField('confirmPassword', confirmPassword, val)
    }
  }

  const handleConfirmChange = (val) => {
    setConfirmPassword(val)
    if (touched.confirmPassword || errors.confirmPassword) {
      validateField('confirmPassword', val, password)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ password: true, confirmPassword: true })

    const pwOk = validateField('password', password)
    const matchOk = validateField('confirmPassword', confirmPassword, password)

    if (!pwOk || !matchOk) {
      toast.error('Please fix all password errors before submitting')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.put(`/auth/reset-password/${token}`, { password })
      if (data.token) {
        localStorage.setItem('token', data.token)
        useAuthStore.setState({ user: data.data, token: data.token })
      }
      setSuccess(true)
      toast.success('Password reset successfully! 🏏')
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
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3 mb-6">
            <svg width="44" height="44" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="11" fill="url(#rpGrad)" />
              <rect x="11" y="9" width="2.5" height="18" rx="1.25" fill="#0a0a0a" />
              <rect x="18.75" y="9" width="2.5" height="18" rx="1.25" fill="#0a0a0a" />
              <rect x="26.5" y="9" width="2.5" height="18" rx="1.25" fill="#0a0a0a" />
              <rect x="9.5" y="7.5" width="7.5" height="2.5" rx="1.25" fill="#0a0a0a" />
              <rect x="21" y="7.5" width="9" height="2.5" rx="1.25" fill="#0a0a0a" />
              <defs>
                <linearGradient id="rpGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
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
            New Password
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Choose a new secure password for your account
          </p>
        </div>

        <div className="card-glass p-7 rounded-2xl" style={{ border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          {success ? (
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
                Password Updated!
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Your password has been reset. You're now logged in.
              </p>
              <Link to="/" className="btn-primary w-full inline-block text-center mt-4">
                Go to Homepage →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="label">New Password</label>
                <div className="relative">
                  <HiOutlineLockClosed
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors"
                    style={{ color: touched.password && errors.password ? '#ef4444' : 'var(--text-muted)' }}
                  />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onBlur={() => handleBlur('password')}
                    placeholder="Min. 6 characters"
                    className={`input pl-10 pr-10 ${
                      touched.password && errors.password ? 'border-red-500 ring-1 ring-red-500/20' : ''
                    }`}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {showPw ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                  </button>
                </div>
                <AnimatePresence>
                  {touched.password && errors.password && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -4, height: 0 }}
                      className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400"
                    >
                      <HiOutlineExclamationCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{errors.password}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2 space-y-1.5 p-2.5 rounded-lg bg-black/20 border border-white/5">
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: 'var(--text-muted)' }}>Strength:</span>
                      <span className="font-semibold" style={{ color: pwStrength.color }}>
                        {pwStrength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className="h-full flex-1 rounded-full transition-all duration-300"
                          style={{
                            background: step <= pwStrength.score ? pwStrength.color : 'rgba(255,255,255,0.08)',
                          }}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[11px] pt-1">
                      <span className={`flex items-center gap-1 ${pwStrength.checks.length ? 'text-green-400' : 'text-slate-500'}`}>
                        {pwStrength.checks.length ? <HiCheck className="w-3 h-3" /> : '•'} 6+ characters
                      </span>
                      <span className={`flex items-center gap-1 ${pwStrength.checks.hasNumber ? 'text-green-400' : 'text-slate-500'}`}>
                        {pwStrength.checks.hasNumber ? <HiCheck className="w-3 h-3" /> : '•'} Contains number
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <HiOutlineLockClosed
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors"
                    style={{ color: touched.confirmPassword && errors.confirmPassword ? '#ef4444' : 'var(--text-muted)' }}
                  />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => handleConfirmChange(e.target.value)}
                    onBlur={() => handleBlur('confirmPassword')}
                    placeholder="Re-enter password"
                    className={`input pl-10 pr-10 ${
                      touched.confirmPassword && errors.confirmPassword ? 'border-red-500 ring-1 ring-red-500/20' : ''
                    }`}
                  />
                  {confirmPassword && password === confirmPassword && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 flex items-center gap-1 text-xs">
                      <HiCheck className="w-4 h-4" />
                    </span>
                  )}
                </div>
                <AnimatePresence>
                  {touched.confirmPassword && errors.confirmPassword && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, y: -4, height: 0 }}
                      className="flex items-center gap-1.5 mt-1.5 text-xs text-red-400"
                    >
                      <HiOutlineExclamationCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{errors.confirmPassword}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-base mt-2">
                {loading ? 'Updating…' : 'Set New Password →'}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm"
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
