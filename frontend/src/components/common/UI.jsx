// src/components/common/UI.jsx
// Reusable UI primitives used across all pages

import { Navigate, useLocation } from 'react-router-dom'
import { HiStar } from 'react-icons/hi'
import useAuthStore from '../../context/authStore'

// ── Skeleton loaders ──────────────────────────────────────────────────────────
export function ProductCardSkeleton() {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="skeleton h-56 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-5 w-1/3 mt-2" />
        <div className="skeleton h-9 w-full mt-3 rounded-xl" />
      </div>
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in">
      <div className="skeleton aspect-square rounded-2xl" />
      <div className="space-y-4">
        <div className="skeleton h-8 w-3/4" />
        <div className="skeleton h-4 w-1/4" />
        <div className="skeleton h-6 w-1/3" />
        <div className="skeleton h-24 w-full" />
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
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <HiStar key={i}
            className={`${starSize} ${i < Math.round(rating) ? 'text-gold-500' : 'text-slate-300 dark:text-slate-600'}`}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-[var(--color-text-muted)]">({count})</span>
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
          <HiStar className={`w-7 h-7 ${i < value ? 'text-gold-500' : 'text-slate-300 dark:text-slate-600'}`} />
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
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
        className="px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        ← Prev
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dot-${i}`} className="px-2 text-[var(--color-text-muted)]">…</span>
        ) : (
          <button key={p} onClick={() => onPageChange(p)}
            className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${
              p === currentPage
                ? 'bg-primary-600 text-white shadow-glow-green'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-[var(--color-text)]'
            }`}>
            {p}
          </button>
        )
      )}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
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
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return children
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="text-5xl">{icon}</div>
      <h3 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>{title}</h3>
      <p className="text-[var(--color-text-muted)] max-w-sm">{message}</p>
      {action}
    </div>
  )
}

// ── Loading Spinner ───────────────────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex items-center justify-center p-4">
      <div className={`${sizes[size]} border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin`}
        style={{ borderWidth: '3px' }} />
    </div>
  )
}
