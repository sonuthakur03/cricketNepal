// src/context/cartStore.js
// Cart is USER-SPECIFIC — clears on logout
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      userId: null, // track which user owns this cart

      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      // Call this on login — restores the cart for this specific user
      // and clears any leftover cart from a different user
      initCartForUser: (uid) => {
        const current = get().userId;
        if (current && current !== uid) {
          // Different user logged in — clear previous user's cart
          set({ items: [], userId: uid });
        } else {
          set({ userId: uid });
        }
      },

      // Call this on logout — clears the cart completely
      clearCartOnLogout: () => set({ items: [], userId: null, isOpen: false }),

      addItem: (product, quantity = 1, size = "", color = "") => {
        const items = get().items;
        const key = `${product._id}-${size}-${color}`;
        const existing = items.find(
          (i) => `${i.product}-${i.size}-${i.color}` === key,
        );
        if (existing) {
          set({
            items: items.map((i) =>
              `${i.product}-${i.size}-${i.color}` === key
                ? {
                    ...i,
                    quantity: Math.min(i.quantity + quantity, product.stock),
                  }
                : i,
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                product: product._id,
                name: product.name,
                image: product.images?.[0]?.url || "",
                price:
                  product.discountPrice > 0
                    ? product.discountPrice
                    : product.price,
                stock: product.stock,
                quantity,
                size,
                color,
                slug: product.slug,
              },
            ],
          });
        }
        set({ isOpen: true });
      },

      updateQuantity: (productId, size, color, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size, color);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.product === productId && i.size === size && i.color === color
              ? { ...i, quantity: Math.min(quantity, i.stock) }
              : i,
          ),
        });
      },

      removeItem: (productId, size, color) => {
        set({
          items: get().items.filter(
            (i) =>
              !(
                i.product === productId &&
                i.size === size &&
                i.color === color
              ),
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),
      getSubtotal: () =>
        get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),
      getShipping: () => (get().getSubtotal() >= 5000 ? 0 : 150),
      getTax: () => Math.round(get().getSubtotal() * 0.13),
      getTotal: () =>
        get().getSubtotal() + get().getShipping() + get().getTax(),
    }),
    {
      name: "pitchnepal-cart",
      // Only persist items and userId — not isOpen
      partialize: (state) => ({ items: state.items, userId: state.userId }),
    },
  ),
);

export default useCartStore;
