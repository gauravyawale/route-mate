/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // ── Glass moment screens ──
        gradient: {
          1: "#1A1A2E",
          2: "#16213E",
          3: "#533483",
          4: "#0F3460",
        },
        glass: {
          bg: "rgba(255, 255, 255, 0.08)",
          border: "rgba(255, 255, 255, 0.2)",
        },
        accent: {
          cyan: "#00F0FF",
          magenta: "#FF0055",
        },

        // ── Clean surface screens ──
        surface: {
          bg: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E2E8F0",
        },
        brand: {
          primary: "#533483",
          accent: "#0F3460",
        },
        text: {
          heading: "#1A1A2E",
          body: "#64748B",
          muted: "#94A3B8",
          inverse: "#FFFFFF",
          "inverse-muted": "rgba(255, 255, 255, 0.75)",
        },

        // ── Semantic (shared across both modes) ──
        success: "#10B981",
        warning: "#F59E0B",
        destructive: "#EF4444",
        live: "#00F0FF",
      },
      borderRadius: {
        glass: "24px",
      },
    },
  },
  plugins: [],
};
