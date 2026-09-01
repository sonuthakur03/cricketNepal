// src/pages/WishlistPage.jsx
import { useEffect } from "react";
import { Link } from "react-router-dom";
import useWishlistStore from "../context/wishlistStore";
import useAuthStore from "../context/authStore";
import ProductCard from "../components/product/ProductCard";
import { ProductCardSkeleton, EmptyState } from "../components/common/UI";

export default function WishlistPage() {
  const { items, fetchWishlist, clearWishlist, isLoading } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated()) fetchWishlist();
  }, []);

  return (
    <div className="page-container pt-24 py-12 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-3xl font-black"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          My Wishlist ❤️{" "}
          <span className="text-primary-600">({items.length})</span>
        </h1>
        {items.length > 0 && (
          <button
            onClick={clearWishlist}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Clear All
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <EmptyState
          icon="❤️"
          title="Your wishlist is empty"
          message="Save products you love and come back to them anytime."
          action={
            <Link to="/products" className="btn-primary">
              Browse Products
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((p, i) => (
            <ProductCard key={p._id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

