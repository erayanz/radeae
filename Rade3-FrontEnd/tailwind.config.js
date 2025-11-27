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
        }
      }
    },
  },
  plugins: [],
}
