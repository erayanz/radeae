/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        danger: '#DC2626',
        warning: '#F59E0B',
        safe: '#10B981',
        dark: {
          bg: '#1F2937',
          card: '#374151',
          border: '#4B5563'
        },
        brand: {
          deepNavy: '#0A0A28',
          navy: '#14143C',
          navyLight: '#1E1E4E',
          navyLighter: '#282860',
          graphite: '#3A3A4A',
          steel: '#8A8A95',
          cream: '#F5EFE0',
          gold: '#DCB43C',
          goldLight: '#F0C659',
          goldDark: '#9E7E1F'
        }
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        text: ['Rajdhani', 'sans-serif'],
        ar: ['Arabic', 'Tajawal', 'Noto Naskh Arabic', 'sans-serif']
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(220,180,60,0.3), 0 4px 14px rgba(220,180,60,0.15)'
      }
    },
  },
  plugins: [],
}
