/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // ── Backgrounds & Surfaces ──
        background: {
          DEFAULT: "#F8FAFC",
          dark: "#0B1220",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#172033",
        },
        elevated: {
          DEFAULT: "#FFFFFF",
          dark: "#1E293B",
        },

        // ── Brand / Navigation ──
        brand: {
          DEFAULT: "#2563EB",
          dark: "#3B82F6",
        },

        // ── Primary Action Button ──
        action: {
          DEFAULT: "#F97316",
          hover: "#EA580C",
          dark: "#FB923C",
          "hover-dark": "#F97316",
        },

        // ── Semantic States ──
        success: "#22C55E",
        error: "#EF4444",
        warning: "#F59E0B",

        // ── Text ──
        text: {
          primary: { DEFAULT: "#0F172A", dark: "#F8FAFC" },
          secondary: { DEFAULT: "#64748B", dark: "#CBD5E1" },
          disabled: { DEFAULT: "#94A3B8", dark: "#64748B" },
          inverse: "#FFFFFF",
        },

        // ── Inputs ──
        input: {
          bg: { DEFAULT: "#FFFFFF", dark: "#172033" },
          border: { DEFAULT: "#CBD5E1", dark: "#334155" },
          focus: { DEFAULT: "#2563EB", dark: "#3B82F6" },
        },

        // ── Bottom Nav ──
        nav: {
          active: { DEFAULT: "#2563EB", dark: "#3B82F6" },
          inactive: { DEFAULT: "#94A3B8", dark: "#64748B" },
        },

        // ── Map-specific ──
        map: {
          route: { DEFAULT: "#2563EB", dark: "#3B82F6" },
          "route-alt": { DEFAULT: "#94A3B8", dark: "#64748B" },
          driver: { DEFAULT: "#F97316", dark: "#FB923C" },
          pickup: "#22C55E",
          destination: "#EF4444",
          "current-location": { DEFAULT: "#2563EB", dark: "#3B82F6" },
        },

        // ── Structure ──
        border: { DEFAULT: "#E2E8F0", dark: "#334155" },
        divider: { DEFAULT: "#E2E8F0", dark: "#334155" },
      },
    },
  },
  plugins: [],
};
