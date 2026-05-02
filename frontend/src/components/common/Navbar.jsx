// src/components/common/Navbar.jsx
import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineShoppingCart, HiOutlineHeart, HiOutlineUser,
  HiOutlineSearch, HiOutlineMenuAlt3, HiOutlineX,
  HiOutlineSun, HiOutlineMoon, HiOutlineLogout,
  HiOutlineCog, HiOutlineChartBar, HiChevronDown,
} from 'react-icons/hi'
import useAuthStore from '../../context/authStore'
import useCartStore from '../../context/cartStore'

const NAV_LINKS = [
  { label: 'Shop', to: '/products' },
  { label: 'About', to: '/about' },
]

const CATEGORIES = [
  'Bats', 'Balls', 'Gloves', 'Pads', 'Helmets',
  'Jerseys', 'Shoes', 'Bags', 'Accessories',
]

export default function Navbar({ darkMode, toggleDarkMode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const dropRef = useRef(null)
  const navigate = useNavigate()

  const { user, logout, isAuthenticated, isAdmin, isSeller } = useAuthStore()
  const totalItems = useCartStore((s) => s.getTotalItems())
  const openCart = useCartStore((s) => s.openCart)

  // Detect scroll for background blur
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQ.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQ.trim())}`)
      setSearchOpen(false)
      setSearchQ('')
    }
  }

  const handleLogout = async () => {
    await logout()
    setDropdownOpen(false)
    navigate('/')
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-white/90 dark:bg-dark-900/90 backdrop-blur-md shadow-sm border-b border-[var(--color-border)]'
        : 'bg-transparent'
    }`}>
      <nav className="page-container">
        <div className="flex items-center justify-between h-16 md:h-18">

          {/* ── Logo ── */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow-green group-hover:shadow-lg transition-all">
              <span className="text-white font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>🏏</span>
            </div>
            <span className="text-xl font-bold hidden sm:block" style={{ fontFamily: 'Syne, sans-serif' }}>
              <span className="text-primary-600 dark:text-primary-400">Cricket</span>
              <span className="text-[var(--color-text)]">Nepal</span>
            </span>
          </Link>

          {/* ── Desktop Nav ── */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'text-[var(--color-text)] hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                {link.label}
              </NavLink>
            ))}

            {/* Categories dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 px-4 py-2 rounded-xl font-medium text-sm text-[var(--color-text)] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                style={{ fontFamily: 'Syne, sans-serif' }}>
                Categories <HiChevronDown className="w-4 h-4" />
              </button>
              <div className="absolute top-full left-0 mt-1 w-52 card p-2 hidden group-hover:block animate-slide-down z-50">
                {CATEGORIES.map((cat) => (
                  <Link key={cat} to={`/products?category=${cat}`}
                    className="block px-3 py-2 text-sm rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 hover:text-primary-600 transition-colors">
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Search */}
            <button onClick={() => setSearchOpen(true)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <HiOutlineSearch className="w-5 h-5 text-[var(--color-text)]" />
            </button>

            {/* Dark mode */}
            <button onClick={toggleDarkMode}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {darkMode
                ? <HiOutlineSun className="w-5 h-5 text-gold-500" />
                : <HiOutlineMoon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* Wishlist (auth only) */}
            {isAuthenticated() && (
              <Link to="/wishlist" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <HiOutlineHeart className="w-5 h-5 text-[var(--color-text)]" />
              </Link>
            )}

            {/* Cart */}
            <button onClick={openCart} className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <HiOutlineShoppingCart className="w-5 h-5 text-[var(--color-text)]" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] flex items-center justify-center bg-primary-600 text-white text-[10px] font-bold rounded-full leading-none px-1">
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            {/* User menu */}
            {isAuthenticated() ? (
              <div ref={dropRef} className="relative">
                <button onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <img src={user?.avatar?.url} alt={user?.name}
                    className="w-7 h-7 rounded-full object-cover border-2 border-primary-400" />
                </button>
                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-52 card p-2 z-50"
                    >
                      <div className="px-3 py-2 border-b border-[var(--color-border)] mb-1">
                        <p className="font-semibold text-sm truncate">{user?.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)] truncate">{user?.email}</p>
                        <span className="badge-green mt-1 capitalize">{user?.role}</span>
                      </div>
                      <Link to="/profile" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <HiOutlineUser className="w-4 h-4" /> My Profile
                      </Link>
                      <Link to="/orders" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <HiOutlineShoppingCart className="w-4 h-4" /> My Orders
                      </Link>
                      {isSeller() && (
                        <Link to="/seller/dashboard" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          <HiOutlineChartBar className="w-4 h-4" /> Seller Panel
                        </Link>
                      )}
                      {isAdmin() && (
                        <Link to="/admin/dashboard" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          <HiOutlineCog className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}
                      <hr className="my-1 border-[var(--color-border)]" />
                      <button onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                        <HiOutlineLogout className="w-4 h-4" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link to="/login" className="btn-primary py-2 px-4 text-sm hidden sm:inline-flex">
                Login
              </Link>
            )}

            {/* Mobile menu */}
            <button className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <HiOutlineX className="w-5 h-5" /> : <HiOutlineMenuAlt3 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Search overlay ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 px-4"
            onClick={() => setSearchOpen(false)}
          >
            <motion.form
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleSearch}
              className="w-full max-w-2xl"
            >
              <div className="relative">
                <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
                <input
                  autoFocus
                  type="text"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search for bats, balls, jerseys..."
                  className="w-full pl-12 pr-16 py-4 text-lg rounded-2xl card border-2 border-primary-300 focus:border-primary-500 focus:outline-none bg-white dark:bg-dark-900"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 btn-primary py-2 px-4 text-sm">
                  Search
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-dark-900 border-b border-[var(--color-border)] px-4 pb-4"
          >
            <div className="flex flex-col gap-1 pt-2">
              {NAV_LINKS.map((link) => (
                <NavLink key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                  className={({ isActive }) => `px-4 py-3 rounded-xl font-medium ${isActive ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600' : 'text-[var(--color-text)]'}`}>
                  {link.label}
                </NavLink>
              ))}
              {CATEGORIES.map((cat) => (
                <Link key={cat} to={`/products?category=${cat}`} onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 text-sm text-[var(--color-text-muted)] hover:text-primary-600 rounded-xl">
                  › {cat}
                </Link>
              ))}
              {!isAuthenticated() && (
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary mt-2 w-full text-center">
                  Login / Register
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
