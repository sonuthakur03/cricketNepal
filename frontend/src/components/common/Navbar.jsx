// src/components/common/Navbar.jsx — Premium dark glass navbar with PN wicket logo

import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineShoppingCart, HiOutlineHeart, HiOutlineUser,
  HiOutlineSearch, HiOutlineX, HiOutlineLogout, HiOutlineCog,
  HiOutlineChartBar, HiOutlineMenuAlt3, HiChevronDown,
  HiOutlineSun, HiOutlineMoon,
} from 'react-icons/hi'
import useAuthStore from '../../context/authStore'
import useCartStore from '../../context/cartStore'

const NAV_LINKS = [
  { label: 'Shop', to: '/products' },
  { label: 'About', to: '/about' },
]

const CATEGORIES = ['Bats', 'Balls', 'Gloves', 'Pads', 'Helmets', 'Jerseys', 'Shoes', 'Accessories']

// PN Wicket Logo SVG — Vibrant Cricket Green
function PNLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="url(#logoGrad)" />
      {/* Stumps */}
      <rect x="11" y="9" width="2.5" height="18" rx="1.25" fill="#FFFFFF" />
      <rect x="18.75" y="9" width="2.5" height="18" rx="1.25" fill="#FFFFFF" />
      <rect x="26.5" y="9" width="2.5" height="18" rx="1.25" fill="#FFFFFF" />
      {/* Bails */}
      <rect x="9.5" y="7.5" width="7.5" height="2.5" rx="1.25" fill="#FDE047" />
      <rect x="21" y="7.5" width="9" height="2.5" rx="1.25" fill="#FDE047" />
      {/* Ground line */}
      <rect x="8" y="27" width="24" height="1.5" rx="0.75" fill="rgba(255,255,255,0.8)" />
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22C55E" />
          <stop offset="100%" stopColor="#15803D" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function Navbar({ darkMode, toggleDarkMode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, isAuthenticated, isAdmin, isSeller } = useAuthStore()
  const totalItems = useCartStore((s) => s.getTotalItems())
  const openCart = useCartStore((s) => s.openCart)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropdownOpen(false)
        setCatOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close mobile on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQ.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQ.trim())}`)
      setSearchOpen(false)
      setSearchQ('')
    }
  }

  const handleLogout = async () => {
    setDropdownOpen(false)
    setMobileOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'nav-glass shadow-sm py-1' : 'bg-transparent py-3'
        }`}
      >
        <div className="page-container flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
              <PNLogo size={38} />
            </motion.div>
            <div className="flex flex-col leading-none">
              <span
                className="text-xl md:text-2xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}
              >
                Pitch<span style={{ color: '#16A34A' }}>Nepal</span>
              </span>
              <span className="text-[10px] tracking-[0.18em] uppercase font-bold text-slate-400 dark:text-slate-500 mt-0.5" style={{ fontFamily: 'var(--font-heading)' }}>
                Cricket Vault
              </span>
            </div>
          </Link>

          {/* Desktop nav — Minimal & Clean */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `text-sm font-bold transition-colors py-1 ${
                  isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`
              }
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Shop
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `text-sm font-bold transition-colors py-1 ${
                  isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`
              }
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              About
            </NavLink>

            {isSeller() && (
              <NavLink
                to="/seller"
                className={({ isActive }) =>
                  `text-xs font-bold uppercase tracking-wider transition-colors py-1 ${
                    isActive ? 'text-slate-900 dark:text-white font-extrabold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Seller Hub
              </NavLink>
            )}

            {isAdmin() && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `text-xs font-bold uppercase tracking-wider transition-colors py-1 ${
                    isActive ? 'text-slate-900 dark:text-white font-extrabold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Admin Panel
              </NavLink>
            )}
          </nav>

          {/* Actions Bar — Minimal & Borderless */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              title="Search products"
            >
              <HiOutlineSearch className="w-5 h-5" />
            </button>

            {/* Wishlist */}
            {isAuthenticated() && (
              <Link
                to="/wishlist"
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                title="Wishlist"
              >
                <HiOutlineHeart className="w-5 h-5" />
              </Link>
            )}

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <HiOutlineSun className="w-5 h-5" />
              ) : (
                <HiOutlineMoon className="w-5 h-5" />
              )}
            </button>

            {/* Minimal Cart Button with Green Count Badge */}
            <button
              onClick={openCart}
              className="relative w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100"
              title="Shopping Cart"
            >
              <HiOutlineShoppingCart className="w-6 h-6" />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    key="cart-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 min-w-[19px] h-[19px] px-1 rounded-full text-[10px] font-extrabold flex items-center justify-center text-white bg-green-600 shadow-sm"
                  >
                    {totalItems > 99 ? '99+' : totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Minimal Profile Button */}
            {isAuthenticated() ? (
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => { setDropdownOpen(!dropdownOpen); setCatOpen(false) }}
                  className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  title="My Account"
                >
                  {user?.avatar?.url ? (
                    <img src={user.avatar.url} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white bg-slate-800 dark:bg-slate-200 dark:text-slate-900 shadow-sm"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="hidden sm:inline text-xs font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                    {user?.name?.split(' ')[0]}
                  </span>
                  <HiChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-slate-800 dark:text-slate-200' : ''}`} />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 w-56 rounded-2xl overflow-hidden py-2 shadow-2xl z-50 border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    >
                      <div className="px-4 py-2.5 mb-1 bg-slate-50 dark:bg-slate-800/60">
                        <p className="text-sm font-bold text-slate-900 dark:text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                          {user?.name}
                        </p>
                        <p className="text-xs truncate text-slate-500">{user?.email}</p>
                      </div>

                      {/* Seller Portal Link */}
                      {isSeller() && (
                        <Link
                          to="/seller"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          <HiOutlineChartBar className="w-4 h-4 text-slate-400" />
                          Seller Dashboard
                        </Link>
                      )}

                      {/* Admin Portal Link */}
                      {isAdmin() && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          <HiOutlineChartBar className="w-4 h-4 text-slate-400" />
                          Admin Dashboard
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
                      >
                        <HiOutlineCog className="w-4 h-4 text-slate-400" />
                        Account Settings
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
                      >
                        <HiOutlineShoppingCart className="w-4 h-4 text-slate-400" />
                        My Orders
                      </Link>

                      <div className="h-px bg-slate-200 dark:bg-slate-800 mx-3 my-1.5" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <HiOutlineLogout className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <HiOutlineUser className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              {mobileOpen ? <HiOutlineX className="w-5 h-5" /> : <HiOutlineMenuAlt3 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 pt-20"
            style={{ background: 'var(--bg-primary)', backdropFilter: 'blur(20px)' }}
          >
            <div className="page-container py-6 flex flex-col gap-2">
              <Link
                to="/products"
                onClick={() => setMobileOpen(false)}
                className="text-2xl font-bold py-3 border-b flex items-center justify-between"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
              >
                <span>Shop Equipment</span>
                <span className="text-green-600 text-lg">➔</span>
              </Link>
              <Link
                to="/about"
                onClick={() => setMobileOpen(false)}
                className="text-2xl font-bold py-3 border-b flex items-center justify-between"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
              >
                <span>About</span>
                <span className="text-green-600 text-lg">➔</span>
              </Link>
              {isSeller() && (
                <Link to="/seller" onClick={() => setMobileOpen(false)} className="text-xl font-bold py-3 text-green-600 border-b" style={{ borderColor: 'var(--border)' }}>
                  ⚡ Seller Dashboard
                </Link>
              )}
              {isAdmin() && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="text-xl font-bold py-3 text-green-700 border-b" style={{ borderColor: 'var(--border)' }}>
                  🛡️ Admin Panel
                </Link>
              )}
              <div className="divider-gold my-2" />
              <button
                onClick={toggleDarkMode}
                className="flex items-center justify-between py-3 border-b text-base font-bold"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
              >
                <span>Theme: {darkMode ? 'Dark Mode' : 'Light Mode'}</span>
                <span className="p-2 rounded-xl bg-green-500/10 text-green-600">
                  {darkMode ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
                </span>
              </button>
              {!isAuthenticated() && (
                <div className="flex flex-col gap-3 mt-4">
                  <div className="flex gap-3">
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary flex-1 text-center py-3">Sign In</Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-secondary flex-1 text-center py-3">Register</Link>
                  </div>
                  <Link to="/register?role=seller" onClick={() => setMobileOpen(false)} className="text-xs text-center text-green-600 hover:underline mt-2 font-bold">
                    Become a Seller on PitchNepal
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4"
            style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false) }}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="w-full max-w-xl"
            >
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--gold-400)' }} />
                  <input
                    autoFocus
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    placeholder="Search cricket gear…"
                    className="w-full pl-12 pr-12 py-4 rounded-2xl text-lg font-medium outline-none transition-all"
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-strong)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-display)',
                      boxShadow: '0 0 40px rgba(201,162,39,0.15)',
                    }}
                  />
                  <button type="button" onClick={() => setSearchOpen(false)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                    <HiOutlineX className="w-5 h-5" />
                  </button>
                </div>
              </form>
              <p className="text-center text-sm mt-4" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                Press Enter to search · Esc to close
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
