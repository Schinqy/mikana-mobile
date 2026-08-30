/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: "#09090b",
        surface: "#121215",
        elevated: "#18181b",
        floating: "#202024",
        subtle: "#27272a",
        hoverBorder: "#3f3f46",
        focusBorder: "#52525b",
        primaryText: "#f4f4f5",
        secondaryText: "#a1a1aa",
        mutedText: "#71717a",
        disabledText: "#52525b",
        brand: {
          blue: "#3b82f6",
          emerald: "#10b981",
          amber: "#f59e0b",
          rose: "#f43f5e",
          violet: "#8b5cf6",
        },
      },
      fontFamily: {
        sans: ["System", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["Courier New", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
