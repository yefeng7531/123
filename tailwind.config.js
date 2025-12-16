/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      colors: {
        'soup-dark': '#0f172a',
        'soup-card': '#1e293b',
        'soup-red': '#ef4444',
        'soup-black': '#000000',
        'soup-clear': '#3b82f6',
        'soup-twisted': '#8b5cf6',
        'soup-logic': '#10b981',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}