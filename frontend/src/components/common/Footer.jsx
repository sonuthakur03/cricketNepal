// src/components/common/Footer.jsx — Premium dark footer with gold PN logo

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiLocationMarker, HiPhone, HiMail, HiArrowRight } from 'react-icons/hi'
import toast from 'react-hot-toast'
import { validateEmail } from '../../utils/validators'

const FOOTER_LINKS = {
  Shop: [
    { label: 'All Products', to: '/products' },
    { label: 'Cricket Bats', to: '/products?category=Bats' },
    { label: 'Helmets', to: '/products?category=Helmets' },
    { label: 'Gloves & Pads', to: '/products?category=Gloves' },
    { label: 'Balls', to: '/products?category=Balls' },
    { label: 'Jerseys', to: '/products?category=Jerseys' },
  ],
  Company: [
    { label: 'About Us', to: '/about' },
    { label: 'Become a Seller', to: '/register?role=seller' },
    { label: 'My Orders', to: '/orders' },
    { label: 'Wishlist', to: '/wishlist' },
  ],
  Support: [
    { label: 'Help Center', to: '#' },
    { label: 'Return Policy', to: '#' },
    { label: 'Shipping Info', to: '#' },
    { label: 'Privacy Policy', to: '#' },
    { label: 'Terms of Service', to: '#' },
  ],
}

// PN Wicket Logo SVG (inline for footer)
function FooterLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="url(#footerLogoGrad)" />
      <rect x="11" y="9" width="2.5" height="18" rx="1.25" fill="#0a0a0a" />
      <rect x="18.75" y="9" width="2.5" height="18" rx="1.25" fill="#0a0a0a" />
      <rect x="26.5" y="9" width="2.5" height="18" rx="1.25" fill="#0a0a0a" />
      <rect x="9.5" y="7.5" width="7.5" height="2.5" rx="1.25" fill="#0a0a0a" />
      <rect x="21" y="7.5" width="9" height="2.5" rx="1.25" fill="#0a0a0a" />
      <rect x="8" y="27" width="24" height="1.5" rx="0.75" fill="rgba(10,10,10,0.5)" />
      <defs>
        <linearGradient id="footerLogoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ECC84A" />
          <stop offset="50%" stopColor="#C9A227" />
          <stop offset="100%" stopColor="#A07820" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function Footer() {
  return (
    <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
      {/* Main footer */}
      <div className="page-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-5">
              <FooterLogo />
              <div className="flex flex-col leading-none">
                <span
                  className="text-lg font-bold"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}
                >
                  Pitch<span style={{ color: 'var(--gold-400)' }}>Nepal</span>
                </span>
                <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                  Premium Cricket
                </span>
              </div>
            </Link>

            <p className="text-sm mb-6 max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Nepal's most trusted cricket equipment store. World-class brands, authentic products, delivered to your door.
            </p>

            {/* Contact */}
            <div className="space-y-3">
              {[
                { icon: HiLocationMarker, text: 'New Baneshwor, Kathmandu, Nepal' },
                { icon: HiPhone, text: '+977 9800 000 000' },
                { icon: HiMail, text: 'hello@pitchnepal.com' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-2.5">
                  <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--gold-400)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Social */}
            <div className="flex gap-3 mt-6">
              {[
                { label: 'FB', href: '#' },
                { label: 'IG', href: '#' },
                { label: 'TW', href: '#' },
                { label: 'YT', href: '#' },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200 hover:scale-110"
                  style={{
                    background: 'var(--border-subtle)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                    fontFamily: 'var(--font-display)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(201,162,39,0.15)'
                    e.currentTarget.style.color = 'var(--gold-400)'
                    e.currentTarget.style.borderColor = 'rgba(201,162,39,0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--border-subtle)'
                    e.currentTarget.style.color = 'var(--text-muted)'
                    e.currentTarget.style.borderColor = 'var(--border-subtle)'
                  }}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <h4
                className="text-xs font-semibold uppercase tracking-widest mb-5"
                style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-display)', letterSpacing: '0.15em' }}
              >
                {group}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm transition-colors duration-150 hover:text-gold-400 group flex items-center gap-1"
                      style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
                    >
                      <span className="group-hover:translate-x-0.5 transition-transform duration-150">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-16 pt-10" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h4 className="font-semibold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                Get cricket deals straight to your inbox
              </h4>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No spam. Unsubscribe anytime.</p>
            </div>
            <form
              className="flex gap-2 w-full sm:w-auto"
              noValidate
              onSubmit={(e) => {
                e.preventDefault()
                const formElem = e.currentTarget
                const inputElem = formElem.querySelector('input[type="email"]')
                const emailVal = inputElem?.value || ''
                const res = validateEmail(emailVal)
                if (!res.isValid) {
                  toast.error(res.error)
                  return
                }
                toast.success('Subscribed! You are on the VIP cricket deals list 🏏')
                if (inputElem) inputElem.value = ''
              }}
            >
              <input
                type="email"
                placeholder="your@email.com"
                className="input text-sm py-2.5 w-full sm:w-64"
              />
              <button type="submit" aria-label="Subscribe" className="btn-primary px-4 py-2.5 flex-shrink-0">
                <HiArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="page-container py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
            © {new Date().getFullYear()} PitchNepal. All rights reserved. Made with 🏏 in Nepal.
          </p>
          <div className="flex items-center gap-4">
            {['esewa', 'khalti', 'stripe'].map((m) => (
              <span
                key={m}
                className="text-xs px-2 py-1 rounded font-semibold uppercase tracking-wider"
                style={{ background: 'var(--border-subtle)', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
