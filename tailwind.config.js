/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        marine: {
          50: "#eef5fb",
          100: "#d6e8f6",
          200: "#adcfec",
          300: "#7ab0dd",
          400: "#4a8fca",
          500: "#2c72ad",
          600: "#1f5686",
          700: "#1b4569",
          800: "#173853",
          900: "#0f2436",
        },
        tide: {
          50: "#eafbf3",
          100: "#cdf5e2",
          200: "#9be9c7",
          300: "#63d7a8",
          400: "#33bd88",
          500: "#1a9e6e",
          600: "#137e58",
          700: "#126347",
          800: "#124f3a",
          900: "#0d3527",
        },
        mist: "#f6f9f8",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 36, 54, 0.06), 0 1px 1px rgba(15, 36, 54, 0.04)",
      },
    },
  },
  plugins: [],
};
