/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // PitchNepal Premium — Dark & Gold Design System
        gold: {
          100: "#FDF5DC",
          200: "#F5E098",
          300: "#ECC84A",
          400: "#C9A227",
          500: "#A07820",
          600: "#7A5918",
        },
        leather: {
          300: "#C4855A",
          400: "#8B5A2B",
          500: "#5E3A18",
        },
        dark: {
          700: "#1c1c1c",
          800: "#141414",
          900: "#111111",
          950: "#080808",
        },
        // Keep legacy surface for backward compat
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
        primary: {
          50: "#fdfbf3",
          100: "#faf3d6",
          200: "#f4e4a1",
          300: "#ecd162",
          400: "#C9A227",
          500: "#C9A227",
          600: "#C9A227",
          700: "#875a1c",
          800: "#6e471e",
          900: "#5c3b1e",
        },
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'system-ui', 'sans-serif'],
        heading: ['"Outfit"', 'system-ui', 'sans-serif'],
        body: ['"Outfit"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        hero: [
          "clamp(3rem, 7vw, 5.5rem)",
          { lineHeight: "1.0", letterSpacing: "-0.04em" },
        ],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.25s ease-out",
        shimmer: "shimmer 1.8s infinite",
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spinSlow 20s linear infinite",
        "pulse-gold": "pulseGold 3s ease-in-out infinite",
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
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        spinSlow: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(201,162,39,0)" },
          "50%": { boxShadow: "0 0 30px 6px rgba(201,162,39,0.25)" },
        },
      },
      boxShadow: {
        "glow-gold": "0 0 30px rgba(201, 162, 39, 0.25)",
        "glow-gold-strong": "0 0 60px rgba(201, 162, 39, 0.4)",
        "glow-sm": "0 0 15px rgba(201, 162, 39, 0.15)",
        card: "0 4px 24px rgba(0,0,0,0.6)",
        "card-hover": "0 8px 48px rgba(0,0,0,0.8), 0 0 20px rgba(201,162,39,0.15)",
        premium: "0 20px 60px rgba(0,0,0,0.5)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
