/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a', // Slate 900
        surface: '#1e293b', // Slate 800
        primary: '#3b82f6', // Blue 500
        'primary-hover': '#2563eb', // Blue 600
        text: '#f8fafc', // Slate 50
        'text-muted': '#94a3b8', // Slate 400
        danger: '#ef4444', // Red 500
      }
    },
  },
  plugins: [],
}
