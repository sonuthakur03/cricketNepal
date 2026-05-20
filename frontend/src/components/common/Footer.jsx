// src/components/common/Footer.jsx
import { Link } from "react-router-dom";
import {
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
} from "react-icons/hi";
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";

const SHOP_LINKS = [
  { label: "All Products", to: "/products" },
  { label: "Cricket Bats", to: "/products?category=Bats" },
  { label: "Protective Gear", to: "/products?category=Pads" },
  { label: "Jerseys", to: "/products?category=Jerseys" },
  { label: "Accessories", to: "/products?category=Accessories" },
];

const COMPANY_LINKS = [
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/about#contact" },
  { label: "Seller Program", to: "/register?role=seller" },
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Service", to: "/terms" },
];

export default function Footer() {
  return (
    <footer className="bg-dark-900 text-slate-300 mt-20">
      {/* Top banner */}
      <div className="bg-amber-500">
        <div className="page-container py-4 flex flex-wrap items-center justify-between gap-4">
          <p
            className="font-semibold text-white"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            🏏 Free Shipping on orders above NPR 5,000!
          </p>
          <Link
            to="/products"
            className="bg-white text-amber-700 font-bold text-sm px-5 py-2 rounded-xl hover:bg-amber-50 transition-colors"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Shop Now →
          </Link>
        </div>
      </div>

      <div className="page-container py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div>
          <Link to="/" className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <span className="text-white font-bold">🏏</span>
            </div>
            <span
              className="text-xl font-bold text-white"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              Pitch<span className="text-amber-400"> Nepal</span>
            </span>
          </Link>
          <p className="text-sm text-slate-400 leading-relaxed mb-5">
            Nepal's premier destination for cricket equipment, gear, and
            accessories. Trusted by players across all 7 provinces.
          </p>
          <div className="flex gap-3">
            {[
              { Icon: FaFacebook, href: "#", color: "hover:text-blue-400" },
              { Icon: FaInstagram, href: "#", color: "hover:text-pink-400" },
              { Icon: FaTwitter, href: "#", color: "hover:text-sky-400" },
              { Icon: FaYoutube, href: "#", color: "hover:text-red-400" },
            ].map(({ Icon, href, color }, i) => (
              <a
                key={i}
                href={href}
                className={`w-9 h-9 rounded-xl bg-dark-800 flex items-center justify-center text-slate-400 ${color} transition-colors hover:bg-dark-700`}
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        {/* Shop */}
        <div>
          <h3
            className="text-white font-bold mb-4"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Shop
          </h3>
          <ul className="space-y-2.5">
            {SHOP_LINKS.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-sm text-slate-400 hover:text-primary-400 transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3
            className="text-white font-bold mb-4"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Company
          </h3>
          <ul className="space-y-2.5">
            {COMPANY_LINKS.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-sm text-slate-400 hover:text-primary-400 transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3
            className="text-white font-bold mb-4"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Contact
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2.5 text-sm text-slate-400">
              <HiOutlineLocationMarker className="w-4 h-4 mt-0.5 text-primary-400 flex-shrink-0" />
              Putalisadak, Kathmandu, Nepal
            </li>
            <li className="flex items-center gap-2.5 text-sm text-slate-400">
              <HiOutlinePhone className="w-4 h-4 text-primary-400 flex-shrink-0" />
              +977 01-4567890
            </li>
            <li className="flex items-center gap-2.5 text-sm text-slate-400">
              <HiOutlineMail className="w-4 h-4 text-primary-400 flex-shrink-0" />
              hello@pitchnepal.com
            </li>
          </ul>
          {/* Payment badges */}
          <div className="mt-5">
            <p className="text-xs text-slate-500 mb-2">We accept</p>
            <div className="flex gap-2 flex-wrap">
              {["Khalti", "eSewa", "COD"].map((p) => (
                <span
                  key={p}
                  className="px-2.5 py-1 bg-dark-800 rounded-lg text-xs text-slate-300 border border-dark-700"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-dark-800">
        <div className="page-container py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Pitch Nepal. All rights reserved.</p>
          <p>Made for Nepal's cricket community 🏏</p>
        </div>
      </div>
    </footer>
  );
}
