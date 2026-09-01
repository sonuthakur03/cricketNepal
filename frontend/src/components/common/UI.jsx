// src/components/common/UI.jsx — Premium redesigned UI primitives

import { Navigate, useLocation } from 'react-router-dom'
import { HiStar } from 'react-icons/hi'
import useAuthStore from '../../context/authStore'

// ── Skeleton loaders ──────────────────────────────────────────────────────────
export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-square w-full rounded-none" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-3 w-1/3 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="skeleton h-8 w-full rounded-xl mt-3" />
      </div>
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div className="skeleton aspect-square rounded-2xl" />
      <div className="space-y-4">
        <div className="skeleton h-5 w-1/4 rounded" />
        <div className="skeleton h-8 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/4 rounded" />
        <div className="skeleton h-7 w-1/3 rounded" />
        <div className="skeleton h-24 w-full rounded-xl" />
        <div className="skeleton h-12 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-14 w-full rounded-xl" />
      ))}
    </div>
  )
}

// ── Star Rating ───────────────────────────────────────────────────────────────
export function StarRating({ rating = 0, count, size = 'sm' }) {
  const starSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <HiStar
            key={i}
            className={starSize}
            style={{ color: i < Math.round(rating) ? 'var(--gold-400)' : 'rgba(255,255,255,0.1)' }}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({count})</span>
      )}
    </div>
  )
}

// ── Interactive Star Input ────────────────────────────────────────────────────
export function StarInput({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button key={i} type="button" onClick={() => onChange(i + 1)}
          className="transition-transform hover:scale-110">
          <HiStar
            className="w-7 h-7 transition-colors"
            style={{ color: i < value ? 'var(--gold-400)' : 'rgba(255,255,255,0.1)' }}
          />
        </button>
      ))}
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null
  const pages = []
  const delta = 2
  for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
    pages.push(i)
  }
  if (currentPage - delta > 2) pages.unshift('...')
  if (currentPage + delta < totalPages - 1) pages.push('...')
  pages.unshift(1)
  if (totalPages > 1) pages.push(totalPages)

  return (
    <div className="flex items-center justify-center gap-1 flex-wrap mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-white/5"
        style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}
      >
        ← Prev
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dot-${i}`} className="px-2" style={{ color: 'var(--text-muted)' }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className="w-9 h-9 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: p === currentPage ? 'var(--gold-400)' : 'transparent',
              color: p === currentPage ? '#080808' : 'var(--text-secondary)',
              border: p === currentPage ? 'none' : '1px solid var(--border-subtle)',
              fontFamily: 'var(--font-display)',
            }}
            onMouseEnter={(e) => { if (p !== currentPage) e.currentTarget.style.borderColor = 'var(--gold-400)' }}
            onMouseLeave={(e) => { if (p !== currentPage) e.currentTarget.style.borderColor = 'var(--border-subtle)' }}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-white/5"
        style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}
      >
        Next →
      </button>
    </div>
  )
}

// ── Protected Route ───────────────────────────────────────────────────────────
export function ProtectedRoute({ children, roles = [] }) {
  const { user, token } = useAuthStore()
  const location = useLocation()

  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        state={{ from: { pathname: location.pathname, search: location.search } }}
        replace
      />
    )
  }
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return children
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="text-6xl opacity-60">{icon}</div>
      <div>
        <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
          {title}
        </h3>
        <p className="max-w-sm text-sm" style={{ color: 'var(--text-muted)' }}>{message}</p>
      </div>
      {action}
    </div>
  )
}

// ── Loading Spinner ───────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex items-center justify-center p-6">
      <div
        className={`${sizes[size]} rounded-full animate-spin`}
        style={{ border: '2px solid var(--border-subtle)', borderTopColor: 'var(--gold-400)' }}
      />
    </div>
  )
}

// ── Page Wrapper (for inner pages with proper padding) ────────────────────────
export function PageWrapper({ children, className = '' }) {
  return (
    <div className={`pt-20 pb-16 min-h-screen ${className}`} style={{ background: 'var(--bg-primary)' }}>
      <div className="page-container">
        {children}
      </div>
    </div>
  )
}

// ── Section Header ────────────────────────────────────────────────────────────
export function SectionHeader({ eyebrow, title, subtitle, center = false }) {
  return (
    <div className={`mb-10 ${center ? 'text-center' : ''}`}>
      {eyebrow && <div className={`section-label ${center ? 'justify-center' : ''} mb-3`}>{eyebrow}</div>}
      <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
        {title}
      </h2>
      {subtitle && <p className="mt-2 text-base max-w-xl" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
    </div>
  )
}
