// src/pages/AuthPages.jsx
// LoginPage and RegisterPage combined file

import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineMail, HiOutlineLockClosed, HiOutlineUser } from 'react-icons/hi'
import toast from 'react-hot-toast'
import useAuthStore from '../context/authStore'

function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-primary-50/30 dark:from-dark-950 dark:to-dark-900 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow-green">
              <span className="text-white font-bold text-xl">🏏</span>
            </div>
            <span className="text-2xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>
              <span className="text-primary-600">Cricket</span>Nepal
            </span>
          </Link>
          <h1 className="text-2xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>{title}</h1>
          <p className="text-[var(--color-text-muted)] text-sm mt-1">{subtitle}</p>
        </div>

        <div className="card p-7 shadow-xl">
          {children}
        </div>
      </motion.div>
    </div>
  )
}

// ── Login ─────────────────────────────────────────────────────────────────────
export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(form.email, form.password)
    if (result.success) {
      toast.success('Welcome back! 🏏')
      navigate(from, { replace: true })
    } else {
      toast.error(result.message)
    }
  }

  return (
    <AuthLayout title="Welcome Back" subtitle="Log in to your CricketNepal account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Email Address</label>
          <div className="relative">
            <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--color-text-muted)]" />
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="your@email.com" className="input pl-10" required autoFocus />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">Password</label>
            <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--color-text-muted)]" />
            <input type={showPw ? 'text' : 'password'} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••" className="input pl-10 pr-10" required minLength={6} />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              {showPw ? <HiOutlineEyeOff className="w-4.5 h-4.5" /> : <HiOutlineEye className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 text-base mt-2">
          {isLoading ? 'Logging in...' : 'Login →'}
        </button>

        {/* Demo accounts */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-xs space-y-1.5">
          <p className="font-semibold text-[var(--color-text-muted)] mb-1">Demo Accounts:</p>
          {[
            { role: 'User', email: 'user@cricketnepal.com', pw: 'User@123' },
            { role: 'Seller', email: 'seller@cricketnepal.com', pw: 'Seller@123' },
            { role: 'Admin', email: 'admin@cricketnepal.com', pw: 'Admin@123' },
          ].map((d) => (
            <button key={d.role} type="button"
              onClick={() => setForm({ email: d.email, password: d.pw })}
              className="w-full text-left flex justify-between items-center px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <span className="font-medium">{d.role}</span>
              <span className="text-[var(--color-text-muted)] font-mono">{d.email}</span>
            </button>
          ))}
        </div>
      </form>

      <p className="text-center text-sm text-[var(--color-text-muted)] mt-5">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary-600 font-semibold hover:underline">Sign up</Link>
      </p>
    </AuthLayout>
  )
}

// ── Register ──────────────────────────────────────────────────────────────────
export function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'user' })
  const [showPw, setShowPw] = useState(false)
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    const result = await register({ name: form.name, email: form.email, password: form.password, role: form.role })
    if (result.success) {
      toast.success('Account created! Welcome to CricketNepal 🏏')
      navigate('/')
    } else {
      toast.error(result.message)
    }
  }

  return (
    <AuthLayout title="Create Account" subtitle="Join Nepal's premier cricket store">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <div className="relative">
            <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--color-text-muted)]" />
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your full name" className="input pl-10" required autoFocus />
          </div>
        </div>

        <div>
          <label className="label">Email Address</label>
          <div className="relative">
            <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--color-text-muted)]" />
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="your@email.com" className="input pl-10" required />
          </div>
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--color-text-muted)]" />
            <input type={showPw ? 'text' : 'password'} value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 6 characters" className="input pl-10 pr-10" required minLength={6} />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              {showPw ? <HiOutlineEyeOff className="w-4.5 h-4.5" /> : <HiOutlineEye className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="label">Confirm Password</label>
          <div className="relative">
            <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--color-text-muted)]" />
            <input type="password" value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Re-enter password" className="input pl-10" required />
          </div>
        </div>

        {/* Account type */}
        <div>
          <label className="label">Account Type</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'user', label: '🛍️ Buyer', desc: 'Shop for gear' },
              { value: 'seller', label: '🏪 Seller', desc: 'Sell products' },
            ].map((r) => (
              <button key={r.value} type="button"
                onClick={() => setForm({ ...form, role: r.value })}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  form.role === r.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                    : 'border-[var(--color-border)] hover:border-primary-400'
                }`}>
                <p className="font-semibold text-sm">{r.label}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 text-base mt-2">
          {isLoading ? 'Creating account...' : 'Create Account →'}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--color-text-muted)] mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 font-semibold hover:underline">Login</Link>
      </p>
    </AuthLayout>
  )
}
