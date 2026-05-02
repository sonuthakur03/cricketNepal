// src/pages/WishlistPage.jsx
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import useWishlistStore from '../context/wishlistStore'
import useAuthStore from '../context/authStore'
import ProductCard from '../components/product/ProductCard'
import { ProductCardSkeleton, EmptyState } from '../components/common/UI'

export default function WishlistPage() {
  const { items, fetchWishlist, clearWishlist, isLoading } = useWishlistStore()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => { if (isAuthenticated()) fetchWishlist() }, [])

  return (
    <div className="page-container pt-24 py-12 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black" style={{ fontFamily: 'Syne, sans-serif' }}>
          My Wishlist ❤️ <span className="text-primary-600">({items.length})</span>
        </h1>
        {items.length > 0 && (
          <button onClick={clearWishlist} className="text-sm text-red-500 hover:text-red-700 font-medium">
            Clear All
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <EmptyState icon="❤️" title="Your wishlist is empty"
          message="Save products you love and come back to them anytime."
          action={<Link to="/products" className="btn-primary">Browse Products</Link>} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
        </div>
      )}
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// src/pages/AboutPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
export function AboutPage() {
  const team = [
    { name: 'Aarav Thapa', role: 'Founder & CEO', emoji: '👨‍💼' },
    { name: 'Priya Shrestha', role: 'Head of Operations', emoji: '👩‍💼' },
    { name: 'Bikash Rai', role: 'Tech Lead', emoji: '👨‍💻' },
    { name: 'Sita Gurung', role: 'Customer Success', emoji: '👩‍🎤' },
  ]

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 to-dark-950 text-white py-24">
        <div className="page-container text-center">
          <span className="text-5xl mb-4 block">🏏</span>
          <h1 className="text-4xl md:text-5xl font-black mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
            About CricketNepal
          </h1>
          <p className="text-primary-200 text-lg max-w-2xl mx-auto">
            We started CricketNepal with one mission: to make premium cricket equipment accessible to every player in Nepal — from the streets of Kathmandu to the fields of Koshi.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="page-container py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-black mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>Our Story</h2>
            <p className="text-[var(--color-text-muted)] leading-relaxed mb-4">
              Founded in 2024 in Kathmandu, CricketNepal was born out of frustration. Quality cricket equipment was either unavailable locally or absurdly expensive to import. We decided to change that.
            </p>
            <p className="text-[var(--color-text-muted)] leading-relaxed mb-4">
              We partner directly with brands like SG, MRF, Kookaburra, GM, and SS — and work with verified local sellers to offer the widest range of cricket gear in Nepal, delivered to your doorstep.
            </p>
            <p className="text-[var(--color-text-muted)] leading-relaxed">
              Today, over 10,000 players across all 7 provinces trust CricketNepal for their gear. And we're just getting started.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '10K+', label: 'Happy Players' },
              { value: '500+', label: 'Products' },
              { value: '7', label: 'Provinces Served' },
              { value: '50+', label: 'Brands Available' },
            ].map((s) => (
              <div key={s.label} className="card p-6 text-center">
                <p className="text-3xl font-black text-primary-600 dark:text-primary-400"
                  style={{ fontFamily: 'Syne, sans-serif' }}>{s.value}</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-slate-50 dark:bg-dark-900/50 py-20">
        <div className="page-container">
          <h2 className="text-3xl font-black mb-10 text-center" style={{ fontFamily: 'Syne, sans-serif' }}>Meet the Team</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {team.map((m) => (
              <div key={m.name} className="card p-6 text-center">
                <div className="text-5xl mb-3">{m.emoji}</div>
                <h3 className="font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>{m.name}</h3>
                <p className="text-sm text-[var(--color-text-muted)]">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="page-container py-20">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Get in Touch</h2>
          <p className="text-[var(--color-text-muted)] mb-8">Have questions? We'd love to hear from you.</p>
          <div className="card p-6 space-y-4 text-left">
            <div>
              <label className="label">Name</label>
              <input className="input" placeholder="Your name" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="your@email.com" />
            </div>
            <div>
              <label className="label">Message</label>
              <textarea className="input resize-none" rows={4} placeholder="How can we help?" />
            </div>
            <button className="btn-primary w-full">Send Message</button>
          </div>
        </div>
      </section>
    </div>
  )
}
