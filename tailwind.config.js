/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        zen: {
          bg: "#FAFAF9",
          darkBg: "#000000",
          surface: "#FFFFFF",
          darkSurface: "#111111",
          accent: "#10b981", // Emerald 500
          accentHover: "#059669", // Emerald 600
        },
        status: {
          pending: "#f59e0b", // Amber 500
          valid: "#3b82f6", // Blue 500
          resolved: "#10b981", // Emerald 500
          rejected: "#ef4444", // Red 500
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["PlusJakartaSans", "sans-serif"],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        'bento': '2rem', // Exteme rounded for Bento Box
      },
      boxShadow: {
        'zen': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
