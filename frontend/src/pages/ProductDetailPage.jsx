// src/pages/ProductDetailPage.jsx — Premium equipment page with verified delivery review workflow

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  HiOutlineShoppingCart,
  HiOutlineHeart,
  HiHeart,
  HiArrowLeft,
  HiOutlineShare,
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiStar,
  HiOutlineSparkles,
} from 'react-icons/hi'
import toast from 'react-hot-toast'
import api from '../utils/api'
import { formatPrice, formatDate, getErrorMessage } from '../utils/helpers'
import { StarRating, StarInput, ProductDetailSkeleton } from '../components/common/UI'
import ProductCard from '../components/product/ProductCard'
import useCartStore from '../context/cartStore'
import useWishlistStore from '../context/wishlistStore'
import useAuthStore from '../context/authStore'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImg, setSelectedImg] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [reviewEligibility, setReviewEligibility] = useState({
    canReview: false,
    hasDeliveredOrder: false,
    existingReview: null,
    reason: '',
  })

  const addItem = useCartStore((s) => s.addItem)
  const { toggle, isInWishlist } = useWishlistStore()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    setLoading(true)
    api.get(`/products/${id}`)
      .then(({ data }) => {
        setProduct(data.data)
        if (data.data.sizes?.length) setSelectedSize(data.data.sizes[0])
        if (data.data.colors?.length) setSelectedColor(data.data.colors[0])
        // Fetch related
        return api.get(`/products?category=${data.data.category}&limit=4`)
      })
      .then(({ data }) => setRelated(data.data.filter((p) => p._id !== id)))
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false))
  }, [id])

  const isAuth = isAuthenticated()

  // Check review eligibility for verified delivered purchasers
  useEffect(() => {
    if (isAuth && id) {
      api.get(`/products/${id}/can-review`)
        .then(({ data }) => {
          setReviewEligibility(data)
          if (data.existingReview) {
            setReviewForm({
              rating: data.existingReview.rating || 5,
              comment: data.existingReview.comment || '',
            })
          }
        })
        .catch(() => {})
    }
  }, [id, isAuth])

  const handleAddToCart = async () => {
    if (product.sizes?.length && !selectedSize) { toast.error('Please select a size'); return }
    setAddingToCart(true)
    addItem(product, quantity, selectedSize, selectedColor)
    toast.success('Equipment added to your kit bag! 🏏')
    setTimeout(() => setAddingToCart(false), 800)
  }

  const handleBuyNow = () => {
    if (product.sizes?.length && !selectedSize) { toast.error('Please select a size'); return }
    addItem(product, quantity, selectedSize, selectedColor)
    navigate('/checkout')
  }

  const handleWishlist = async () => {
    if (!isAuthenticated()) { toast.error('Please sign in to save equipment'); return }
    await toggle(product._id)
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!isAuthenticated()) { toast.error('Please sign in first'); return }
    if (!reviewForm.rating || reviewForm.rating < 1) {
      toast.error('Please select a star rating between 1 and 5')
      return
    }
    if (!reviewForm.comment.trim() || reviewForm.comment.trim().length < 5) {
      toast.error('Please provide at least 5 characters of feedback')
      return
    }
    setSubmittingReview(true)
    try {
      const { data } = await api.post(`/products/${product._id}/reviews`, {
        ...reviewForm,
        comment: reviewForm.comment.trim(),
      })
      toast.success(data.message || 'Review submitted successfully!')
      // Refresh product details and reviews
      const res = await api.get(`/products/${id}`)
      setProduct(res.data.data)
      const el = await api.get(`/products/${id}/can-review`)
      setReviewEligibility(el.data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <div className="page-container py-24 pt-28 flex justify-center"><ProductDetailSkeleton /></div>
  if (!product) return <div className="page-container py-24 text-center"><h2 className="text-xl font-bold">Product not found</h2></div>

  const finalPrice = product.discountPrice > 0 ? product.discountPrice : product.price
  const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price
  const inWishlist = isInWishlist(product._id)

  return (
    <div className="page-container py-8 pt-24 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs mb-6" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
        <Link to="/" className="hover:text-gold-400">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-gold-400">Shop</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category}`} className="hover:text-gold-400">{product.category}</Link>
        <span>/</span>
        <span className="truncate max-w-xs" style={{ color: 'var(--text-primary)' }}>{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        {/* ── Product Media ── */}
        <div>
          <motion.div
            key={selectedImg}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            className="relative aspect-square rounded-2xl overflow-hidden mb-3"
            style={{ background: '#111', border: '1px solid var(--border)' }}
          >
            <img
              src={product.images?.[selectedImg]?.url || '/images/products/bat.jpg'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {hasDiscount && (
              <div className="absolute top-4 left-4 badge-gold text-xs font-bold px-3 py-1 shadow">
                {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
              </div>
            )}
          </motion.div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImg(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    selectedImg === i ? 'border-gold-400 scale-105' : 'border-white/10 hover:border-white/30'
                  }`}
                  style={{ borderColor: selectedImg === i ? 'var(--gold-400)' : 'var(--border-subtle)' }}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Details & Actions ── */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-heading)', letterSpacing: '0.08em' }}>
              {product.brand}
            </p>
            <button
              onClick={() => navigator.share?.({ title: product.name, url: window.location.href })}
              className="p-2 rounded-xl hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              title="Share Equipment"
            >
              <HiOutlineShare className="w-5 h-5" />
            </button>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mb-3 leading-tight" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {product.name}
          </h1>

          <div className="flex items-center gap-3 mb-5">
            <StarRating rating={product.rating} count={product.numReviews} size="md" />
            <span className="badge badge-gold text-xs">{product.category}</span>
            {product.stock > 0 ? (
              <span className="badge badge-green text-xs">✓ In Stock ({product.stock})</span>
            ) : (
              <span className="badge badge-red text-xs">Sold Out</span>
            )}
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-mono)' }}>
              {formatPrice(finalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-base line-through" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>
            {product.description}
          </p>

          {/* Sizes */}
          {product.sizes?.length > 0 && (
            <div className="mb-5">
              <p className="label">Select Size: <span className="font-normal text-white">{selectedSize}</span></p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      border: `1px solid ${selectedSize === s ? 'var(--gold-400)' : 'var(--border-subtle)'}`,
                      background: selectedSize === s ? 'var(--gold-400)' : 'transparent',
                      color: selectedSize === s ? '#080808' : 'var(--text-primary)',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {product.colors?.length > 0 && (
            <div className="mb-5">
              <p className="label">Select Color: <span className="font-normal text-white">{selectedColor}</span></p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      border: `1px solid ${selectedColor === c ? 'var(--gold-400)' : 'var(--border-subtle)'}`,
                      background: selectedColor === c ? 'var(--gold-400)' : 'transparent',
                      color: selectedColor === c ? '#080808' : 'var(--text-primary)',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <p className="label">Quantity</p>
            <div className="inline-flex items-center rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)', background: 'var(--bg-secondary)' }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 hover:bg-white/5 font-bold text-base transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                −
              </button>
              <span className="px-5 py-2 font-bold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
                className="px-4 py-2 hover:bg-white/5 font-bold text-base transition-colors disabled:opacity-30"
                style={{ color: 'var(--text-primary)' }}
              >
                +
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || addingToCart}
              className="btn-primary flex-1 min-w-[160px] py-3.5"
            >
              <HiOutlineShoppingCart className="w-5 h-5" />
              {addingToCart ? 'Adding to Kit…' : 'Add to Kit'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className="btn-secondary flex-1 min-w-[140px] py-3.5 font-bold"
            >
              Buy Now
            </button>
            <button
              onClick={handleWishlist}
              className="w-12 h-12 flex items-center justify-center rounded-xl transition-all"
              style={{
                border: '1px solid var(--border-subtle)',
                background: inWishlist ? 'rgba(239,68,68,0.1)' : 'transparent',
                color: inWishlist ? '#ef4444' : 'var(--text-muted)',
              }}
              title={inWishlist ? 'Remove from Saved' : 'Save Equipment'}
            >
              {inWishlist ? <HiHeart className="w-5 h-5" /> : <HiOutlineHeart className="w-5 h-5" />}
            </button>
          </div>

          {/* Specifications */}
          {product.specifications?.length > 0 && (
            <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                Equipment Specifications
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {product.specifications.map((s, i) => (
                  <div key={i} className="card-glass p-3 rounded-xl" style={{ border: '1px solid var(--border-subtle)' }}>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>{s.key}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Reviews Section ── */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              Player Reviews ({product.numReviews})
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-heading)' }}>
              Verified feedback from cricketers who purchased and received this gear
            </p>
          </div>
          <div className="flex items-center gap-2">
            <HiStar className="w-5 h-5 text-gold-400" style={{ color: 'var(--gold-400)' }} />
            <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{product.rating?.toFixed(1) || '0.0'}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/ 5.0</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Review List */}
          <div className="lg:col-span-2 space-y-4">
            {product.reviews?.length === 0 ? (
              <div className="card-glass p-10 text-center rounded-2xl" style={{ border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <div className="text-4xl mb-3">🏏</div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                  No player reviews yet
                </p>
                <p className="text-xs mt-1">Verified cricketers can submit reviews after taking delivery of this equipment.</p>
              </div>
            ) : (
              product.reviews?.map((review) => (
                <div key={review._id} className="card-glass p-5 rounded-2xl" style={{ border: '1px solid var(--border)' }}>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{
                        background: 'rgba(201,162,39,0.15)',
                        border: '1px solid var(--border)',
                        color: 'var(--gold-400)',
                        fontFamily: 'var(--font-heading)',
                      }}
                    >
                      {review.name?.charAt(0).toUpperCase() || 'P'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                            {review.name}
                          </p>
                          <span className="badge badge-green text-[9px] font-bold uppercase">
                            ✓ Verified Delivery
                          </span>
                        </div>
                        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                      <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Write / Edit Review Panel */}
          <div className="card-glass p-6 rounded-2xl h-fit space-y-4" style={{ border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 pb-2 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
              <HiOutlineSparkles className="w-5 h-5 text-gold-400" style={{ color: 'var(--gold-400)' }} />
              <h3 className="font-bold text-base" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
                {reviewEligibility.existingReview ? 'Update Your Review' : 'Verified Player Review'}
              </h3>
            </div>

            {!isAuthenticated() ? (
              <div className="text-center py-6">
                <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                  Please sign in with your verified buyer account to review this equipment.
                </p>
                <Link to="/login" className="btn-primary w-full py-2.5 text-xs">
                  Sign In to Review
                </Link>
              </div>
            ) : reviewEligibility.canReview ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="flex items-center gap-1.5 badge badge-green text-xs font-semibold py-1.5 px-3 mb-2">
                  <HiOutlineShieldCheck className="w-4 h-4 text-green-400" />
                  <span>Verified Delivered Order on Record</span>
                </div>

                <div>
                  <label className="label">Your Rating</label>
                  <div className="py-1">
                    <StarInput value={reviewForm.rating} onChange={(r) => setReviewForm((p) => ({ ...p, rating: r }))} />
                  </div>
                </div>

                <div>
                  <label className="label">Equipment Feedback & Pitch Performance</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                    placeholder="Describe the sweet spot, balance, stitch quality, or game feel..."
                    rows={4}
                    className="input resize-none text-xs"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn-primary w-full py-3 text-xs font-bold"
                >
                  {submittingReview
                    ? 'Publishing…'
                    : reviewEligibility.existingReview
                    ? 'Update Verified Review'
                    : 'Publish Verified Review'}
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-xl text-center space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(201,162,39,0.1)', color: 'var(--gold-400)' }}>
                  <HiOutlineTruck className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                  Delivery Verification Required
                </p>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  To preserve authentic feedback, reviews are unlocked once your order for this equipment has been marked as <strong>Delivered</strong>.
                </p>
                <Link to="/orders" className="btn-secondary w-full py-2 text-xs mt-2 block">
                  Check My Orders
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Related Equipment ── */}
      {related.length > 0 && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              Complementary Equipment
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>More gear from the {product.category} vault</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.slice(0, 4).map((p, i) => (
              <ProductCard key={p._id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
