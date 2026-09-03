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
        // Mikana Brand System (Light Mode)
        canvas: "#F8FAFC",
        surface: {
          DEFAULT: "#FFFFFF",
          elevated: "#F1F5F9",
          subtle: "#F4F7FB",
        },
        brand: {
          navy: "#0B2545",
          "navy-dark": "#07182E",
          "navy-light": "#133B5C",
          blue: "#1E56A0",
          "blue-hover": "#16488A",
          "blue-tint": "#EEF4FA",
          "blue-border": "#C6D8EB",
        },
        border: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E1",
          hover: "#94A3B8",
        },
        content: {
          primary: "#0B2545",
          heading: "#07182E",
          secondary: "#486581",
          muted: "#829AB1",
          inverse: "#FFFFFF",
        },
        status: {
          emerald: "#059669",
          "emerald-bg": "#ECFDF5",
          "emerald-border": "#A7F3D0",
          amber: "#D97706",
          "amber-bg": "#FFFBEB",
          "amber-border": "#FDE68A",
          rose: "#E11D48",
          "rose-bg": "#FFF1F2",
          "rose-border": "#FECDD3",
        },
      },
      fontFamily: {
        geist: ["Geist_400Regular"],
        "geist-medium": ["Geist_500Medium"],
        "geist-semibold": ["Geist_600SemiBold"],
        "geist-bold": ["Geist_700Bold"],
        inter: ["Inter_400Regular"],
        "inter-medium": ["Inter_500Medium"],
        "inter-semibold": ["Inter_600SemiBold"],
        "inter-bold": ["Inter_700Bold"],
      },
    },
  },
  plugins: [],
};

