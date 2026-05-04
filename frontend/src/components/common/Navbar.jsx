// src/components/common/Navbar.jsx
import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineShoppingCart,
  HiOutlineHeart,
  HiOutlineUser,
  HiOutlineSearch,
  HiOutlineMenuAlt3,
  HiOutlineX,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineLogout,
  HiOutlineCog,
  HiOutlineChartBar,
  HiChevronDown,
} from "react-icons/hi";
import useAuthStore from "../../context/authStore";
import useCartStore from "../../context/cartStore";

const NAV_LINKS = [
  { label: "Shop", to: "/products" },
  { label: "About", to: "/about" },
];

const CATEGORIES = [
  "Bats",
  "Balls",
  "Gloves",
  "Pads",
  "Helmets",
  "Jerseys",
  "Shoes",
  "Bags",
  "Accessories",
];

export default function Navbar({ darkMode, toggleDarkMode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Hero is dark — navbar text should be white when transparent on home page
  const isHomePage = location.pathname === "/";

  const { user, logout, isAuthenticated, isAdmin, isSeller } = useAuthStore();
  const totalItems = useCartStore((s) => s.getTotalItems());
  const openCart = useCartStore((s) => s.openCart);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setDropdownOpen(false);
      setCatOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQ.trim())}`);
      setSearchOpen(false);
      setSearchQ("");
    }
  };

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate("/login");
  };

  // On home page before scroll: use white text (hero is dark)
  // On other pages or after scroll: use normal themed text
  const isTransparent = isHomePage && !scrolled;
  const textColor = isTransparent ? "text-white" : "text-[var(--color-text)]";
  const hoverBg = isTransparent
    ? "hover:bg-white/10"
    : "hover:bg-slate-100 dark:hover:bg-slate-800";
  const iconColor = isTransparent ? "text-white" : "text-[var(--color-text)]";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 dark:bg-dark-900/90 backdrop-blur-md shadow-sm border-b border-[var(--color-border)]"
          : "bg-transparent"
      }`}
    >
      <nav className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo — always white on transparent, themed otherwise */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group flex-shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
              <span className="text-white font-bold text-lg">🏏</span>
            </div>
            <span
              className="text-xl font-black hidden sm:block tracking-tight"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              <span
                className={isTransparent ? "text-amber-400" : "text-amber-500"}
              >
                Pitch
              </span>
              <span
                className={
                  isTransparent ? "text-white" : "text-[var(--color-text)]"
                }
              >
                {" "}
                Nepal
              </span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                    isActive
                      ? "bg-amber-500/20 text-amber-400"
                      : `${textColor} ${hoverBg}`
                  }`
                }
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                {link.label}
              </NavLink>
            ))}

            {/* Categories dropdown — click-based */}
            <div className="relative">
              <button
                onClick={() => setCatOpen((o) => !o)}
                className={`flex items-center gap-1 px-4 py-2 rounded-xl font-semibold text-sm transition-all ${textColor} ${hoverBg}`}
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                Categories
                <HiChevronDown
                  className={`w-4 h-4 transition-transform ${catOpen ? "rotate-180" : ""}`}
                />
              </button>
              {catOpen && (
                <div className="absolute top-full left-0 mt-1 w-52 card p-2 animate-slide-down z-50 shadow-lg">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat}
                      to={`/products?category=${cat}`}
                      onClick={() => setCatOpen(false)}
                      className="block px-3 py-2 text-sm rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 transition-colors"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className={`p-2 rounded-xl transition-colors ${hoverBg}`}
            >
              <HiOutlineSearch className={`w-5 h-5 ${iconColor}`} />
            </button>

            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-xl transition-colors ${hoverBg}`}
            >
              {darkMode ? (
                <HiOutlineSun className="w-5 h-5 text-amber-400" />
              ) : (
                <HiOutlineMoon className={`w-5 h-5 ${iconColor}`} />
              )}
            </button>

            {isAuthenticated() && (
              <Link
                to="/wishlist"
                className={`p-2 rounded-xl transition-colors ${hoverBg}`}
              >
                <HiOutlineHeart className={`w-5 h-5 ${iconColor}`} />
              </Link>
            )}

            <button
              onClick={openCart}
              className={`relative p-2 rounded-xl transition-colors ${hoverBg}`}
            >
              <HiOutlineShoppingCart className={`w-5 h-5 ${iconColor}`} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-amber-500 text-white text-[10px] font-bold rounded-full px-1">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>

            {isAuthenticated() ? (
              <div ref={dropRef} className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`flex items-center gap-2 p-1.5 rounded-xl transition-colors ${hoverBg}`}
                >
                  <img
                    src={user?.avatar?.url}
                    alt={user?.name}
                    className="w-7 h-7 rounded-full object-cover border-2 border-amber-400"
                  />
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
                        <p className="font-semibold text-sm truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] truncate">
                          {user?.email}
                        </p>
                        <span className="badge-green mt-1 capitalize text-xs">
                          {user?.role}
                        </span>
                      </div>
                      {[
                        {
                          to: "/profile",
                          icon: <HiOutlineUser className="w-4 h-4" />,
                          label: "My Profile",
                        },
                        {
                          to: "/orders",
                          icon: <HiOutlineShoppingCart className="w-4 h-4" />,
                          label: "My Orders",
                        },
                      ].map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          {item.icon} {item.label}
                        </Link>
                      ))}
                      {isSeller() && (
                        <Link
                          to="/seller/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <HiOutlineChartBar className="w-4 h-4" /> Seller Panel
                        </Link>
                      )}
                      {isAdmin() && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <HiOutlineCog className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}
                      <hr className="my-1 border-[var(--color-border)]" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <HiOutlineLogout className="w-4 h-4" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className={`hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm transition-all border ${
                  isTransparent
                    ? "border-white/40 text-white hover:bg-white/10"
                    : "border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                }`}
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                Login
              </Link>
            )}

            <button
              className={`md:hidden p-2 rounded-xl transition-colors ${hoverBg}`}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <HiOutlineX className={`w-5 h-5 ${iconColor}`} />
              ) : (
                <HiOutlineMenuAlt3 className={`w-5 h-5 ${iconColor}`} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Search overlay */}
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
                  className="w-full pl-12 pr-24 py-4 text-lg rounded-2xl card border-2 border-amber-400 focus:border-amber-500 focus:outline-none bg-white dark:bg-dark-900"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors"
                >
                  Search
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-dark-900 border-b border-[var(--color-border)] px-4 pb-4"
          >
            <div className="flex flex-col gap-1 pt-2">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-xl font-semibold text-sm ${isActive ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600" : "text-[var(--color-text)]"}`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  to={`/products?category=${cat}`}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2 text-sm text-[var(--color-text-muted)] hover:text-amber-600 rounded-xl"
                >
                  › {cat}
                </Link>
              ))}
              {!isAuthenticated() && (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="mt-2 px-4 py-3 bg-amber-500 text-white font-bold rounded-xl text-center text-sm"
                >
                  Login / Register
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
