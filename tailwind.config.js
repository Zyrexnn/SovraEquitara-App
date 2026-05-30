/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        zen: {
          bg: "#FAF9F6",
          darkBg: "#000000",
          card: "#FFFFFF",
          cardDark: "#0C0C0E",
          surface: "#FFFFFF",
          darkSurface: "#111111",
          border: "#EAEAEA",
          borderDark: "#1f1f22",
          text: "#1C1917",
          textDark: "#F5F5F0",
          muted: "#787774",
          mutedDark: "#A1A1AA",
          accent: "#000000",
          accentHover: "#333333",
        },
        status: {
          pending: "#f59e0b",
          valid: "#3b82f6",
          resolved: "#10b981",
          rejected: "#ef4444",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["PlusJakartaSans", "sans-serif"],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        'bento': '24px', 
      },
      boxShadow: {
        'zen': '0 2px 8px -2px rgba(0, 0, 0, 0.02), 0 4px 16px -4px rgba(0, 0, 0, 0.02)',
      }
    },
  },
  plugins: [],
}
