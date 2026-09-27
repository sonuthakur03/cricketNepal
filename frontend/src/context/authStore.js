// src/context/authStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../utils/api";
import { getErrorMessage } from "../utils/helpers";
import useCartStore from "./cartStore";
import useWishlistStore from "./wishlistStore";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      register: async (formData) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post("/auth/register", formData);
          // Init cart for this new user
          try {
            useCartStore.getState().initCartForUser(data.data._id);
          } catch {}
          set({ user: data.data, isLoading: false });
          return { success: true, message: data.message };
        } catch (err) {
          const message = getErrorMessage(err);
          set({ error: message, isLoading: false });
          return { success: false, message };
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post("/auth/login", { email, password });
          // Scope cart to this user
          try {
            useCartStore.getState().initCartForUser(data.data._id);
          } catch {}
          set({ user: data.data, isLoading: false });
          return { success: true };
        } catch (err) {
          const message = getErrorMessage(err);
          set({ error: message, isLoading: false });
          return { success: false, message };
        }
      },

      logout: async () => {
        try {
          useCartStore.getState().clearCartOnLogout();
        } catch {}
        try {
          useWishlistStore.getState().resetWishlist();
        } catch {}
        set({ user: null, isLoading: false, error: null });
        try {
          await api.post("/auth/logout");
        } catch {}
      },

      fetchMe: async () => {
        if (!get().user) return;
        try {
          const { data } = await api.get("/auth/me");
          // Re-init cart for the restored user
          try {
            useCartStore.getState().initCartForUser(data.data._id);
          } catch {}
          set({ user: data.data });
        } catch {
          set({ user: null });
        }
      },

      updateProfile: async (updates) => {
        set({ isLoading: true });
        try {
          const { data } = await api.put("/auth/me", updates);
          set({ user: data.data, isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, message: getErrorMessage(err) };
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true });
        try {
          await api.put("/auth/change-password", {
            currentPassword,
            newPassword,
          });
          set({ isLoading: false });
          return { success: true };
        } catch (err) {
          set({ isLoading: false });
          return { success: false, message: getErrorMessage(err) };
        }
      },

      isAuthenticated: () => !!get().user,
      isAdmin: () => get().user?.role === "admin",
      isSeller: () => ["seller", "admin"].includes(get().user?.role),
      clearError: () => set({ error: null }),
    }),
    {
      name: "pitchnepal-auth",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);

export default useAuthStore;
