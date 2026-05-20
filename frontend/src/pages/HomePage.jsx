// src/pages/HomePage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiArrowRight,
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlineCreditCard,
  HiOutlinePhone,
} from "react-icons/hi";
import api from "../utils/api";
import { getErrorMessage } from "../utils/helpers";
import ProductCard from "../components/product/ProductCard";
import { ProductCardSkeleton } from "../components/common/UI";

// ── Category data ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: "Bats", emoji: "🏏", color: "from-green-500 to-emerald-600" },
  { name: "Balls", emoji: "🔴", color: "from-red-500 to-rose-600" },
  { name: "Gloves", emoji: "🧤", color: "from-blue-500 to-blue-600" },
  { name: "Helmets", emoji: "⛑️", color: "from-amber-500 to-orange-600" },
  { name: "Jerseys", emoji: "👕", color: "from-purple-500 to-violet-600" },
  { name: "Shoes", emoji: "👟", color: "from-cyan-500 to-sky-600" },
  { name: "Pads", emoji: "🦵", color: "from-teal-500 to-teal-600" },
  { name: "Accessories", emoji: "🎒", color: "from-pink-500 to-pink-600" },
];

const FEATURES = [
  {
    icon: HiOutlineTruck,
    title: "Free Delivery",
    desc: "On orders above NPR 5,000",
  },
  {
    icon: HiOutlineShieldCheck,
    title: "Genuine Products",
    desc: "100% authentic gear",
  },
  {
    icon: HiOutlineCreditCard,
    title: "Secure Payment",
    desc: "Khalti & eSewa accepted",
  },
  {
    icon: HiOutlinePhone,
    title: "24/7 Support",
    desc: "We're always here for you",
  },
];

// ── Hero Section ──────────────────────────────────────────────────────────────
function HeroSection() {
  return (
    <section
      className="relative min-h-[95vh] flex items-center overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0d0d0a 0%, #1a1a14 45%, #0f1a0e 100%)",
      }}
    >
      {/* Dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle, #D4A843 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Green glow orbs */}
      <div
        className="absolute top-1/3 right-1/3 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 animate-pulse"
        style={{ background: "radial-gradient(circle, #16a34a, transparent)" }}
      />
      <div
        className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-15 animate-pulse"
        style={{
          background: "radial-gradient(circle, #D4A843, transparent)",
          animationDelay: "1.5s",
        }}
      />

      <div className="page-container relative z-10 py-24 grid lg:grid-cols-2 gap-16 items-center">
        {/* ── Left: Text ── */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border text-sm font-semibold mb-8"
            style={{
              borderColor: "rgba(212,168,67,0.4)",
              background: "rgba(212,168,67,0.08)",
              color: "#D4A843",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4A843] animate-ping" />
            Nepal's #1 Cricket Store
          </motion.div>

          <h1
            className="font-black text-white leading-[1.02] mb-6"
            style={{
              fontSize: "clamp(2.8rem, 6vw, 5.5rem)",
              fontFamily: "Playfair Display, serif",
              letterSpacing: "-0.02em",
            }}
          >
            Play Like
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #D4A843, #f4e4a1, #D4A843)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Champions.
            </span>
            <br />
            <span style={{ color: "#b0b0a4" }}>Gear Like Pros.</span>
          </h1>

          <p
            style={{ color: "#8f8f82" }}
            className="text-lg leading-relaxed mb-10 max-w-md"
          >
            From Kathmandu to Koshi — shop authentic cricket equipment, jerseys,
            and gear. Trusted by Nepal's best players.
          </p>

          <div className="flex flex-wrap gap-4 mb-12">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all hover:-translate-y-0.5"
              style={{
                background: "#D4A843",
                color: "#111110",
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}
            >
              Shop All Gear →
            </Link>
            <Link
              to="/products?featured=true"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base transition-all hover:-translate-y-0.5"
              style={{
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#f4f4f0",
                background: "rgba(255,255,255,0.05)",
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}
            >
              Featured Picks
            </Link>
          </div>

          {/* Stats */}
          <div
            className="flex gap-10 pt-8"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            {[
              { value: "500+", label: "Products" },
              { value: "10K+", label: "Happy Players" },
              { value: "7", label: "Provinces" },
            ].map((s) => (
              <div key={s.label}>
                <p
                  className="font-black text-white text-2xl"
                  style={{ fontFamily: "Playfair Display, serif" }}
                >
                  {s.value}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#555549" }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Right: Cricket pitch visual ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:flex items-center justify-center relative"
        >
          {/* Outer glow ring */}
          <div
            className="absolute w-96 h-96 rounded-full opacity-30 animate-pulse"
            style={{
              background:
                "radial-gradient(circle, rgba(22,163,74,0.4) 0%, transparent 70%)",
            }}
          />

          {/* Main circle — cricket pitch green */}
          <div
            className="relative w-80 h-80 rounded-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(145deg, #1a4a1a 0%, #0f3d0f 40%, #0a2e0a 100%)",
              boxShadow:
                "0 0 80px rgba(22,163,74,0.3), 0 0 30px rgba(22,163,74,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {/* Pitch lines */}
            <div className="absolute inset-0 rounded-full overflow-hidden opacity-20">
              <div className="absolute inset-x-0 top-1/2 h-px bg-white/50" />
              <div className="absolute inset-y-0 left-1/2 w-px bg-white/50" />
              <div
                className="absolute w-24 h-24 rounded-full border border-white/30"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%,-50%)",
                }}
              />
            </div>

            {/* Cricket bat SVG — more realistic */}
            <motion.div
              animate={{ rotate: [0, -3, 3, -2, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
              <svg width="120" height="180" viewBox="0 0 120 180" fill="none">
                {/* Blade */}
                <path
                  d="M35 20 Q30 15 32 8 Q38 2 52 2 Q66 2 72 8 Q74 15 69 20 L72 130 Q72 140 60 142 Q48 140 48 130 Z"
                  fill="url(#bladeGrad)"
                />
                {/* Blade grain lines */}
                <line
                  x1="44"
                  y1="15"
                  x2="44"
                  y2="135"
                  stroke="rgba(0,0,0,0.12)"
                  strokeWidth="1"
                />
                <line
                  x1="52"
                  y1="10"
                  x2="52"
                  y2="138"
                  stroke="rgba(0,0,0,0.08)"
                  strokeWidth="1"
                />
                <line
                  x1="60"
                  y1="10"
                  x2="60"
                  y2="138"
                  stroke="rgba(0,0,0,0.08)"
                  strokeWidth="1"
                />
                <line
                  x1="68"
                  y1="15"
                  x2="68"
                  y2="135"
                  stroke="rgba(0,0,0,0.12)"
                  strokeWidth="1"
                />
                {/* Splice */}
                <rect
                  x="48"
                  y="130"
                  width="24"
                  height="12"
                  rx="2"
                  fill="url(#spliceGrad)"
                />
                {/* Handle */}
                <rect
                  x="53"
                  y="142"
                  width="14"
                  height="32"
                  rx="4"
                  fill="url(#handleGrad)"
                />
                {/* Grip bands */}
                {[148, 155, 162, 169].map((y, i) => (
                  <rect
                    key={i}
                    x="53"
                    y={y}
                    width="14"
                    height="2.5"
                    rx="1"
                    fill="rgba(0,0,0,0.3)"
                  />
                ))}
                <defs>
                  <linearGradient id="bladeGrad" x1="35" y1="0" x2="85" y2="0">
                    <stop offset="0%" stopColor="#c8a876" />
                    <stop offset="40%" stopColor="#e8c98a" />
                    <stop offset="100%" stopColor="#b8904a" />
                  </linearGradient>
                  <linearGradient id="spliceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6b4c2a" />
                    <stop offset="100%" stopColor="#4a3020" />
                  </linearGradient>
                  <linearGradient id="handleGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#2a1810" />
                    <stop offset="50%" stopColor="#3d2415" />
                    <stop offset="100%" stopColor="#2a1810" />
                  </linearGradient>
                </defs>
              </svg>
            </motion.div>

            {/* Cricket ball */}
            <motion.div
              animate={{ y: [-4, 4, -4], rotate: [0, 10, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
              className="absolute bottom-10 right-10"
            >
              <svg width="44" height="44" viewBox="0 0 44 44">
                <defs>
                  <radialGradient id="ballGrad" cx="35%" cy="30%">
                    <stop offset="0%" stopColor="#e05555" />
                    <stop offset="60%" stopColor="#c02020" />
                    <stop offset="100%" stopColor="#8b0000" />
                  </radialGradient>
                </defs>
                <circle cx="22" cy="22" r="20" fill="url(#ballGrad)" />
                <path
                  d="M22 4 Q28 14 28 22 Q28 30 22 40"
                  stroke="white"
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.7"
                />
                <path
                  d="M22 4 Q16 14 16 22 Q16 30 22 40"
                  stroke="white"
                  strokeWidth="1.5"
                  fill="none"
                  opacity="0.7"
                />
                {/* seam stitches */}
                {[8, 12, 16, 20, 24, 28, 32, 36].map((y, i) => (
                  <line
                    key={i}
                    x1={i % 2 === 0 ? 19 : 25}
                    y1={y}
                    x2={i % 2 === 0 ? 21 : 27}
                    y2={y + 2}
                    stroke="white"
                    strokeWidth="1"
                    opacity="0.6"
                  />
                ))}
              </svg>
            </motion.div>
          </div>

          {/* Floating brand badges */}
          {[
            { text: "🏏 SG", x: "-15%", y: "5%", delay: 0.6 },
            { text: "Kookaburra 🦘", x: "65%", y: "10%", delay: 0.9 },
            { text: "🇳🇵 Nepal", x: "-20%", y: "80%", delay: 1.1 },
            { text: "MRF ⚡", x: "68%", y: "75%", delay: 1.3 },
          ].map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: b.delay, type: "spring", stiffness: 200 }}
              style={{ position: "absolute", left: b.x, top: b.y }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white backdrop-blur-sm"
              style2={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: "10px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "white",
                  whiteSpace: "nowrap",
                }}
              >
                {b.text}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 60"
          className="w-full"
          style={{ fill: "var(--color-bg)" }}
        >
          <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
        </svg>
      </div>
    </section>
  );
}

// ── Category Grid ─────────────────────────────────────────────────────────────
function CategoryGrid() {
  return (
    <section className="page-container py-16">
      <div className="text-center mb-10">
        <h2 className="section-title">Shop by Category</h2>
        <p className="section-subtitle">
          Find exactly what you need for your game
        </p>
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
            <Link
              to={`/products?category=${cat.name}`}
              className="flex flex-col items-center gap-2.5 p-4 rounded-2xl card hover:shadow-glow-green hover:-translate-y-1 transition-all duration-200 group"
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center text-xl shadow-md group-hover:scale-110 transition-transform`}
              >
                {cat.emoji}
              </div>
              <span
                className="text-xs font-semibold text-center leading-tight"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                {cat.name}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Featured Products ─────────────────────────────────────────────────────────
function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/products?featured=true&limit=8")
      .then(({ data }) => setProducts(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="page-container py-16">
      <div className="flex items-end justify-between mb-10">
        <div>
          <h2 className="section-title">⭐ Featured Picks</h2>
          <p className="section-subtitle">
            Handpicked top gear for serious players
          </p>
        </div>
        <Link
          to="/products?featured=true"
          className="hidden sm:flex items-center gap-1 text-primary-600 dark:text-primary-400 font-semibold text-sm hover:gap-2 transition-all"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          View All <HiArrowRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          : products.map((p, i) => (
              <ProductCard key={p._id} product={p} index={i} />
            ))}
      </div>
    </section>
  );
}

// ── New Arrivals ──────────────────────────────────────────────────────────────
function NewArrivals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/products?sort=newest&limit=4")
      .then(({ data }) => setProducts(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-slate-50 dark:bg-dark-900/50 py-16 mt-8">
      <div className="page-container">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="section-title text-black">🆕 New Arrivals</h2>
            <p className="section-subtitle">Fresh gear just landed</p>
          </div>
          <Link
            to="/products?sort=newest"
            className="hidden sm:flex items-center gap-1 text-primary-600 dark:text-primary-400 font-semibold text-sm"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            View All <HiArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : products.map((p, i) => (
                <ProductCard key={p._id} product={p} index={i} />
              ))}
        </div>
      </div>
    </section>
  );
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
            <h3
              className="font-bold text-sm"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              {f.title}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)]">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Newsletter ────────────────────────────────────────────────────────────────
function Newsletter() {
  const [email, setEmail] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      alert("Thank you for subscribing!");
      setEmail("");
    }
  };
  return (
    <section className="bg-dark-900 py-16 border-t border-dark-800">
      <div className="page-container text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium mb-4">
          🏏 Stay in the Game
        </div>
        <h2
          className="text-3xl font-black text-white mb-3"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Get Exclusive Deals & Drops
        </h2>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          New arrivals, cricket tips, and member-only discounts — straight to
          your inbox.
        </p>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email..."
            className="flex-1 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
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
  );
}
