// src/pages/HomePage.jsx — Lightweight 2D hero redesign with Bebas Neue + Outfit typography, clean hyphen-free copy

import { useRef, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { HiArrowRight, HiStar, HiOutlineArrowRight } from 'react-icons/hi'
import api from '../utils/api'
import { formatPrice } from '../utils/helpers'
import { StarRating } from '../components/common/UI'
import useCartStore from '../context/cartStore'
import useAuthStore from '../context/authStore'
import toast from 'react-hot-toast'

/* ── Animated counter ─────────────────────────────────────────── */
function Counter({ end, suffix = '', duration = 2 }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true) }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!started) return
    const step = end / (duration * 60)
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + step, end)
      setCount(Math.floor(current))
      if (current >= end) clearInterval(timer)
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [started, end, duration])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

/* ── Product Card (redesigned) ───────────────────────────────── */
function ProductCard({ product, index = 0 }) {
  const [hovered, setHovered] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const finalPrice = product.discountPrice > 0 ? product.discountPrice : product.price
  const hasDiscount = product.discountPrice > 0
  const discount = hasDiscount ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        animate={{ rotateY: hovered ? 2 : 0, rotateX: hovered ? -2 : 0, scale: hovered ? 1.02 : 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="card-hover overflow-hidden"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Image */}
        <Link to={`/products/${product.slug || product._id}`} className="block relative overflow-hidden aspect-square bg-[#111]">
          <img
            src={product.images?.[0]?.url || '/images/products/bat.jpg'}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {hasDiscount && <span className="badge badge-red text-[10px]">{discount}% OFF</span>}
            {product.isFeatured && <span className="badge badge-gold text-[10px]">⭐ Featured</span>}
            {product.stock === 0 && <span className="badge text-[10px]" style={{ background: 'rgba(0,0,0,0.7)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>Sold Out</span>}
          </div>
        </Link>

        {/* Info */}
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-display)', letterSpacing: '0.12em' }}>
            {product.brand}
          </p>
          <Link to={`/products/${product.slug || product._id}`}>
            <h3 className="text-sm font-semibold leading-snug line-clamp-2 mb-2 transition-colors duration-150 group-hover:text-gold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              {product.name}
            </h3>
          </Link>
          <StarRating rating={product.rating} count={product.numReviews} />
          <div className="flex items-center gap-2 mt-2">
            <span className="text-base font-bold" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-mono)' }}>{formatPrice(finalPrice)}</span>
            {hasDiscount && <span className="text-xs line-through" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{formatPrice(product.price)}</span>}
          </div>
        </div>

        {/* Add to cart */}
        <div className="px-4 pb-4">
          <button
            onClick={() => {
              if (product.stock === 0) return
              addItem(product, 1)
              toast.success(`${product.name.substring(0, 25)} added!`, {
                style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
                iconTheme: { primary: 'var(--gold-400)', secondary: '#000' },
              })
            }}
            disabled={product.stock === 0}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${product.stock === 0 ? 'cursor-not-allowed' : 'btn-primary'}`}
            style={product.stock === 0 ? { background: 'var(--bg-secondary)', color: 'var(--text-muted)' } : {}}
          >
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Category Card ───────────────────────────────────────────── */
const CATEGORIES = [
  { name: 'Bats', emoji: '🏏', desc: 'English Willow and Kashmir' },
  { name: 'Helmets', emoji: '⛑️', desc: 'Titanium and Composite' },
  { name: 'Gloves', emoji: '🧤', desc: 'Batting and Wicket Keeping' },
  { name: 'Balls', emoji: '🔴', desc: 'Match Leather Balls' },
  { name: 'Pads', emoji: '🦵', desc: 'Lightweight Leg Guards' },
  { name: 'Jerseys', emoji: '👕', desc: 'Custom and Team Kits' },
  { name: 'Shoes', emoji: '👟', desc: 'Spike and Turf Shoes' },
  { name: 'Bags', emoji: '🎒', desc: 'Duffle and Wheelie Bags' },
]

function CategoryCard({ cat, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
    >
      <Link to={`/products?category=${cat.name}`} className="group block">
        <motion.div
          whileHover={{ scale: 1.04, y: -4 }}
          transition={{ duration: 0.25 }}
          className="card-gold p-5 flex flex-col items-center text-center gap-3 cursor-pointer"
          style={{ minHeight: '140px' }}
        >
          <div
            className="text-4xl transition-transform duration-300 group-hover:scale-110"
            style={{ filter: 'drop-shadow(0 0 12px rgba(201,162,39,0.4))' }}
          >
            {cat.emoji}
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              {cat.name}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{cat.desc}</p>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}

/* ── Testimonial ─────────────────────────────────────────────── */
/* ── Lightweight 2D PitchNepal Hero Emblem ────────────────────── */
function PitchNepalHeroEmblem2D() {
  return (
    <div className="relative w-full max-w-lg mx-auto aspect-square flex items-center justify-center select-none">
      {/* Background ambient gold radial glow */}
      <div
        className="absolute inset-0 rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, var(--gold-400) 0%, rgba(201,162,39,0.05) 60%, transparent 80%)',
        }}
      />

      {/* Outer Dashed Orbit Ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
        className="absolute w-[86%] h-[86%] rounded-full border border-dashed pointer-events-none"
        style={{ borderColor: 'rgba(201, 162, 39, 0.25)' }}
      />

      {/* Inner Rotating Ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
        className="absolute w-[74%] h-[74%] rounded-full border pointer-events-none"
        style={{ borderColor: 'rgba(201, 162, 39, 0.15)' }}
      />

      {/* Center 2D Medallion Card */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.03 }}
        className="relative z-10 w-[65%] h-[65%] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-2xl backdrop-blur-xl"
        style={{
          background: 'linear-gradient(145deg, rgba(24, 24, 24, 0.95) 0%, rgba(10, 10, 10, 0.98) 100%)',
          border: '1.5px solid rgba(201, 162, 39, 0.4)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(201, 162, 39, 0.15)',
        }}
      >
        {/* Golden Wicket & Seam SVG */}
        <div className="relative mb-3 flex items-center justify-center">
          <svg
            className="w-20 h-20 filter drop-shadow-[0_4px_12px_rgba(201,162,39,0.45)]"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Top Bail */}
            <rect x="22" y="16" width="56" height="5" rx="2.5" fill="url(#goldGradient)" />
            {/* Stumps */}
            <rect x="28" y="24" width="7" height="60" rx="3.5" fill="url(#goldGradient)" />
            <rect x="46.5" y="24" width="7" height="60" rx="3.5" fill="url(#goldGradient)" />
            <rect x="65" y="24" width="7" height="60" rx="3.5" fill="url(#goldGradient)" />
            {/* Cricket Seam Accent Orbit */}
            <path
              d="M 12 50 C 12 28, 88 28, 88 50 C 88 72, 12 72, 12 50"
              stroke="url(#goldGradient)"
              strokeWidth="2"
              strokeDasharray="4 3"
              opacity="0.6"
            />
            <defs>
              <linearGradient id="goldGradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#F5E490" />
                <stop offset="50%" stopColor="#C9A227" />
                <stop offset="100%" stopColor="#8A6B0E" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Monogram Brand Headline */}
        <h3
          className="text-2xl font-bold tracking-wider uppercase mb-1"
          style={{
            fontFamily: '"Bebas Neue", sans-serif',
            letterSpacing: '0.08em',
            background: 'linear-gradient(135deg, #FFF 20%, #F5E490 60%, #C9A227 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          PITCH NEPAL
        </h3>
        <p
          className="text-[11px] font-semibold tracking-widest uppercase"
          style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-heading)', letterSpacing: '0.15em' }}
        >
          Est. 2024 · Kathmandu
        </p>
      </motion.div>

      {/* Floating Badge 1 - Top Right */}
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-6 right-0 sm:right-2 z-20 px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-xl backdrop-blur-md"
        style={{
          background: 'rgba(20, 20, 20, 0.9)',
          border: '1px solid rgba(201, 162, 39, 0.35)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        }}
      >
        <span className="text-base">🏏</span>
        <div>
          <p className="text-[10px] text-muted uppercase font-bold" style={{ letterSpacing: '0.05em' }}>Grade 1</p>
          <p className="text-xs font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>English Willow</p>
        </div>
      </motion.div>

      {/* Floating Badge 2 - Bottom Left */}
      <motion.div
        animate={{ y: [4, -4, 4] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-8 left-0 sm:left-2 z-20 px-3.5 py-2 rounded-2xl flex items-center gap-2 shadow-xl backdrop-blur-md"
        style={{
          background: 'rgba(20, 20, 20, 0.9)',
          border: '1px solid rgba(201, 162, 39, 0.35)',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        }}
      >
        <span className="text-base">🇳🇵</span>
        <div>
          <p className="text-[10px] text-muted uppercase font-bold" style={{ letterSpacing: '0.05em' }}>Nationwide</p>
          <p className="text-xs font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>7 Provinces Delivery</p>
        </div>
      </motion.div>
    </div>
  )
}

/* ── Testimonial ─────────────────────────────────────────────── */
const TESTIMONIALS = [
  { name: 'Rohan Thapa', role: 'Club Captain, Lalitpur CC', text: 'PitchNepal has the best selection of SG bats in all of Nepal. Top quality, fast delivery!', rating: 5 },
  { name: 'Priya Sharma', role: 'Kathmandu Cricket Academy', text: 'Finally a store that stocks authentic gear. Got my gloves and bat in pristine condition!', rating: 5 },
  { name: 'Bikash Rai', role: 'U19 Player, Biratnagar', text: 'Best prices for Kookaburra equipment across Nepal. Highly recommend PitchNepal.', rating: 5 },
]

/* ── Main HomePage ───────────────────────────────────────────── */
export default function HomePage() {
  const [featured, setFeatured] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])

  useEffect(() => {
    api.get('/products?featured=true&limit=8')
      .then(({ data }) => setFeatured(data.data || []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false))
  }, [])

  return (
    <div className="relative overflow-x-hidden" style={{ background: 'var(--bg-primary)' }}>

      {/* ═══════════════════════════════════════════════════
          HERO SECTION — Lightweight 2D Emblem + Parallax
      ════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(201,162,39,0.06) 0%, rgba(8,8,8,0) 70%), var(--bg-primary)' }}
      >
        {/* Background grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(220,38,38,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Vibrant sports radial glows */}
        <div className="absolute top-1/3 right-[20%] w-[500px] h-[500px] rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: 'radial-gradient(circle, #DC2626 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 left-[10%] w-[450px] h-[450px] rounded-full blur-3xl opacity-15 pointer-events-none" style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)' }} />

        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="page-container relative z-10 grid lg:grid-cols-2 gap-12 items-center pt-20 pb-16">
          {/* Text */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="section-label mb-6"
            >
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              Nepal Premier Cricket Destination
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="mb-6"
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 'clamp(3.5rem, 7vw, 6.5rem)',
                letterSpacing: '0.05em',
                lineHeight: '0.95',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ color: 'var(--text-primary)' }}>Play Like</span>
              <br />
              <span className="text-gold-gradient">Legends</span>
              <span style={{ color: 'var(--text-primary)' }}>.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-lg mb-8 max-w-lg"
              style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}
            >
              From English Willow bats to titanium helmets, world class cricket equipment
              delivered across all 7 provinces of Nepal.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap gap-3"
            >
              <Link to="/products" className="btn-primary text-base px-8 py-3.5">
                Shop Now <HiArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/about" className="btn-secondary text-base px-8 py-3.5">
                Our Story
              </Link>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="flex flex-wrap gap-6 mt-10"
            >
              {[
                { label: 'Free shipping', sub: 'Orders above NPR 5,000' },
                { label: 'Authentic gear', sub: 'Verified original brands' },
                { label: 'Fast delivery', sub: 'Across all Nepal' },
              ].map((t) => (
                <div key={t.label} className="flex items-center gap-2">
                  <div className="w-1.5 h-6 rounded-full" style={{ background: 'linear-gradient(to bottom, var(--gold-300), var(--gold-500))' }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{t.label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.sub}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Lightweight 2D Website Logo Emblem */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex items-center justify-center py-6"
          >
            <PitchNepalHeroEmblem2D />
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <p className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>Scroll</p>
          <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, var(--gold-400), transparent)' }} />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="page-container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { val: 10000, suf: '+', label: 'Players Equipped' },
              { val: 500, suf: '+', label: 'Products In Stock' },
              { val: 7, suf: '', label: 'Provinces Covered' },
              { val: 50, suf: '+', label: 'Brands Available' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="stat-number">
                  <Counter end={s.val} suffix={s.suf} />
                </div>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CATEGORIES SECTION
      ════════════════════════════════════════════════════ */}
      <section className="py-24" style={{ background: 'var(--bg-primary)' }}>
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="section-label justify-center mb-4">Shop By Category</div>
            <h2
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-primary)',
                lineHeight: '0.95',
              }}
            >
              Everything You{' '}
              <span className="text-gold-gradient">Need</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.map((cat, i) => <CategoryCard key={cat.name} cat={cat} index={i} />)}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          FEATURED PRODUCTS
      ════════════════════════════════════════════════════ */}
      <section className="py-24" style={{ background: 'var(--bg-secondary)' }}>
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4"
          >
            <div>
              <div className="section-label mb-3">Handpicked For You</div>
              <h2
                style={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                  lineHeight: '0.95',
                }}
              >
                Featured <span className="text-gold-gradient">Gear</span>
              </h2>
            </div>
            <Link to="/products?featured=true" className="btn-secondary gap-2 flex-shrink-0">
              View All <HiOutlineArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {loadingProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="skeleton aspect-square" />
                  <div className="p-4 space-y-2">
                    <div className="skeleton h-3 w-1/3 rounded" />
                    <div className="skeleton h-4 w-full rounded" />
                    <div className="skeleton h-3 w-2/3 rounded" />
                    <div className="skeleton h-8 w-full rounded-xl mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {featured.map((product, i) => <ProductCard key={product._id} product={product} index={i} />)}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          BRAND STORY BAND
      ════════════════════════════════════════════════════ */}
      <section className="py-28 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <div
          className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(139,90,43,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(201,162,39,0.06) 0%, transparent 60%)' }}
        />
        <div className="page-container relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: big headline */}
            <div>
              <div className="section-label mb-5">Our Mission</div>
              <h2
                className="leading-none mb-6"
                style={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: 'clamp(3rem, 6vw, 4.5rem)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                <span style={{ color: 'var(--text-primary)' }}>Cricket</span>
                <br />
                <span className="text-gold-gradient">Without</span>
                <br />
                <span style={{ color: 'var(--text-primary)' }}>Compromise</span>
              </h2>
              <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                We built PitchNepal because Nepal cricket players deserved world class equipment at fair prices.
                No compromise on quality. No compromise on service. Pure cricket passion.
              </p>
              <Link to="/about" className="btn-primary">
                Our Story <HiArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Right: feature list */}
            <div className="space-y-4">
              {[
                { icon: '🏆', title: 'Authentic Brands Only', desc: 'Every product is sourced directly from verified manufacturers including SG, MRF, Kookaburra, GM, and SS.' },
                { icon: '🚚', title: 'Nationwide Delivery', desc: 'Fast shipping across all 77 districts in Nepal, from Kathmandu to Karnali.' },
                { icon: '↩️', title: 'Hassle Free Returns', desc: '7 days return guarantee on all products if you are not completely satisfied.' },
                { icon: '💬', title: 'Expert Guidance', desc: 'Seasoned cricket specialists ready to assist you in choosing the ideal gear.' },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.4 }}
                  className="card-gold p-4 flex gap-4 items-start"
                >
                  <div className="text-2xl flex-shrink-0">{f.icon}</div>
                  <div>
                    <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{f.title}</p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════════ */}
      <section className="py-24" style={{ background: 'var(--bg-secondary)' }}>
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="section-label justify-center mb-4">Player Reviews</div>
            <h2
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-primary)',
                lineHeight: '0.95',
              }}
            >
              Trusted By <span className="text-gold-gradient">Champions</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="card-glass p-6"
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.rating)].map((_, j) => <HiStar key={j} className="w-4 h-4" style={{ color: 'var(--gold-400)' }} />)}
                </div>
                <p className="text-base mb-5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: 'rgba(201,162,39,0.15)', color: 'var(--gold-400)', fontFamily: 'var(--font-heading)' }}
                  >
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          CTA SECTION
      ════════════════════════════════════════════════════ */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(201,162,39,0.1) 0%, transparent 70%)' }} />
        <div className="page-container text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="section-label justify-center mb-5">Premier Equipment</p>
            <h2
              className="mb-6"
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 'clamp(3.2rem, 6vw, 5.5rem)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--text-primary)',
                lineHeight: '0.95',
              }}
            >
              Ready to <span className="text-gold-gradient">Gear Up?</span>
            </h2>
            <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Browse Nepal premier collection of authentic cricket equipment. Free shipping on orders above NPR 5,000.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/products"
                className="btn-primary text-base px-10 py-4 animate-pulse-gold"
              >
                Shop the Collection <HiArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/register?role=seller" className="btn-secondary text-base px-10 py-4">
                Become a Seller
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  )
}
