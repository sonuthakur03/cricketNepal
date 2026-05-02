// src/pages/ProductsPage.jsx
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineAdjustments, HiOutlineX, HiOutlineSearch } from 'react-icons/hi'
import api from '../utils/api'
import { PRODUCT_CATEGORIES, formatPrice } from '../utils/helpers'
import ProductCard from '../components/product/ProductCard'
import { ProductCardSkeleton, Pagination } from '../components/common/UI'

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'popular',    label: 'Most Popular' },
  { value: 'rating',     label: 'Top Rated' },
  { value: 'price-asc',  label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]

// ── Filter Sidebar ────────────────────────────────────────────────────────────
function FilterSidebar({ filters, onChange, brands, onClear }) {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-bold text-sm mb-3 uppercase tracking-wide text-[var(--color-text-muted)]"
          style={{ fontFamily: 'Syne, sans-serif' }}>Category</h3>
        <div className="space-y-1.5">
          {PRODUCT_CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
              <input type="radio" name="category" value={cat}
                checked={filters.category === cat}
                onChange={() => onChange('category', filters.category === cat ? '' : cat)}
                className="w-4 h-4 accent-primary-600"
              />
              <span className="text-sm group-hover:text-primary-600 transition-colors">{cat}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-bold text-sm mb-3 uppercase tracking-wide text-[var(--color-text-muted)]"
          style={{ fontFamily: 'Syne, sans-serif' }}>Price Range (NPR)</h3>
        <div className="flex gap-2">
          <input type="number" placeholder="Min" value={filters.minPrice}
            onChange={(e) => onChange('minPrice', e.target.value)}
            className="input py-2 text-sm" />
          <input type="number" placeholder="Max" value={filters.maxPrice}
            onChange={(e) => onChange('maxPrice', e.target.value)}
            className="input py-2 text-sm" />
        </div>
        {/* Quick price ranges */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[
            { label: 'Under 2K', min: '', max: '2000' },
            { label: '2K–5K',    min: '2000', max: '5000' },
            { label: '5K–10K',   min: '5000', max: '10000' },
            { label: 'Over 10K', min: '10000', max: '' },
          ].map((r) => (
            <button key={r.label}
              onClick={() => { onChange('minPrice', r.min); onChange('maxPrice', r.max) }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filters.minPrice === r.min && filters.maxPrice === r.max
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-primary-50 dark:hover:bg-primary-900/30'
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <h3 className="font-bold text-sm mb-3 uppercase tracking-wide text-[var(--color-text-muted)]"
            style={{ fontFamily: 'Syne, sans-serif' }}>Brand</h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-2.5 cursor-pointer group">
                <input type="checkbox" value={brand}
                  checked={filters.brands.includes(brand)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...filters.brands, brand]
                      : filters.brands.filter((b) => b !== brand)
                    onChange('brands', next)
                  }}
                  className="w-4 h-4 accent-primary-600 rounded"
                />
                <span className="text-sm group-hover:text-primary-600 transition-colors">{brand}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Rating */}
      <div>
        <h3 className="font-bold text-sm mb-3 uppercase tracking-wide text-[var(--color-text-muted)]"
          style={{ fontFamily: 'Syne, sans-serif' }}>Min Rating</h3>
        <div className="space-y-1.5">
          {[4, 3, 2].map((r) => (
            <label key={r} className="flex items-center gap-2.5 cursor-pointer group">
              <input type="radio" name="rating" value={r}
                checked={Number(filters.rating) === r}
                onChange={() => onChange('rating', filters.rating == r ? '' : r)}
                className="w-4 h-4 accent-primary-600"
              />
              <span className="text-sm flex items-center gap-1">
                {'⭐'.repeat(r)} <span className="text-[var(--color-text-muted)]">& up</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <button onClick={onClear}
        className="w-full py-2.5 text-sm font-semibold text-red-600 border border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
        Clear All Filters
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
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

  // Fetch brands/categories for filter
  useEffect(() => {
    api.get('/products/meta').then(({ data }) => setBrands(data.data.brands)).catch(() => {})
  }, [])

  // Fetch products
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
      setProducts(data.data)
      setTotalPages(data.totalPages)
      setTotal(data.total)
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
    setKeyword(''); setSearchInput(''); setPage(1)
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
    <div className="page-container py-8 pt-24 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="section-title">
            {filters.category || (keyword ? `"${keyword}"` : 'All Products')}
          </h1>
          {!loading && (
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {total} product{total !== 1 ? 's' : ''} found
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input type="text" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products..."
              className="input pl-9 py-2.5 text-sm" />
          </form>

          {/* Sort */}
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1) }}
            className="input py-2.5 text-sm w-auto flex-shrink-0">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>

          {/* Mobile filter toggle */}
          <button onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden relative flex items-center gap-2 btn-secondary py-2.5 px-4 text-sm flex-shrink-0">
            <HiOutlineAdjustments className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active filters chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {keyword && (
            <span className="badge-green flex items-center gap-1">
              Search: {keyword}
              <button onClick={() => { setKeyword(''); setSearchInput('') }}><HiOutlineX className="w-3 h-3" /></button>
            </span>
          )}
          {filters.category && (
            <span className="badge-green flex items-center gap-1">
              {filters.category}
              <button onClick={() => handleFilterChange('category', '')}><HiOutlineX className="w-3 h-3" /></button>
            </span>
          )}
          {filters.brands.map((b) => (
            <span key={b} className="badge-gold flex items-center gap-1">
              {b}
              <button onClick={() => handleFilterChange('brands', filters.brands.filter((x) => x !== b))}>
                <HiOutlineX className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium px-2">
            Clear all
          </button>
        </div>
      )}

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="card p-5 sticky top-24">
            <h2 className="font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>Filters</h2>
            <FilterSidebar filters={filters} onChange={handleFilterChange} brands={brands} onClear={clearFilters} />
          </div>
        </aside>

        {/* Mobile Sidebar (slide-in) */}
        <AnimatePresence>
          {showFilters && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setShowFilters(false)} />
              <motion.aside
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed left-0 top-0 h-full w-80 bg-[var(--color-bg)] z-50 overflow-y-auto p-5 shadow-2xl lg:hidden"
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>Filters</h2>
                  <button onClick={() => setShowFilters(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                    <HiOutlineX className="w-5 h-5" />
                  </button>
                </div>
                <FilterSidebar filters={filters} onChange={handleFilterChange} brands={brands} onClear={clearFilters} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-6xl mb-4">🏏</div>
              <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>No products found</h3>
              <p className="text-[var(--color-text-muted)] mb-4">Try adjusting your filters or search term</p>
              <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
              </div>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
