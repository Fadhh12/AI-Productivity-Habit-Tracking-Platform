/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9f6',
          100: '#d9f0e7',
          500: '#0f9d70',
          600: '#0c7f5b',
          700: '#0a6549',
        },
      },
    },
  },
  plugins: [],
};
