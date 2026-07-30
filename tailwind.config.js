/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cottonGreen: '#10b981',
        cottonDark: '#111827',
        cottonCard: '#ffffff',
        airbnbRed: '#FF385C',
      },
      boxShadow: {
        'airbnb': '0 6px 20px rgba(0,0,0,0.1)',
        '3d': '0 10px 25px -5px rgba(16, 185, 129, 0.3), 0 8px 10px -6px rgba(16, 185, 129, 0.2)',
      }
    },
  },
  plugins: [],
};