// src/pages/VerifyEmailPage.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HiOutlineCheckCircle, HiOutlineXCircle } from "react-icons/hi";
import api from "../utils/api";
import { getErrorMessage } from "../utils/helpers";

export default function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    api
      .get(`/auth/verify-email/${token}`)
      .then(({ data }) => {
        setStatus("success");
        setMessage(data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(getErrorMessage(err));
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-amber-50/30 dark:from-dark-950 dark:to-dark-900 px-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center max-w-sm w-full"
      >
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">🏏</span>
          </div>
          <span
            className="text-2xl font-black"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            <span className="text-amber-500">Pitch</span> Nepal
          </span>
        </Link>

        <div className="card p-8">
          {status === "verifying" && (
            <>
              <div
                className="w-14 h-14 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"
                style={{ borderWidth: 4 }}
              />
              <h2
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                Verifying your email…
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">
                Please wait a moment.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiOutlineCheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2
                className="text-xl font-bold mb-2"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                Email Verified! 🎉
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-5">
                {message}
              </p>
              <Link to="/login" className="btn-primary w-full">
                Login Now →
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <HiOutlineXCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2
                className="text-xl font-bold mb-2 text-red-600"
                style={{ fontFamily: "Syne, sans-serif" }}
              >
                Verification Failed
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-5">
                {message}
              </p>
              <div className="flex gap-3">
                <Link to="/login" className="btn-secondary flex-1">
                  Login
                </Link>
                <Link to="/register" className="btn-primary flex-1">
                  Register
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
