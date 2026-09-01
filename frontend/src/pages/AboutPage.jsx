// src/pages/AboutPage.jsx — Premium dark editorial brand story without hyphens

import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiArrowRight, HiShieldCheck, HiTruck, HiSparkles, HiChatAlt2 } from 'react-icons/hi'

const STATS = [
  { value: '10K+', label: 'Active Cricketers Equipped' },
  { value: '500+', label: 'Certified Gear In Stock' },
  { value: '7', label: 'Provinces Covered Nationwide' },
  { value: '50+', label: 'Global and Local Brands' },
]

const VALUES = [
  {
    icon: HiShieldCheck,
    title: 'Uncompromised Authenticity',
    desc: 'Every English Willow cleft, titanium grille, and match leather ball is sourced straight from certified master workshops.',
  },
  {
    icon: HiSparkles,
    title: 'Master Craftsmanship',
    desc: 'Hand selected grains, laser balanced pickup weights, and tournament ready knock in options for serious cricketers.',
  },
  {
    icon: HiTruck,
    title: 'Rapid Nationwide Logistics',
    desc: 'From Kathmandu Valley to Far Western outposts, our specialized logistics deliver your gear safely and promptly.',
  },
  {
    icon: HiChatAlt2,
    title: 'Player Concierge Support',
    desc: 'Consult directly with experienced cricket athletes who understand blade weights, sweet spots, and protective fit.',
  },
]

export default function AboutPage() {
  return (
    <div className="pt-16" style={{ background: 'var(--bg-primary)' }}>

      {/* Hero */}
      <section className="relative min-h-[65vh] flex items-center overflow-hidden py-24" style={{
        background: 'radial-gradient(ellipse at 50% 100%, rgba(201,162,39,0.08) 0%, transparent 70%), var(--bg-primary)',
      }}>
        {/* Grid background */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(201,162,39,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,162,39,0.04) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <div className="page-container text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="text-6xl mb-6" style={{ filter: 'drop-shadow(0 0 20px rgba(201,162,39,0.5))' }}>🏏</div>
            <div className="section-label justify-center mb-5">Built By Cricketers For Cricketers</div>
            <h1
              className="mb-6"
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 'clamp(3.5rem, 8vw, 6rem)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--text-primary)',
                lineHeight: '0.95',
              }}
            >
              Elevating Nepal <span className="text-gold-gradient">Cricket Standard</span>
            </h1>
            <p className="text-lg max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              We started PitchNepal to bridge the gap between global cricket engineering and grassroots players
              across every corner of Nepal.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story section */}
      <section className="py-24" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="page-container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="section-label mb-4">Our Heritage</div>
              <h2
                className="mb-6"
                style={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: 'clamp(2.8rem, 5vw, 4rem)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                  lineHeight: '0.95',
                }}
              >
                The Search For <span className="text-gold-gradient">Authentic Gear</span>
              </h2>
              <div className="space-y-4">
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                  For decades, aspiring players across Nepal struggled to access genuine English Willow bats,
                  certified impact protection, and match quality leather balls without exorbitant import fees or counterfeit risks.
                </p>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                  PitchNepal was founded in Kathmandu to build a direct bridge to leading manufacturers including SG,
                  MRF, Kookaburra, GM, SS, and Shrey. Every single piece of equipment in our vault is individually verified
                  for weight balance and construction standards.
                </p>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                  Whether you are stepping into the nets for junior club training or captaining in regional tournaments,
                  we ensure you walk onto the pitch with total confidence.
                </p>
              </div>
              <Link to="/products" className="btn-primary mt-8 inline-flex">
                Explore Equipment Vault <HiArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {STATS.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="card-gold p-6 text-center"
                >
                  <p className="stat-number">{s.value}</p>
                  <p className="text-sm mt-2 font-semibold" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values Pillars */}
      <section className="py-24" style={{ background: 'var(--bg-primary)' }}>
        <div className="page-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <div className="section-label justify-center mb-4">The PitchNepal Standard</div>
            <h2
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--text-primary)',
                lineHeight: '0.95',
              }}
            >
              Built On Four <span className="text-gold-gradient">Pillars</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v, i) => {
              const Icon = v.icon
              return (
                <motion.div
                  key={v.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="card-gold p-6 text-left flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(201,162,39,0.12)', border: '1px solid var(--border)' }}>
                      <Icon className="w-6 h-6" style={{ color: 'var(--gold-400)' }} />
                    </div>
                    <h3 className="font-bold text-lg mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{v.title}</h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>{v.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Direct Inquiry Contact */}
      <section id="contact" className="py-24" style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="page-container">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-10"
            >
              <div className="section-label justify-center mb-4">Player Support Desk</div>
              <h2
                style={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  fontSize: 'clamp(2.8rem, 5vw, 4rem)',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                  lineHeight: '0.95',
                }}
              >
                Connect With Our <span className="text-gold-gradient">Specialists</span>
              </h2>
              <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                Have questions about bat weights, custom team jerseys, or club orders? Send us a message anytime.
              </p>
            </motion.div>

            <div className="card-glass p-8 rounded-2xl" style={{ border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Thank you! Our cricket specialist will contact you shortly.') }}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Full Name</label>
                    <input className="input" placeholder="Your name" required />
                  </div>
                  <div>
                    <label className="label">Contact Number</label>
                    <input className="input" placeholder="+977 9800000000" required />
                  </div>
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input type="email" className="input" placeholder="your@email.com" required />
                </div>
                <div>
                  <label className="label">Subject or Inquiry</label>
                  <input className="input" placeholder="Bat selection, bulk club order, sizing..." required />
                </div>
                <div>
                  <label className="label">Message Details</label>
                  <textarea className="input resize-none" rows={4} placeholder="Tell us about your requirements or game style..." required />
                </div>
                <button type="submit" className="btn-primary w-full py-3.5">Send Player Inquiry</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
