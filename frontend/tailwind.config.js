/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Pitch Nepal — premium sports brand palette
        // Primary: Deep charcoal (authority + premium)
        pitch: {
          50: "#f7f7f5",
          100: "#ededea",
          200: "#d8d8d2",
          300: "#b8b8b0",
          400: "#8f8f85",
          500: "#6e6e62",
          600: "#565649",
          700: "#47473d",
          800: "#3c3c33",
          900: "#1a1a16",
          950: "#0d0d0a",
        },
        // Accent: Warm gold (energy + performance)
        gold: {
          50: "#fdfbf3",
          100: "#faf3d6",
          200: "#f4e4a1",
          300: "#ecd162",
          400: "#D4A843",
          500: "#c4942e",
          600: "#a87620",
          700: "#875a1c",
          800: "#6e471e",
          900: "#5c3b1e",
        },
        // Surface: Warm off-whites (premium feel vs cold grays)
        surface: {
          50: "#fafaf8",
          100: "#f4f4f0",
          200: "#eaeae4",
          300: "#d5d5cc",
          400: "#b0b0a4",
          500: "#8f8f82",
          600: "#6e6e62",
          700: "#555549",
          800: "#2a2a24",
          900: "#1c1c17",
          950: "#111110",
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        body: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      fontSize: {
        hero: [
          "clamp(2.5rem, 6vw, 5rem)",
          { lineHeight: "1.05", letterSpacing: "-0.02em" },
        ],
      },
      backgroundImage: {
        "pitch-pattern":
          "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4A843' fill-opacity='0.04'%3E%3Ccircle cx='40' cy='40' r='3'/%3E%3Ccircle cx='0' cy='0' r='3'/%3E%3Ccircle cx='80' cy='0' r='3'/%3E%3Ccircle cx='0' cy='80' r='3'/%3E%3Ccircle cx='80' cy='80' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        "hero-gradient":
          "linear-gradient(135deg, #0d0d0a 0%, #1a1a16 40%, #2a2218 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.25s ease-out",
        shimmer: "shimmer 1.8s infinite",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      boxShadow: {
        "glow-gold": "0 0 30px rgba(212, 168, 67, 0.25)",
        "glow-sm": "0 0 15px rgba(212, 168, 67, 0.15)",
        card: "0 2px 16px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.04)",
        "card-hover":
          "0 8px 32px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.06)",
        "card-dark": "0 2px 16px rgba(0,0,0,0.4)",
        premium: "0 20px 60px rgba(0,0,0,0.15)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
