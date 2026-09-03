// src/pages/AuthPages.jsx — Premium dark auth pages with robust validation

import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineEye, HiOutlineEyeOff,
  HiOutlineMail, HiOutlineLockClosed, HiOutlineUser,
  HiOutlineExclamationCircle, HiCheck,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import useAuthStore from '../context/authStore'
import {
  validateEmail,
  validateName,
  validatePassword,
  validateConfirmPassword,
} from '../utils/validators'

// PN Wicket Logo SVG
function PNLogoAuth() {
  return (
    <svg width="44" height="44" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="11" fill="url(#authLogoGrad)" />
      <rect x="11" y="9" width="2.5" height="18" rx="1.25" fill="#0a0a0a" />
      <rect x="18.75" y="9" width="2.5" height="18" rx="1.25" fill="#0a0a0a" />
      <rect x="26.5" y="9" width="2.5" height="18" rx="1.25" fill="#0a0a0a" />
      <rect x="9.5" y="7.5" width="7.5" height="2.5" rx="1.25" fill="#0a0a0a" />
      <rect x="21" y="7.5" width="9" height="2.5" rx="1.25" fill="#0a0a0a" />
      <rect x="8" y="27" width="24" height="1.5" rx="0.75" fill="rgba(10,10,10,0.5)" />
      <defs>
        <linearGradient id="authLogoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ECC84A" />
          <stop offset="50%" stopColor="#C9A227" />
          <stop offset="100%" stopColor="#A07820" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Shared field component with error rendering
function FormField({ label, icon: Icon, error, children, rightSlot }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="label">{label}</label>
        {rightSlot}
      </div>
      <div className="relative">
        {Icon && (
          <Icon
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors"
            style={{ color: error ? '#ef4444' : 'var(--text-muted)' }}
          />
        )}
        {children}
      </div>
      <AnimatePresence>
        {error && (
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
  )
}

// Shared Auth Layout
function AuthLayout({ title, subtitle, children }) {
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
          className="absolute bottom-0 right-0 w-[400px] h-[400px]"
          style={{ background: 'radial-gradient(ellipse at bottom right, rgba(139,90,43,0.05) 0%, transparent 70%)' }}
        />
        {/* Grid */}
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
            <PNLogoAuth />
            <span
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}
            >
              Pitch<span style={{ color: 'var(--gold-400)' }}>Nepal</span>
            </span>
          </Link>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', fontWeight: 700 }}
          >
            {title}
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        </div>

        {/* Card */}
        <div
          className="card-glass p-7 rounded-2xl"
          style={{
            border: '1px solid var(--border)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 30px rgba(201,162,39,0.05)',
          }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  )
}

// ── Login ────────────────────────────────────────────────────────
export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [showPw, setShowPw] = useState(false)
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    validateField(field, form[field])
  }

  const validateField = (field, value) => {
    let err = ''
    if (field === 'email') {
      const res = validateEmail(value)
      if (!res.isValid) err = res.error
    } else if (field === 'password') {
      if (!value) err = 'Password is required'
    }
    setErrors((prev) => ({ ...prev, [field]: err }))
    return !err
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (touched[field] || errors[field]) {
      validateField(field, value)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const emailOk = validateField('email', form.email)
    const pwOk = validateField('password', form.password)
    setTouched({ email: true, password: true })

    if (!emailOk || !pwOk) {
      toast.error('Please fix the errors before submitting')
      return
    }

    const result = await login(form.email.trim(), form.password)
    if (result.success) {
      toast.success('Welcome back! 🏏', {
        style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
        iconTheme: { primary: 'var(--gold-400)', secondary: '#000' },
      })
      if (from && from !== '/') {
        navigate(from, { replace: true })
        return
      }
      const currentUser = useAuthStore.getState().user
      if (currentUser?.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (currentUser?.role === 'seller') {
        navigate('/seller', { replace: true })
      } else {
        navigate('/products', { replace: true })
      }
    } else {
      toast.error(result.message)
    }
  }

  const selectDemoAccount = (email, pw) => {
    setForm({ email, password: pw })
    setErrors({})
    setTouched({})
  }

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your PitchNepal account">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField label="Email Address" icon={HiOutlineMail} error={touched.email && errors.email}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="your@email.com"
            className={`input pl-10 ${touched.email && errors.email ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
            autoFocus
          />
        </FormField>

        <FormField
          label="Password"
          icon={HiOutlineLockClosed}
          error={touched.password && errors.password}
          rightSlot={
            <Link
              to="/forgot-password"
              className="text-xs hover:underline transition-colors"
              style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-display)' }}
            >
              Forgot password?
            </Link>
          }
        >
          <input
            type={showPw ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => handleChange('password', e.target.value)}
            onBlur={() => handleBlur('password')}
            placeholder="••••••••"
            className={`input pl-10 pr-10 ${
              touched.password && errors.password ? 'border-red-500 ring-1 ring-red-500/20' : ''
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors p-1"
            style={{ color: 'var(--text-muted)' }}
          >
            {showPw ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
          </button>
        </FormField>

        <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 text-base mt-2">
          {isLoading ? 'Signing in…' : 'Sign In →'}
        </button>

        {/* Demo accounts */}
        <div
          className="rounded-xl p-3.5 text-xs space-y-1.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}
        >
          <p
            className="font-semibold mb-2"
            style={{
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-display)',
              fontSize: '10px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Demo Accounts
          </p>
          {[
            { role: 'User', email: 'user@cricketnepal.com', pw: 'User@123' },
            { role: 'Seller', email: 'seller@cricketnepal.com', pw: 'Seller@123' },
            { role: 'Admin', email: 'admin@cricketnepal.com', pw: 'Admin@123' },
          ].map((d) => (
            <button
              key={d.role}
              type="button"
              onClick={() => selectDemoAccount(d.email, d.pw)}
              className="w-full text-left flex justify-between items-center px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,162,39,0.08)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="font-semibold" style={{ color: 'var(--gold-400)' }}>
                {d.role}
              </span>
              <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                {d.email}
              </span>
            </button>
          ))}
        </div>
      </form>

      <p className="text-center text-sm mt-5" style={{ color: 'var(--text-muted)' }}>
        Don't have an account?{' '}
        <Link
          to="/register"
          className="font-semibold hover:underline"
          style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-display)' }}
        >
          Create Account
        </Link>
      </p>
    </AuthLayout>
  )
}

// ── Register ─────────────────────────────────────────────────────
export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [showPw, setShowPw] = useState(false)
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Support ?role=seller from URL
  const urlRole = new URLSearchParams(location.search).get('role')
  const [role, setRole] = useState(urlRole || 'user')

  const pwStrength = validatePassword(form.password)

  const validateField = (field, value, currentForm = form) => {
    let err = ''
    if (field === 'name') {
      const res = validateName(value, 'Full Name', 2)
      if (!res.isValid) err = res.error
    } else if (field === 'email') {
      const res = validateEmail(value)
      if (!res.isValid) err = res.error
    } else if (field === 'password') {
      const res = validatePassword(value)
      if (!res.isValid) err = res.error
    } else if (field === 'confirmPassword') {
      const res = validateConfirmPassword(currentForm.password, value)
      if (!res.isValid) err = res.error
    }
    setErrors((prev) => ({ ...prev, [field]: err }))
    return !err
  }

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    validateField(field, form[field])
  }

  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value }
    setForm(updated)
    if (touched[field] || errors[field]) {
      validateField(field, value, updated)
    }
    if (field === 'password' && touched.confirmPassword) {
      validateField('confirmPassword', form.confirmPassword, updated)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const nameOk = validateField('name', form.name)
    const emailOk = validateField('email', form.email)
    const pwOk = validateField('password', form.password)
    const confirmOk = validateField('confirmPassword', form.confirmPassword)
    setTouched({ name: true, email: true, password: true, confirmPassword: true })

    if (!nameOk || !emailOk || !pwOk || !confirmOk) {
      toast.error('Please fix all highlighted errors')
      return
    }

    const result = await register({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role,
    })

    if (result.success) {
      toast.success('Account created! Welcome to PitchNepal 🏏', {
        style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
      })
      const currentUser = useAuthStore.getState().user
      if (currentUser?.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (currentUser?.role === 'seller') {
        navigate('/seller', { replace: true })
      } else {
        navigate('/products', { replace: true })
      }
    } else {
      toast.error(result.message)
    }
  }

  return (
    <AuthLayout title="Create Account" subtitle="Join Nepal's most premium cricket store">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField label="Full Name" icon={HiOutlineUser} error={touched.name && errors.name}>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            placeholder="e.g. Paras Khadka"
            className={`input pl-10 ${touched.name && errors.name ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
            autoFocus
          />
        </FormField>

        <FormField label="Email Address" icon={HiOutlineMail} error={touched.email && errors.email}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            placeholder="your@email.com"
            className={`input pl-10 ${touched.email && errors.email ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
          />
        </FormField>

        <div>
          <FormField label="Password" icon={HiOutlineLockClosed} error={touched.password && errors.password}>
            <input
              type={showPw ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              onBlur={() => handleBlur('password')}
              placeholder="Min. 6 characters"
              className={`input pl-10 pr-10 ${
                touched.password && errors.password ? 'border-red-500 ring-1 ring-red-500/20' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              style={{ color: 'var(--text-muted)' }}
            >
              {showPw ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
            </button>
          </FormField>

          {/* Password Strength Indicator */}
          {form.password && (
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

        <FormField label="Confirm Password" icon={HiOutlineLockClosed} error={touched.confirmPassword && errors.confirmPassword}>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            onBlur={() => handleBlur('confirmPassword')}
            placeholder="Re-enter password"
            className={`input pl-10 pr-10 ${
              touched.confirmPassword && errors.confirmPassword ? 'border-red-500 ring-1 ring-red-500/20' : ''
            }`}
          />
          {form.confirmPassword && form.password === form.confirmPassword && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 flex items-center gap-1 text-xs">
              <HiCheck className="w-4 h-4" />
            </span>
          )}
        </FormField>

        {/* Account type */}
        <div>
          <label className="label">Account Type</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'user', label: '🛍️ Buyer', desc: 'Shop for gear' },
              { value: 'seller', label: '🏪 Seller', desc: 'Sell products' },
            ].map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className="p-3.5 rounded-xl text-left transition-all duration-200"
                style={{
                  border: `1px solid ${role === r.value ? 'var(--gold-400)' : 'var(--border-subtle)'}`,
                  background: role === r.value ? 'rgba(201,162,39,0.1)' : 'transparent',
                }}
              >
                <p className="font-semibold text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                  {r.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {r.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 text-base mt-2">
          {isLoading ? 'Creating account…' : 'Create Account →'}
        </button>
      </form>

      <p className="text-center text-sm mt-5" style={{ color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold hover:underline"
          style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-display)' }}
        >
          Sign In
        </Link>
      </p>
    </AuthLayout>
  )
}
