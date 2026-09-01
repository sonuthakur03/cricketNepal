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

// PN Wicket Logo SVG
function PNLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="url(#logoGrad)" />
      {/* Stumps */}
      <rect x="11" y="9" width="2.5" height="18" rx="1.25" fill="#0a0a0a" />
      <rect x="18.75" y="9" width="2.5" height="18" rx="1.25" fill="#0a0a0a" />
      <rect x="26.5" y="9" width="2.5" height="18" rx="1.25" fill="#0a0a0a" />
      {/* Bails */}
      <rect x="9.5" y="7.5" width="7.5" height="2.5" rx="1.25" fill="#0a0a0a" />
      <rect x="21" y="7.5" width="9" height="2.5" rx="1.25" fill="#0a0a0a" />
      {/* Ground line */}
      <rect x="8" y="27" width="24" height="1.5" rx="0.75" fill="rgba(10,10,10,0.5)" />
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ECC84A" />
          <stop offset="50%" stopColor="#C9A227" />
          <stop offset="100%" stopColor="#A07820" />
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
          scrolled ? 'nav-glass shadow-2xl' : 'bg-transparent'
        }`}
      >
        <div className="page-container flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
              <PNLogo size={36} />
            </motion.div>
            <div className="flex flex-col leading-none">
              <span
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}
              >
                Pitch<span style={{ color: 'var(--gold-400)' }}>Nepal</span>
              </span>
              <span className="text-[10px] tracking-[0.16em] uppercase font-semibold" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
                Premium Cricket
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive ? 'text-gold' : ''
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--gold-400)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
              })}
            >
              Shop
            </NavLink>

            <NavLink
              to="/about"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive ? 'text-gold' : ''
                }`
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--gold-400)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 600,
              })}
            >
              About
            </NavLink>

            {isSeller() && (
              <NavLink
                to="/seller"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-150 ml-2 ${
                    isActive ? 'bg-gold-400 text-black' : 'bg-white/5 text-gold-400 border border-gold-400/30 hover:bg-gold-400/10'
                  }`
                }
                style={{
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.06em',
                }}
              >
                Seller Dashboard
              </NavLink>
            )}

            {isAdmin() && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all duration-150 ml-2 ${
                    isActive ? 'bg-gold-400 text-black' : 'bg-white/5 text-gold-400 border border-gold-400/30 hover:bg-gold-400/10'
                  }`
                }
                style={{
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '0.06em',
                }}
              >
                Admin Dashboard
              </NavLink>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 hover:bg-white/5"
              style={{ color: 'var(--text-muted)' }}
            >
              <HiOutlineSearch className="w-4.5 h-4.5" />
            </button>

            {/* Wishlist */}
            {isAuthenticated() && (
              <Link
                to="/wishlist"
                className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 hover:bg-white/5"
                style={{ color: 'var(--text-muted)' }}
              >
                <HiOutlineHeart className="w-4.5 h-4.5" />
              </Link>
            )}

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 hover:bg-white/5"
              style={{ color: 'var(--gold-400)' }}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <HiOutlineSun className="w-4.5 h-4.5" />
              ) : (
                <HiOutlineMoon className="w-4.5 h-4.5" />
              )}
            </button>

            {/* Cart */}
            <button
              onClick={openCart}
              className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150 hover:bg-white/5"
              style={{ color: 'var(--text-muted)' }}
            >
              <HiOutlineShoppingCart className="w-4.5 h-4.5" />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span
                    key="cart-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                    style={{ background: 'var(--gold-400)', color: '#080808' }}
                  >
                    {totalItems > 9 ? '9+' : totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* User */}
            {isAuthenticated() ? (
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => { setDropdownOpen(!dropdownOpen); setCatOpen(false) }}
                  className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center transition-all duration-150 hover:ring-1"
                  style={{ '--tw-ring-color': 'var(--gold-400)' }}
                >
                  {user?.avatar?.url ? (
                    <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-sm font-bold"
                      style={{ background: 'var(--border-subtle)', color: 'var(--gold-400)', fontFamily: 'var(--font-display)' }}
                    >
                      {user?.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 w-52 card-glass rounded-xl overflow-hidden py-2"
                      style={{ border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }}
                    >
                      <div className="px-4 py-2 mb-1">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                          {user?.name}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                      </div>
                      <div className="divider-gold mx-3 mb-1" />

                      {/* Seller Portal Link */}
                      {isSeller() && (
                        <Link
                          to="/seller"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-white/5"
                          style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-heading)', fontWeight: 600 }}
                        >
                          <HiOutlineChartBar className="w-4 h-4" />
                          Seller Dashboard
                        </Link>
                      )}

                      {/* Admin Portal Link */}
                      {isAdmin() && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-white/5"
                          style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-heading)', fontWeight: 600 }}
                        >
                          <HiOutlineChartBar className="w-4 h-4" />
                          Admin Dashboard
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-white/5"
                        style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}
                      >
                        <HiOutlineCog className="w-4 h-4" />
                        Settings
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-white/5"
                        style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-display)' }}
                      >
                        <HiOutlineShoppingCart className="w-4 h-4" />
                        My Orders
                      </Link>
                      <div className="divider-gold mx-3 my-1" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors hover:bg-white/5"
                        style={{ color: '#f87171', fontFamily: 'var(--font-display)' }}
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
                className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold ml-1 transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, var(--gold-300), var(--gold-400))', color: '#080808', fontFamily: 'var(--font-display)' }}
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center ml-1 transition-all hover:bg-white/5"
              style={{ color: 'var(--text-muted)' }}
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
            className="fixed inset-0 z-40 pt-16"
            style={{ background: 'rgba(8,8,8,0.97)', backdropFilter: 'blur(20px)' }}
          >
            <div className="page-container py-8 flex flex-col gap-2">
              <Link
                to="/products"
                onClick={() => setMobileOpen(false)}
                className="text-2xl font-bold py-3 border-b"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}
              >
                Shop
              </Link>
              <Link
                to="/about"
                onClick={() => setMobileOpen(false)}
                className="text-2xl font-bold py-3 border-b"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}
              >
                About
              </Link>
              {isSeller() && (
                <Link to="/seller" onClick={() => setMobileOpen(false)} className="text-xl font-bold py-3 text-gold-400 border-b" style={{ color: 'var(--gold-400)', borderColor: 'var(--border-subtle)' }}>
                  ⚡ Seller Dashboard
                </Link>
              )}
              <div className="divider-gold my-2" />
              <button
                onClick={toggleDarkMode}
                className="flex items-center justify-between py-3 border-b text-lg font-semibold"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}
              >
                <span>Theme: {darkMode ? 'Dark Mode' : 'Light Mode'}</span>
                <span className="p-2 rounded-xl" style={{ background: 'rgba(201,162,39,0.15)', color: 'var(--gold-400)' }}>
                  {darkMode ? <HiOutlineSun className="w-5 h-5" /> : <HiOutlineMoon className="w-5 h-5" />}
                </span>
              </button>
              {!isAuthenticated() && (
                <div className="flex flex-col gap-3 mt-4">
                  <div className="flex gap-3">
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary flex-1 text-center">Sign In</Link>
                    <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-secondary flex-1 text-center">Register</Link>
                  </div>
                  <Link to="/register?role=seller" onClick={() => setMobileOpen(false)} className="text-xs text-center text-gold-400 hover:underline mt-2">
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
