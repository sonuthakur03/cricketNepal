// src/pages/ProductsPage.jsx — Redesigned luxury Shop & Equipment Vault with advanced filters and zero hyphens

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HiOutlineAdjustments, HiOutlineX, HiOutlineSearch,
  HiOutlineTag, HiOutlineCurrencyRupee, HiStar, HiOutlineCheck
} from 'react-icons/hi'
import api from '../utils/api'
import { PRODUCT_CATEGORIES, formatPrice } from '../utils/helpers'
import ProductCard from '../components/product/ProductCard'
import { ProductCardSkeleton, Pagination } from '../components/common/UI'

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest Releases' },
  { value: 'popular',    label: 'Most Popular' },
  { value: 'rating',     label: 'Highest Rated' },
  { value: 'price-asc',  label: 'Price Low to High' },
  { value: 'price-desc', label: 'Price High to Low' },
]

const CATEGORY_ITEMS = [
  { name: 'All', icon: '⚡' },
  { name: 'Bats', icon: '🏏' },
  { name: 'Balls', icon: '🔴' },
  { name: 'Gloves', icon: '🧤' },
  { name: 'Pads', icon: '🦵' },
  { name: 'Helmets', icon: '⛑️' },
  { name: 'Jerseys', icon: '👕' },
  { name: 'Shoes', icon: '👟' },
  { name: 'Bags', icon: '🎒' },
]

const PRICE_PRESETS = [
  { label: 'Under NPR 3000', min: '', max: '3000' },
  { label: 'NPR 3000 to NPR 7000', min: '3000', max: '7000' },
  { label: 'NPR 7000 to NPR 15000', min: '7000', max: '15000' },
  { label: 'Above NPR 15000', min: '15000', max: '' },
]

// ── Filter Sidebar Component ──────────────────────────────────────────────────
function FilterSidebar({ filters, onChange, brands, onClear }) {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <HiOutlineTag className="w-4 h-4 text-gold-400" style={{ color: 'var(--gold-400)' }} />
          <h3 className="font-semibold text-xs uppercase tracking-widest" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-display)', letterSpacing: '0.12em' }}>
            Equipment Category
          </h3>
        </div>
        <div className="space-y-1">
          {PRODUCT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onChange('category', filters.category === cat ? '' : cat)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-150 text-left"
              style={{
                background: filters.category === cat ? 'rgba(201,162,39,0.12)' : 'transparent',
                color: filters.category === cat ? 'var(--gold-300)' : 'var(--text-secondary)',
                border: filters.category === cat ? '1px solid var(--border)' : '1px solid transparent',
                fontFamily: 'var(--font-heading)',
              }}
            >
              <span>{cat}</span>
              {filters.category === cat && <HiOutlineCheck className="w-4 h-4" style={{ color: 'var(--gold-400)' }} />}
            </button>
          ))}
        </div>
      </div>

      <div className="divider-gold opacity-20" />

      {/* Price Range */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <HiOutlineCurrencyRupee className="w-4 h-4 text-gold-400" style={{ color: 'var(--gold-400)' }} />
          <h3 className="font-semibold text-xs uppercase tracking-widest" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-display)', letterSpacing: '0.12em' }}>
            Price Range NPR
          </h3>
        </div>

        {/* Min Max Inputs */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-[10px] uppercase font-semibold text-muted block mb-1" style={{ color: 'var(--text-muted)' }}>Min NPR</label>
            <input
              type="number"
              placeholder="0"
              value={filters.minPrice}
              onChange={(e) => onChange('minPrice', e.target.value)}
              className="input py-2 text-xs"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-semibold text-muted block mb-1" style={{ color: 'var(--text-muted)' }}>Max NPR</label>
            <input
              type="number"
              placeholder="25000"
              value={filters.maxPrice}
              onChange={(e) => onChange('maxPrice', e.target.value)}
              className="input py-2 text-xs"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>

        {/* Quick price presets */}
        <div className="space-y-1.5">
          {PRICE_PRESETS.map((r) => {
            const active = filters.minPrice === r.min && filters.maxPrice === r.max
            return (
              <button
                key={r.label}
                onClick={() => {
                  if (active) {
                    onChange('minPrice', '')
                    onChange('maxPrice', '')
                  } else {
                    onChange('minPrice', r.min)
                    onChange('maxPrice', r.max)
                  }
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all flex items-center justify-between"
                style={{
                  background: active ? 'rgba(201,162,39,0.15)' : 'rgba(255,255,255,0.03)',
                  color: active ? 'var(--gold-300)' : 'var(--text-muted)',
                  border: active ? '1px solid var(--border)' : '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                <span>{r.label}</span>
                {active && <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gold-400)' }} />}
              </button>
            )
          })}
        </div>
      </div>

      <div className="divider-gold opacity-20" />

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <h3 className="font-semibold text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-display)', letterSpacing: '0.12em' }}>
            Brand Manufacturer
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {brands.map((brand) => {
              const checked = filters.brands.includes(brand)
              return (
                <label
                  key={brand}
                  className="flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors"
                  style={{
                    background: checked ? 'rgba(201,162,39,0.08)' : 'transparent',
                    border: checked ? '1px solid var(--border)' : '1px solid transparent',
                  }}
                >
                  <span className="text-sm font-medium" style={{ color: checked ? 'var(--gold-300)' : 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>
                    {brand}
                  </span>
                  <input
                    type="checkbox"
                    value={brand}
                    checked={checked}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...filters.brands, brand]
                        : filters.brands.filter((b) => b !== brand)
                      onChange('brands', next)
                    }}
                    className="w-4 h-4 rounded accent-gold-400"
                    style={{ accentColor: 'var(--gold-400)' }}
                  />
                </label>
              )
            })}
          </div>
        </div>
      )}

      <div className="divider-gold opacity-20" />

      {/* Rating */}
      <div>
        <h3 className="font-semibold text-xs uppercase tracking-widest mb-3" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-display)', letterSpacing: '0.12em' }}>
          Minimum Rating
        </h3>
        <div className="space-y-1">
          {[4, 3].map((r) => {
            const active = Number(filters.rating) === r
            return (
              <button
                key={r}
                onClick={() => onChange('rating', active ? '' : String(r))}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all"
                style={{
                  background: active ? 'rgba(201,162,39,0.12)' : 'transparent',
                  border: active ? '1px solid var(--border)' : '1px solid transparent',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-0.5">
                    {Array.from({ length: r }).map((_, i) => (
                      <HiStar key={i} className="w-4 h-4 text-gold-400" style={{ color: 'var(--gold-400)' }} />
                    ))}
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>and above</span>
                </div>
                {active && <HiOutlineCheck className="w-4 h-4" style={{ color: 'var(--gold-400)' }} />}
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={onClear}
        className="btn-secondary w-full py-2.5 text-xs font-semibold uppercase tracking-wider mt-4"
        style={{ letterSpacing: '0.08em' }}
      >
        Reset All Filters
      </button>
    </div>
  )
}

// ── Main ProductsPage Component ───────────────────────────────────────────────
export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [brands, setBrands] = useState([])
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    brands: searchParams.get('brand') ? searchParams.get('brand').split(',') : [],
    rating: searchParams.get('rating') || '',
  })
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [searchInput, setSearchInput] = useState(searchParams.get('keyword') || '')

  useEffect(() => {
    api.get('/products/meta').then(({ data }) => setBrands(data.data.brands || [])).catch(() => {})
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (keyword) params.set('keyword', keyword)
      if (filters.category) params.set('category', filters.category)
      if (filters.minPrice) params.set('minPrice', filters.minPrice)
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice)
      if (filters.brands.length) params.set('brand', filters.brands.join(','))
      if (filters.rating) params.set('rating', filters.rating)
      if (searchParams.get('featured')) params.set('featured', 'true')
      params.set('sort', sort)
      params.set('page', page)
      params.set('limit', 12)

      const { data } = await api.get(`/products?${params}`)
      setProducts(data.data || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
    } catch {}
    finally { setLoading(false) }
  }, [filters, sort, page, keyword, searchParams])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({ category: '', minPrice: '', maxPrice: '', brands: [], rating: '' })
    setKeyword('')
    setSearchInput('')
    setPage(1)
    setSearchParams({})
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setKeyword(searchInput)
    setPage(1)
  }

  const activeFilterCount = [
    filters.category, filters.minPrice, filters.maxPrice,
    ...filters.brands, filters.rating, keyword,
  ].filter(Boolean).length

  return (
    <div className="page-container py-8 pt-24 min-h-screen" style={{ background: 'var(--bg-primary)' }}>

      {/* Header Banner */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <div className="section-label mb-2">Nepal Premier Gear Selection</div>
            <h1
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--text-primary)',
                lineHeight: '0.95',
              }}
            >
              {filters.category ? `${filters.category} Collection` : keyword ? `Search Results for "${keyword}"` : 'Equipment Vault'}
            </h1>
            {!loading && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
                Showing {total} authenticated cricket products ready for nationwide dispatch
              </p>
            )}
          </div>

          {/* Search + Sort Controls */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Box */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
              <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--gold-400)' }} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search bats, gloves, shoes..."
                className="input pl-10 py-2.5 text-xs"
              />
            </form>

            {/* Sort Select */}
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1) }}
              className="select py-2.5 text-xs w-auto flex-shrink-0"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden relative flex items-center gap-2 btn-secondary py-2.5 px-4 text-xs font-semibold flex-shrink-0"
            >
              <HiOutlineAdjustments className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center" style={{ background: 'var(--gold-400)', color: '#000' }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Category Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto py-4 custom-scrollbar">
          {CATEGORY_ITEMS.map((item) => {
            const isAll = item.name === 'All'
            const active = isAll ? !filters.category : filters.category === item.name
            return (
              <button
                key={item.name}
                onClick={() => handleFilterChange('category', isAll ? '' : item.name)}
                className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 flex-shrink-0 transition-all duration-200"
                style={{
                  background: active ? 'linear-gradient(135deg, var(--gold-300), var(--gold-400))' : 'rgba(255,255,255,0.03)',
                  color: active ? '#080808' : 'var(--text-secondary)',
                  border: active ? 'none' : '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-heading)',
                  boxShadow: active ? '0 0 16px rgba(201,162,39,0.35)' : 'none',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6 p-3 rounded-xl card-glass">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-display)' }}>
            Active:
          </span>
          {keyword && (
            <span className="badge badge-gold text-xs flex items-center gap-1.5">
              Query: {keyword}
              <button onClick={() => { setKeyword(''); setSearchInput('') }}><HiOutlineX className="w-3 h-3" /></button>
            </span>
          )}
          {filters.category && (
            <span className="badge badge-gold text-xs flex items-center gap-1.5">
              {filters.category}
              <button onClick={() => handleFilterChange('category', '')}><HiOutlineX className="w-3 h-3" /></button>
            </span>
          )}
          {(filters.minPrice || filters.maxPrice) && (
            <span className="badge badge-gold text-xs flex items-center gap-1.5">
              NPR {filters.minPrice || 0} to NPR {filters.maxPrice || 'Any'}
              <button onClick={() => { handleFilterChange('minPrice', ''); handleFilterChange('maxPrice', '') }}><HiOutlineX className="w-3 h-3" /></button>
            </span>
          )}
          {filters.brands.map((b) => (
            <span key={b} className="badge badge-gold text-xs flex items-center gap-1.5">
              {b}
              <button onClick={() => handleFilterChange('brands', filters.brands.filter((x) => x !== b))}>
                <HiOutlineX className="w-3 h-3" />
              </button>
            </span>
          ))}
          {filters.rating && (
            <span className="badge badge-gold text-xs flex items-center gap-1.5">
              {filters.rating} Stars and above
              <button onClick={() => handleFilterChange('rating', '')}><HiOutlineX className="w-3 h-3" /></button>
            </span>
          )}
          <button onClick={clearFilters} className="text-xs text-red-400 hover:underline font-semibold ml-2">
            Clear all
          </button>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="flex gap-8">
        {/* Desktop Filter Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="card-glass p-5 rounded-2xl sticky top-24" style={{ border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm uppercase tracking-widest" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                Filter Vault
              </h2>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="text-[11px] text-gold-400 hover:underline font-semibold" style={{ color: 'var(--gold-400)' }}>
                  Clear ({activeFilterCount})
                </button>
              )}
            </div>
            <FilterSidebar filters={filters} onChange={handleFilterChange} brands={brands} onClear={clearFilters} />
          </div>
        </aside>

        {/* Mobile Slide-over Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden"
                onClick={() => setShowFilters(false)}
              />
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="fixed left-0 top-0 h-full w-80 z-50 overflow-y-auto p-6 shadow-2xl lg:hidden card-glass"
                style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-base uppercase tracking-widest" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                    Filter Equipment
                  </h2>
                  <button onClick={() => setShowFilters(false)} className="p-2 rounded-xl hover:bg-white/5">
                    <HiOutlineX className="w-5 h-5 text-gold-400" style={{ color: 'var(--gold-400)' }} />
                  </button>
                </div>
                <FilterSidebar filters={filters} onChange={handleFilterChange} brands={brands} onClear={clearFilters} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Product Cards Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="card-glass rounded-2xl p-12 text-center flex flex-col items-center justify-center py-24" style={{ border: '1px solid var(--border-subtle)' }}>
              <div className="text-6xl mb-4" style={{ filter: 'drop-shadow(0 0 16px rgba(201,162,39,0.4))' }}>🏏</div>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                No Equipment Matches Criteria
              </h3>
              <p className="text-sm max-w-sm mb-6" style={{ color: 'var(--text-muted)' }}>
                Try adjusting your price parameters, category selection, or search query.
              </p>
              <button onClick={clearFilters} className="btn-primary px-6 py-2.5">
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
