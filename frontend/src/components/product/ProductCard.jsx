// src/components/product/ProductCard.jsx — Equal Height & Width E-Commerce Card

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
      iconTheme: { primary: '#16A34A', secondary: '#FFFFFF' },
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group w-full h-full flex flex-col"
      style={{ perspective: '1200px' }}
    >
      <motion.div
        animate={{
          scale: hovered ? 1.02 : 1,
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="overflow-hidden rounded-2xl relative w-full h-full flex flex-col justify-between"
        style={{
          background: 'var(--bg-card)',
          border: `1.5px solid ${hovered ? '#16A34A' : 'var(--border)'}`,
          boxShadow: hovered ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {/* Top Product Image Container — Fixed Aspect Ratio */}
        <div className="relative w-full aspect-square overflow-hidden flex-shrink-0 bg-slate-100 dark:bg-slate-900">
          <Link to={`/products/${product.slug || product._id}`} className="block w-full h-full">
            <img
              src={imgError ? '/images/products/bat.jpg' : (product.images?.[0]?.url || '/images/products/bat.jpg')}
              alt={product.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Subtle Gradient Shadow on Hover */}
            <div
              className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
              style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)',
                opacity: hovered ? 1 : 0,
              }}
            />
          </Link>

          {/* Badges — Top Left */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
            {hasDiscount && <span className="badge badge-red text-[10px] font-bold shadow-sm">{discountPct}% OFF</span>}
            {product.isFeatured && <span className="badge badge-gold text-[10px] font-bold shadow-sm">⭐ Featured</span>}
            {product.stock === 0 && (
              <span className="badge text-[10px] bg-slate-900/90 text-slate-300 border border-slate-700 shadow-sm">
                Sold Out
              </span>
            )}
          </div>

          {/* Wishlist Button — Top Right */}
          <button
            onClick={handleWishlist}
            className="absolute top-2.5 right-2.5 w-8 h-8 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110 z-10 shadow-md backdrop-blur-md"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            {inWishlist ? (
              <HiHeart className="w-4 h-4 text-red-500" />
            ) : (
              <HiOutlineHeart className="w-4 h-4 text-slate-600 hover:text-red-500 transition-colors" />
            )}
          </button>
        </div>

        {/* Product Details Section — Flex 1 with Min Height Title for Uniformity */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-wider mb-1 line-clamp-1"
              style={{ color: '#16A34A', fontFamily: 'var(--font-heading)', letterSpacing: '0.04em' }}
            >
              {product.brand || 'Authentic'}
            </p>
            <Link to={`/products/${product.slug || product._id}`}>
              <h3
                className="font-bold text-sm leading-snug line-clamp-2 min-h-[2.6rem] mb-2 transition-colors duration-150 hover:text-green-600"
                style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
                title={product.name}
              >
                {product.name}
              </h3>
            </Link>
          </div>

          {/* Rating and Price Baseline */}
          <div className="mt-auto pt-1">
            <StarRating rating={product.rating} count={product.numReviews} />

            <div className="flex items-baseline gap-2 mt-2 mb-1">
              <span className="text-base font-bold" style={{ color: '#16A34A', fontFamily: 'var(--font-mono)' }}>
                {formatPrice(finalPrice)}
              </span>
              {hasDiscount && (
                <span className="text-xs line-through text-slate-400 font-mono">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Add to Cart Button Container — Always pinned at bottom */}
        <div className="px-4 pb-4 pt-1 mt-auto">
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || addingToCart}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all duration-200 ${
              product.stock === 0
                ? 'cursor-not-allowed opacity-50 bg-slate-200 dark:bg-slate-800 text-slate-500'
                : 'btn-primary'
            }`}
          >
            <HiOutlineShoppingCart className="w-4 h-4" />
            {addingToCart ? 'Adding to Kit…' : product.stock === 0 ? 'Sold Out' : 'Add to Cart'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
