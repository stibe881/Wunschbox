/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Hausfarbe aus dem Corporate Design (Petrol) – Navigation, Knöpfe, Akzente
        brand: {
          50: '#eaf2f1',
          100: '#cfe1de',
          200: '#a9c8c3',
          400: '#4f8a82',
          500: '#2a6a63',
          600: '#1c504b',
          700: '#153e3a',
        },
        // Alarmrot bleibt dem Alarmieren vorbehalten: SOS, Auslöseknöpfe, aktive Alarme, Notruf
        alarm: {
          50: '#fff1f1',
          100: '#ffe0e0',
          200: '#fecaca',
          400: '#f87171',
          500: '#e02424',
          600: '#c81e1e',
          700: '#a31616',
        },
      },
    },
  },
  plugins: [],
}
