// src/components/product/ProductCard.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineShoppingCart,
  HiOutlineEye,
} from "react-icons/hi";
import toast from "react-hot-toast";
import useCartStore from "../../context/cartStore";
import useWishlistStore from "../../context/wishlistStore";
import useAuthStore from "../../context/authStore";
import { formatPrice } from "../../utils/helpers";
import { StarRating } from "../common/UI";

export default function ProductCard({ product, index = 0 }) {
  const [imgError, setImgError] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const { toggle, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  const inWishlist = isInWishlist(product._id);
  const finalPrice =
    product.discountPrice > 0 ? product.discountPrice : product.price;
  const hasDiscount = product.discountPrice > 0;
  const discountPct = hasDiscount
    ? Math.round(
        ((product.price - product.discountPrice) / product.price) * 100,
      )
    : 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) return;
    setAddingToCart(true);
    addItem(product, 1);
    toast.success(`${product.name.substring(0, 30)}... added to cart!`);
    setTimeout(() => setAddingToCart(false), 800);
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated()) {
      toast.error("Please login to save items");
      return;
    }
    await toggle(product._id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group card-hover overflow-hidden"
    >
      <Link to={`/products/${product.slug || product._id}`} className="block">
        {/* Image */}
        <div className="relative overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-square">
          <img
            src={
              imgError
                ? "https://placehold.co/400x400/e2e8f0/94a3b8?text=No+Image"
                : product.images?.[0]?.url
            }
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Overlay actions — no Link here, whole card is already a link */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
            <div className="flex gap-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <div className="w-9 h-9 bg-white dark:bg-dark-800 rounded-xl flex items-center justify-center shadow-md">
                <HiOutlineEye className="w-4 h-4 text-slate-700 dark:text-slate-200" />
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {hasDiscount && (
              <span className="badge-red text-xs font-bold shadow-sm">
                -{discountPct}%
              </span>
            )}
            {product.isFeatured && (
              <span className="badge-gold text-xs font-bold shadow-sm">
                ⭐ Featured
              </span>
            )}
            {product.stock === 0 && (
              <span className="badge-gray text-xs font-bold shadow-sm">
                Out of Stock
              </span>
            )}
          </div>

          {/* Wishlist btn */}
          <button
            onClick={handleWishlist}
            className="absolute top-2.5 right-2.5 w-8 h-8 bg-white dark:bg-dark-800 rounded-xl flex items-center justify-center shadow-md hover:scale-110 transition-transform"
          >
            {inWishlist ? (
              <HiHeart className="w-4 h-4 text-red-500" />
            ) : (
              <HiOutlineHeart className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-xs text-[var(--color-text-muted)] font-medium uppercase tracking-wide mb-1">
            {product.brand}
          </p>
          <h3
            className="font-semibold text-sm leading-snug line-clamp-2 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            {product.name}
          </h3>

          <StarRating rating={product.rating} count={product.numReviews} />

          <div className="flex items-center gap-2 mt-2 mb-3">
            <span className="text-base font-bold text-primary-600 dark:text-primary-400">
              {formatPrice(finalPrice)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-[var(--color-text-muted)] line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to Cart — outside Link to prevent navigation */}
      <div className="px-4 pb-4">
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || addingToCart}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
            ${
              product.stock === 0
                ? "bg-slate-100 dark:bg-slate-800 text-[var(--color-text-muted)] cursor-not-allowed"
                : "btn-primary py-2.5"
            }`}
        >
          <HiOutlineShoppingCart className="w-4 h-4" />
          {addingToCart
            ? "Adding..."
            : product.stock === 0
              ? "Out of Stock"
              : "Add to Cart"}
        </button>
      </div>
    </motion.div>
  );
}
