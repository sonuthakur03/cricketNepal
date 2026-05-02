// src/utils/api.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// ── Request: attach token from localStorage ───────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response: only redirect to /login on 401 for PROTECTED routes ─────────────
// Public routes (/products, home) may also call the API without a token.
// We should NOT redirect those — only redirect when the user is supposed
// to be logged in but their token expired or was tampered with.
const PROTECTED_PREFIXES = [
  "/auth/me",
  "/auth/logout",
  "/auth/change-password",
  "/orders",
  "/wishlist",
  "/admin",
  "/esewa",
  "/seller",
];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || "";
      const isProtected = PROTECTED_PREFIXES.some((p) => url.includes(p));

      if (isProtected) {
        localStorage.removeItem("token");
        // Only hard-redirect if not already on the login page
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
