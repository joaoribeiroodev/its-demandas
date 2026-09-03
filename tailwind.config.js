/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Navy exato extraído da logo (#00335e), com escala derivada.
        marine: {
          50: "#eef5fb",
          100: "#d6e8f6",
          200: "#adcfec",
          300: "#7ab0dd",
          400: "#4a8fca",
          500: "#2c72ad",
          600: "#1f5686",
          700: "#0d4570",
          800: "#00335e",
          900: "#00203d",
        },
        // Verde exato extraído da logo (#8ac640 = tide-400). Botões e texto
        // usam tide-600/700 (mais escuros) para manter contraste acessível
        // com texto branco; tide-400 fica para acentos, badges e o selo.
        tide: {
          50: "#f5faec",
          100: "#e7f4d4",
          200: "#cde9a9",
          300: "#b0da79",
          400: "#8ac640",
          500: "#6a9835",
          600: "#4a7a26",
          700: "#3d6620",
          800: "#2f4f19",
          900: "#1f3611",
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
