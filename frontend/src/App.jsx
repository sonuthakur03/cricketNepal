// src/App.jsx
import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import CartDrawer from "./components/cart/CartDrawer";
import { ProtectedRoute } from "./components/common/UI";
import useAuthStore from "./context/authStore";

import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import OrdersPage from "./pages/OrdersPage";
import WishlistPage, { AboutPage } from "./pages/WishlistPage";
import ProfilePage from "./pages/ProfilePage";
import SellerDashboard from "./pages/SellerDashboard";
import ProductFormPage from "./pages/ProductFormPage";
import AdminDashboard from "./pages/AdminDashboard";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import {
  KhaltiCallbackPage,
  EsewaSuccessPage,
  EsewaFailurePage,
  NotFoundPage,
} from "./pages/PaymentCallbackPage";

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

// Pages that should NOT show the standard navbar/footer
const NO_LAYOUT_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/reset-password",
];

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const fetchMe = useAuthStore((s) => s.fetchMe);
  useEffect(() => {
    fetchMe();
  }, []);

  const location = useLocation();
  const hideLayout = NO_LAYOUT_PATHS.some((p) =>
    location.pathname.startsWith(p),
  );

  return (
    <div className="min-h-screen flex flex-col">
      {!hideLayout && (
        <Navbar
          darkMode={darkMode}
          toggleDarkMode={() => setDarkMode((d) => !d)}
        />
      )}

      <CartDrawer />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            {/* Public */}
            <Route
              path="/"
              element={
                <PageTransition>
                  <HomePage />
                </PageTransition>
              }
            />
            <Route
              path="/products"
              element={
                <PageTransition>
                  <ProductsPage />
                </PageTransition>
              }
            />
            <Route
              path="/products/:id"
              element={
                <PageTransition>
                  <ProductDetailPage />
                </PageTransition>
              }
            />
            <Route
              path="/cart"
              element={
                <PageTransition>
                  <CartPage />
                </PageTransition>
              }
            />
            <Route
              path="/about"
              element={
                <PageTransition>
                  <AboutPage />
                </PageTransition>
              }
            />

            {/* Auth pages — no navbar */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
            <Route path="/reset-password/:token" element={<LoginPage />} />

            {/* Protected */}
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <CheckoutPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <OrdersPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <OrderDetailPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <WishlistPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <ProfilePage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />

            {/* Payment callbacks */}
            <Route
              path="/payment/khalti/callback"
              element={
                <ProtectedRoute>
                  <KhaltiCallbackPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment/esewa/success"
              element={
                <ProtectedRoute>
                  <EsewaSuccessPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment/esewa/failure"
              element={
                <ProtectedRoute>
                  <EsewaFailurePage />
                </ProtectedRoute>
              }
            />

            {/* Seller */}
            <Route
              path="/seller/dashboard"
              element={
                <ProtectedRoute roles={["seller", "admin"]}>
                  <PageTransition>
                    <SellerDashboard />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/products/new"
              element={
                <ProtectedRoute roles={["seller", "admin"]}>
                  <PageTransition>
                    <ProductFormPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller/products/edit/:id"
              element={
                <ProtectedRoute roles={["seller", "admin"]}>
                  <PageTransition>
                    <ProductFormPage />
                  </PageTransition>
                </ProtectedRoute>
              }
            />

            {/* Admin */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <PageTransition>
                    <AdminDashboard />
                  </PageTransition>
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AnimatePresence>
      </main>

      {!hideLayout && <Footer />}
    </div>
  );
}
