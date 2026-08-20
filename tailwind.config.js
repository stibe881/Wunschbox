/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f1',
          100: '#ffe0e0',
          500: '#e02424',
          600: '#c81e1e',
          700: '#a31616',
        },
      },
    },
  },
  plugins: [],
}
