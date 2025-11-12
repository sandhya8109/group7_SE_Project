/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0f172a',
        panel: '#111827',
        panel2: '#0b1220',
        text: '#e5e7eb',
        muted: '#94a3b8',
        accent: '#6366f1'
      },
      boxShadow: {
        glow: '0 0 20px rgba(99,102,241,0.35)'
      }
    },
  },
  plugins: [],
}
