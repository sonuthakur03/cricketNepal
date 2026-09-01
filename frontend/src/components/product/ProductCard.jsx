// src/components/product/ProductCard.jsx — Premium redesign with 3D tilt + gold glow

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineHeart, HiHeart, HiOutlineShoppingCart } from 'react-icons/hi'
import toast from 'react-hot-toast'
import useCartStore from '../../context/cartStore'
import useWishlistStore from '../../context/wishlistStore'
import useAuthStore from '../../context/authStore'
import { formatPrice } from '../../utils/helpers'
import { StarRating } from '../common/UI'

export default function ProductCard({ product, index = 0 }) {
  const [imgError, setImgError] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [hovered, setHovered] = useState(false)

  const addItem = useCartStore((s) => s.addItem)
  const { toggle, isInWishlist } = useWishlistStore()
  const { isAuthenticated } = useAuthStore()

  const inWishlist = isInWishlist(product._id)
  const finalPrice = product.discountPrice > 0 ? product.discountPrice : product.price
  const hasDiscount = product.discountPrice > 0
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (product.stock === 0) return
    setAddingToCart(true)
    addItem(product, 1)
    toast.success(`Added to cart!`, {
      style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border)' },
      iconTheme: { primary: 'var(--gold-400)', secondary: '#000' },
    })
    setTimeout(() => setAddingToCart(false), 800)
  }

  const handleWishlist = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated()) {
      toast.error('Please sign in to save items')
      return
    }
    await toggle(product._id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group"
      style={{ perspective: '1200px' }}
    >
      <motion.div
        animate={{
          rotateY: hovered ? 1.5 : 0,
          rotateX: hovered ? -1.5 : 0,
          scale: hovered ? 1.02 : 1,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="overflow-hidden rounded-2xl relative"
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${hovered ? 'var(--border)' : 'var(--border-subtle)'}`,
          boxShadow: hovered ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
          transformStyle: 'preserve-3d',
          transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
        }}
      >
        {/* Image */}
        <Link to={`/products/${product.slug || product._id}`} className="block relative overflow-hidden aspect-square" style={{ background: '#111' }}>
          <img
            src={imgError ? '/images/products/bat.jpg' : (product.images?.[0]?.url || '/images/products/bat.jpg')}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
          />

          {/* Hover overlay */}
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
              opacity: hovered ? 1 : 0,
            }}
          />

          {/* Gold shimmer on hover */}
          <div
            className="absolute inset-x-0 bottom-0 h-0.5 transition-opacity duration-300"
            style={{
              background: 'linear-gradient(90deg, transparent, var(--gold-400), transparent)',
              opacity: hovered ? 0.8 : 0,
            }}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {hasDiscount && <span className="badge badge-red text-[10px]">{discountPct}% OFF</span>}
            {product.isFeatured && <span className="badge badge-gold text-[10px]">⭐ Featured</span>}
            {product.stock === 0 && (
              <span className="badge text-[10px]" style={{ background: 'rgba(0,0,0,0.8)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                Sold Out
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={handleWishlist}
            className="absolute top-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{
              background: 'rgba(8,8,8,0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {inWishlist ? (
              <HiHeart className="w-4 h-4" style={{ color: '#f87171' }} />
            ) : (
              <HiOutlineHeart className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            )}
          </button>
        </Link>

        {/* Content */}
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-heading)', letterSpacing: '0.06em' }}>
            {product.brand}
          </p>
          <Link to={`/products/${product.slug || product._id}`}>
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-2 transition-colors duration-150 group-hover:text-gold-400"
              style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
              {product.name}
            </h3>
          </Link>

          <StarRating rating={product.rating} count={product.numReviews} />

          <div className="flex items-center gap-2 mt-2 mb-3">
            <span className="text-base font-bold" style={{ color: 'var(--gold-400)', fontFamily: 'var(--font-mono)' }}>
              {formatPrice(finalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs line-through" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart */}
        <div className="px-4 pb-4">
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || addingToCart}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              product.stock === 0 ? 'cursor-not-allowed' : ''
            }`}
            style={
              product.stock === 0
                ? { background: 'rgba(255,255,255,0.04)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }
                : {
                    background: 'linear-gradient(135deg, var(--gold-300), var(--gold-400), var(--gold-500))',
                    color: '#080808',
                    boxShadow: hovered ? '0 0 20px rgba(201,162,39,0.3)' : 'none',
                  }
            }
          >
            <HiOutlineShoppingCart className="w-4 h-4" />
            {addingToCart ? 'Adding…' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
