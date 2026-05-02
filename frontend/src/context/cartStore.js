// src/context/cartStore.js
// Zustand store for cart state — persisted in localStorage

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],        // [{ product, name, image, price, quantity, size, color }]
      isOpen: false,    // Cart drawer open/close

      // ── Toggle cart drawer ──────────────────────────────────────────
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      // ── Add item to cart ────────────────────────────────────────────
      addItem: (product, quantity = 1, size = '', color = '') => {
        const items = get().items
        const key = `${product._id}-${size}-${color}`
        const existing = items.find((i) => `${i.product}-${i.size}-${i.color}` === key)

        if (existing) {
          set({
            items: items.map((i) =>
              `${i.product}-${i.size}-${i.color}` === key
                ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock) }
                : i
            ),
          })
        } else {
          set({
            items: [
              ...items,
              {
                product: product._id,
                name: product.name,
                image: product.images?.[0]?.url || '',
                price: product.discountPrice > 0 ? product.discountPrice : product.price,
                stock: product.stock,
                quantity,
                size,
                color,
                slug: product.slug,
              },
            ],
          })
        }
        set({ isOpen: true })
      },

      // ── Update item quantity ────────────────────────────────────────
      updateQuantity: (productId, size, color, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size, color)
          return
        }
        set({
          items: get().items.map((i) =>
            i.product === productId && i.size === size && i.color === color
              ? { ...i, quantity: Math.min(quantity, i.stock) }
              : i
          ),
        })
      },

      // ── Remove item ─────────────────────────────────────────────────
      removeItem: (productId, size, color) => {
        set({ items: get().items.filter((i) => !(i.product === productId && i.size === size && i.color === color)) })
      },

      // ── Clear cart ──────────────────────────────────────────────────
      clearCart: () => set({ items: [] }),

      // ── Computed values ─────────────────────────────────────────────
      getTotalItems: () => get().items.reduce((acc, i) => acc + i.quantity, 0),

      getSubtotal: () => get().items.reduce((acc, i) => acc + i.price * i.quantity, 0),

      getShipping: () => {
        const subtotal = get().getSubtotal()
        return subtotal >= 5000 ? 0 : 150
      },

      getTax: () => Math.round(get().getSubtotal() * 0.13),

      getTotal: () => get().getSubtotal() + get().getShipping() + get().getTax(),
    }),
    {
      name: 'cricketnepal-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
)

export default useCartStore
