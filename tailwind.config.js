module.exports = {
  purge: {
    content: [
      "./pages/**/*.{js,jsx,ts,tsx}",
      "./components/**/*.{js,jsx,ts,tsx}",
    ]
  },
  theme: {
    borderRadius: {
      "5": "5px",
      "15": "15px",
      "20": "20px"
    },
    screens: {
      "sm": "250px",
      "base": "420px",
      "md": "768px",
      "lg": "1100px",
      "xl": "1400px"
    },
    extend: {
      fontSize: {
        medium: '20px',
      },
    },
  },
  variants: {},
  plugins: [],
}
