// src/pages/HomePage.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiArrowRight, HiOutlineTruck, HiOutlineShieldCheck, HiOutlineCreditCard, HiOutlinePhone } from 'react-icons/hi'
import api from '../utils/api'
import { getErrorMessage } from '../utils/helpers'
import ProductCard from '../components/product/ProductCard'
import { ProductCardSkeleton } from '../components/common/UI'

// ── Category data ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Bats',       emoji: '🏏', color: 'from-green-500 to-emerald-600' },
  { name: 'Balls',      emoji: '🔴', color: 'from-red-500 to-rose-600' },
  { name: 'Gloves',     emoji: '🧤', color: 'from-blue-500 to-blue-600' },
  { name: 'Helmets',    emoji: '⛑️', color: 'from-amber-500 to-orange-600' },
  { name: 'Jerseys',    emoji: '👕', color: 'from-purple-500 to-violet-600' },
  { name: 'Shoes',      emoji: '👟', color: 'from-cyan-500 to-sky-600' },
  { name: 'Pads',       emoji: '🦵', color: 'from-teal-500 to-teal-600' },
  { name: 'Accessories',emoji: '🎒', color: 'from-pink-500 to-pink-600' },
]

const FEATURES = [
  { icon: HiOutlineTruck,        title: 'Free Delivery',    desc: 'On orders above NPR 5,000' },
  { icon: HiOutlineShieldCheck,  title: 'Genuine Products', desc: '100% authentic gear' },
  { icon: HiOutlineCreditCard,   title: 'Secure Payment',   desc: 'Khalti & eSewa accepted' },
  { icon: HiOutlinePhone,        title: '24/7 Support',     desc: 'We\'re always here for you' },
]

// ── Hero Section ──────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-dark-950">
      {/* Animated background */}
      <div className="absolute inset-0 bg-cricket-pattern opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900/95 to-primary-950/80" />

      {/* Glowing orbs */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: '1s' }} />

      <div className="page-container relative z-10 py-20 grid lg:grid-cols-2 gap-12 items-center">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-900/50 border border-primary-700/50 text-primary-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-ping" />
            Nepal's #1 Cricket Store
          </motion.span>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            Play Like
            <br />
            <span className="gradient-text">Champions.</span>
            <br />
            <span className="text-slate-300">Gear Like Pros.</span>
          </h1>

          <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-md">
            From Kathmandu to Koshi — shop authentic cricket equipment, jerseys, and gear. Trusted by Nepal's best players.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link to="/products" className="btn-primary text-base px-8 py-4 shadow-glow-green">
              Shop All Gear →
            </Link>
            <Link to="/products?featured=true" className="btn-secondary text-base px-8 py-4 border-slate-600 text-slate-300 hover:border-primary-500 hover:text-white">
              Featured Picks
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-10 pt-8 border-t border-slate-800">
            {[
              { value: '500+', label: 'Products' },
              { value: '10K+', label: 'Happy Players' },
              { value: '7',    label: 'Provinces Delivered' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden lg:flex items-center justify-center relative"
        >
          {/* Central cricket ball */}
          <div className="relative w-80 h-80">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/30 to-primary-800/20 rounded-full blur-2xl animate-pulse" />
            <div className="absolute inset-8 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full shadow-2xl shadow-primary-900/50 flex items-center justify-center">
              <span className="text-8xl filter drop-shadow-lg">🏏</span>
            </div>
            {/* Floating badges */}
            {[
              { text: 'SG Bats', top: '0%', left: '10%', delay: 0 },
              { text: 'Kookaburra', top: '15%', right: '0%', delay: 0.3 },
              { text: 'Nepal 🇳🇵', bottom: '10%', left: '0%', delay: 0.6 },
              { text: 'MRF', bottom: '20%', right: '5%', delay: 0.9 },
            ].map((badge, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + badge.delay, type: 'spring' }}
                style={{ position: 'absolute', top: badge.top, bottom: badge.bottom, left: badge.left, right: badge.right }}
                className="bg-dark-800/80 backdrop-blur-sm border border-primary-700/40 rounded-xl px-3 py-1.5 text-white text-xs font-semibold shadow-lg"
              >
                {badge.text}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" className="w-full fill-[var(--color-bg)]">
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </div>
    </section>
  )
}

// ── Category Grid ─────────────────────────────────────────────────────────────
function CategoryGrid() {
  return (
    <section className="page-container py-16">
      <div className="text-center mb-10">
        <h2 className="section-title">Shop by Category</h2>
        <p className="section-subtitle">Find exactly what you need for your game</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
          >
            <Link to={`/products?category=${cat.name}`}
              className="flex flex-col items-center gap-2.5 p-4 rounded-2xl card hover:shadow-glow-green hover:-translate-y-1 transition-all duration-200 group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform`}>
                {cat.emoji}
              </div>
              <span className="text-xs font-semibold text-center leading-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
                {cat.name}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ── Featured Products ─────────────────────────────────────────────────────────
function FeaturedProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/products?featured=true&limit=8')
      .then(({ data }) => setProducts(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="page-container py-16">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="section-title">⭐ Featured Picks</h2>
          <p className="section-subtitle">Handpicked top gear for serious players</p>
        </div>
        <Link to="/products?featured=true"
          className="hidden sm:flex items-center gap-1 text-primary-600 dark:text-primary-400 font-semibold text-sm hover:gap-2 transition-all"
          style={{ fontFamily: 'Syne, sans-serif' }}>
          View All <HiArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)
        }
      </div>
    </section>
  )
}

// ── New Arrivals ──────────────────────────────────────────────────────────────
function NewArrivals() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/products?sort=newest&limit=4')
      .then(({ data }) => setProducts(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="bg-slate-50 dark:bg-dark-900/50 py-16 mt-8">
      <div className="page-container">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="section-title">🆕 New Arrivals</h2>
            <p className="section-subtitle">Fresh gear just landed</p>
          </div>
          <Link to="/products?sort=newest"
            className="hidden sm:flex items-center gap-1 text-primary-600 dark:text-primary-400 font-semibold text-sm"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            View All <HiArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)
          }
        </div>
      </div>
    </section>
  )
}

// ── Features Strip ────────────────────────────────────────────────────────────
function FeaturesStrip() {
  return (
    <section className="page-container py-16">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="flex flex-col items-center text-center gap-3 p-6 card"
          >
            <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
              <f.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{f.title}</h3>
            <p className="text-xs text-[var(--color-text-muted)]">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

// ── Newsletter ────────────────────────────────────────────────────────────────
function Newsletter() {
  const [email, setEmail] = useState('')
  const handleSubmit = (e) => {
    e.preventDefault()
    if (email) {
      alert('Thank you for subscribing!')
      setEmail('')
    }
  }
  return (
    <section className="bg-gradient-to-r from-primary-700 to-primary-600 py-16">
      <div className="page-container text-center">
        <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
          Stay in the Game 🏏
        </h2>
        <p className="text-primary-100 mb-6">Subscribe for exclusive deals, new arrivals, and cricket tips</p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email..."
            className="flex-1 px-5 py-3 rounded-xl bg-white/10 border border-white/30 text-white placeholder-primary-200 focus:outline-none focus:border-white transition-colors" />
          <button type="submit" className="px-6 py-3 bg-white text-primary-700 font-bold rounded-xl hover:bg-primary-50 transition-colors"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            Subscribe
          </button>
        </form>
      </div>
    </section>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <FeaturesStrip />
      <CategoryGrid />
      <FeaturedProducts />
      <NewArrivals />
      <Newsletter />
    </div>
  )
}
