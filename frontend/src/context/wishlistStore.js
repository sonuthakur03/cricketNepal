// src/context/wishlistStore.js
import { create } from 'zustand'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { getErrorMessage } from '../utils/helpers'

const useWishlistStore = create((set, get) => ({
  items: [],
  isLoading: false,

  fetchWishlist: async () => {
    try {
      const { data } = await api.get('/wishlist')
      set({ items: data.data })
    } catch {}
  },

  toggle: async (productId) => {
    try {
      const { data } = await api.post(`/wishlist/${productId}`)
      // Re-fetch to get populated data
      const { data: wl } = await api.get('/wishlist')
      set({ items: wl.data })
      toast.success(data.message)
      return data.inWishlist
    } catch (err) {
      toast.error(getErrorMessage(err))
      return false
    }
  },

  isInWishlist: (productId) => get().items.some((p) => p._id === productId),

  clearWishlist: async () => {
    try {
      await api.delete('/wishlist')
      set({ items: [] })
    } catch {}
  },
}))

export default useWishlistStore
