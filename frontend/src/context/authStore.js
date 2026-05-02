// src/context/authStore.js
// Zustand store for authentication state

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../utils/api'
import { getErrorMessage } from '../utils/helpers'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      // ── Register ────────────────────────────────────────────────────
      register: async (formData) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post('/auth/register', formData)
          localStorage.setItem('token', data.token)
          set({ user: data.data, token: data.token, isLoading: false })
          return { success: true, message: data.message }
        } catch (err) {
          const message = getErrorMessage(err)
          set({ error: message, isLoading: false })
          return { success: false, message }
        }
      },

      // ── Login ───────────────────────────────────────────────────────
      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          localStorage.setItem('token', data.token)
          set({ user: data.data, token: data.token, isLoading: false })
          return { success: true }
        } catch (err) {
          const message = getErrorMessage(err)
          set({ error: message, isLoading: false })
          return { success: false, message }
        }
      },

      // ── Logout ──────────────────────────────────────────────────────
      logout: async () => {
        try { await api.post('/auth/logout') } catch {}
        localStorage.removeItem('token')
        set({ user: null, token: null })
      },

      // ── Fetch current user ──────────────────────────────────────────
      fetchMe: async () => {
        const token = localStorage.getItem('token')
        if (!token) return
        try {
          const { data } = await api.get('/auth/me')
          set({ user: data.data })
        } catch {
          localStorage.removeItem('token')
          set({ user: null, token: null })
        }
      },

      // ── Update profile ──────────────────────────────────────────────
      updateProfile: async (updates) => {
        set({ isLoading: true })
        try {
          const { data } = await api.put('/auth/me', updates)
          set({ user: data.data, isLoading: false })
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          return { success: false, message: getErrorMessage(err) }
        }
      },

      // ── Change password ─────────────────────────────────────────────
      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true })
        try {
          await api.put('/auth/change-password', { currentPassword, newPassword })
          set({ isLoading: false })
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          return { success: false, message: getErrorMessage(err) }
        }
      },

      // ── Helpers ─────────────────────────────────────────────────────
      isAuthenticated: () => !!get().token && !!get().user,
      isAdmin: () => get().user?.role === 'admin',
      isSeller: () => ['seller', 'admin'].includes(get().user?.role),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'cricketnepal-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)

export default useAuthStore
