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
      "10": "10px",
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
      fontFamily: {
        'roboto': ['Roboto', 'sans']
      },
      fontSize: {
        xxsmall: '12px',
        xsmall: '14px',
        small: '16px',
        medium: '20px',
        large: '32px',
      },
    },
    colors: {
      blue: {
        DEFAULT: '#2876C7',  // A typical clean blue
        light: '#8FB0F0',   // A lighter variant if needed
        dark: '#184C92'     // A darker variant if needed
      },
      red: {
        DEFAULT: '#EA5455',  // A typical clean red
        light: '#FD8D8F',   // A lighter variant if needed
        dark: '#B73235'     // A darker variant if needed
      },
      green: {
        DEFAULT: '#28C76F',  // A typical clean green
        light: '#8FF0B3',   // A lighter variant if needed
        dark: '#18924C'     // A darker variant if needed
      },
      white: '#ffffff',
      black: '#000000',
      grey: '#c7c7c7'
    },
  },
  variants: {},
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.hide-scrollbar::-webkit-scrollbar': {
          display: 'none',
        },
        '.hide-scrollbar': {
          scrollbarWidth: 'none',
          '-ms-overflow-style': 'none',
        },
      };
      addUtilities(newUtilities);
    },
  ],
}
