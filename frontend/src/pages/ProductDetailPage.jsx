// src/pages/ProductDetailPage.jsx
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineShoppingCart, HiOutlineHeart, HiHeart, HiArrowLeft, HiOutlineShare } from 'react-icons/hi'
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

  const handleAddToCart = async () => {
    if (product.sizes?.length && !selectedSize) { toast.error('Please select a size'); return }
    setAddingToCart(true)
    addItem(product, quantity, selectedSize, selectedColor)
    toast.success('Added to cart!')
    setTimeout(() => setAddingToCart(false), 800)
  }

  const handleBuyNow = () => {
    if (product.sizes?.length && !selectedSize) { toast.error('Please select a size'); return }
    addItem(product, quantity, selectedSize, selectedColor)
    navigate('/checkout')
  }

  const handleWishlist = async () => {
    if (!isAuthenticated()) { toast.error('Please login first'); return }
    await toggle(product._id)
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!isAuthenticated()) { toast.error('Please login to review'); return }
    if (!reviewForm.comment.trim()) { toast.error('Please write a review'); return }
    setSubmittingReview(true)
    try {
      await api.post(`/products/${product._id}/reviews`, reviewForm)
      toast.success('Review submitted!')
      // Re-fetch product to show updated reviews
      const { data } = await api.get(`/products/${id}`)
      setProduct(data.data)
      setReviewForm({ rating: 5, comment: '' })
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally { setSubmittingReview(false) }
  }

  if (loading) return <div className="page-container py-24 pt-28"><ProductDetailSkeleton /></div>
  if (!product) return <div className="page-container py-24 text-center">Product not found</div>

  const finalPrice = product.discountPrice > 0 ? product.discountPrice : product.price
  const inWishlist = isInWishlist(product._id)

  return (
    <div className="page-container py-8 pt-24">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-6">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary-600">Products</Link>
        <span>/</span>
        <Link to={`/products?category=${product.category}`} className="hover:text-primary-600">{product.category}</Link>
        <span>/</span>
        <span className="text-[var(--color-text)] truncate max-w-xs">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
        {/* ── Images ── */}
        <div>
          <motion.div
            key={selectedImg}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3"
          >
            <img
              src={product.images?.[selectedImg]?.url || 'https://placehold.co/600x600/e2e8f0/94a3b8?text=No+Image'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.discountPrice > 0 && (
              <div className="absolute top-4 left-4 badge-red text-sm font-bold px-3 py-1 shadow">
                {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% OFF
              </div>
            )}
          </motion.div>
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImg(i)}
                  className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImg === i ? 'border-primary-500 shadow-glow-green' : 'border-transparent opacity-70'
                  }`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">
              {product.brand}
            </p>
            <button onClick={() => navigator.share?.({ title: product.name, url: window.location.href })}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <HiOutlineShare className="w-5 h-5 text-[var(--color-text-muted)]" />
            </button>
          </div>

          <h1 className="text-2xl md:text-3xl font-black mb-3 leading-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}>{product.name}</h1>

          <div className="flex items-center gap-3 mb-4">
            <StarRating rating={product.rating} count={product.numReviews} size="md" />
            <span className="badge-green">{product.category}</span>
            {product.stock > 0
              ? <span className="badge-green">✓ In Stock ({product.stock})</span>
              : <span className="badge-red">Out of Stock</span>
            }
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-3xl font-black text-primary-600 dark:text-primary-400">
              {formatPrice(finalPrice)}
            </span>
            {product.discountPrice > 0 && (
              <span className="text-lg text-[var(--color-text-muted)] line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <p className="text-[var(--color-text-muted)] text-sm leading-relaxed mb-6">{product.description}</p>

          {/* Sizes */}
          {product.sizes?.length > 0 && (
            <div className="mb-4">
              <p className="label">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button key={s} onClick={() => setSelectedSize(s)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                      selectedSize === s
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600'
                        : 'border-[var(--color-border)] hover:border-primary-400'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {product.colors?.length > 0 && (
            <div className="mb-4">
              <p className="label">Color: <span className="font-normal text-[var(--color-text-muted)]">{selectedColor}</span></p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button key={c} onClick={() => setSelectedColor(c)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                      selectedColor === c
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600'
                        : 'border-[var(--color-border)] hover:border-primary-400'
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <p className="label">Quantity</p>
            <div className="inline-flex items-center border-2 border-[var(--color-border)] rounded-xl overflow-hidden">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-lg transition-colors">−</button>
              <span className="px-5 py-2.5 font-bold text-base border-x border-[var(--color-border)]">{quantity}</span>
              <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
                className="px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-lg transition-colors disabled:opacity-40">+</button>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex gap-3 flex-wrap">
            <button onClick={handleAddToCart} disabled={product.stock === 0 || addingToCart}
              className="btn-primary flex-1 min-w-0">
              <HiOutlineShoppingCart className="w-5 h-5" />
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
            <button onClick={handleBuyNow} disabled={product.stock === 0}
              className="bg-gold-500 hover:bg-gold-600 text-white font-bold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 flex-1 min-w-0"
              style={{ fontFamily: 'Syne, sans-serif' }}>
              Buy Now
            </button>
            <button onClick={handleWishlist}
              className="w-12 h-12 flex items-center justify-center border-2 border-[var(--color-border)] rounded-xl hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
              {inWishlist ? <HiHeart className="w-5 h-5 text-red-500" /> : <HiOutlineHeart className="w-5 h-5" />}
            </button>
          </div>

          {/* Specs */}
          {product.specifications?.length > 0 && (
            <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
              <h3 className="font-bold mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Specifications</h3>
              <div className="grid grid-cols-2 gap-2">
                {product.specifications.map((s, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl px-3 py-2">
                    <p className="text-xs text-[var(--color-text-muted)]">{s.key}</p>
                    <p className="text-sm font-semibold mt-0.5">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Reviews ── */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>
          Reviews ({product.numReviews})
        </h2>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Review list */}
          <div className="lg:col-span-2 space-y-4">
            {product.reviews?.length === 0 ? (
              <div className="card p-8 text-center text-[var(--color-text-muted)]">
                No reviews yet. Be the first to review!
              </div>
            ) : (
              product.reviews?.map((review) => (
                <div key={review._id} className="card p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center font-bold text-primary-600 text-sm flex-shrink-0">
                      {review.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm">{review.name}</p>
                        <span className="text-xs text-[var(--color-text-muted)]">{formatDate(review.createdAt)}</span>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                      <p className="text-sm text-[var(--color-text-muted)] mt-2">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Write review form */}
          <div className="card p-5 h-fit">
            <h3 className="font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>Write a Review</h3>
            {!isAuthenticated() ? (
              <div className="text-center py-4">
                <p className="text-sm text-[var(--color-text-muted)] mb-3">Login to write a review</p>
                <Link to="/login" className="btn-primary text-sm py-2">Login</Link>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="label">Your Rating</label>
                  <StarInput value={reviewForm.rating} onChange={(r) => setReviewForm((p) => ({ ...p, rating: r }))} />
                </div>
                <div>
                  <label className="label">Your Review</label>
                  <textarea value={reviewForm.comment}
                    onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                    placeholder="Share your experience with this product..."
                    rows={4} className="input resize-none" required />
                </div>
                <button type="submit" disabled={submittingReview} className="btn-primary w-full">
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* ── Related ── */}
      {related.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>
            You Might Also Like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.slice(0, 4).map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          </div>
        </div>
      )}
    </div>
  )
}
