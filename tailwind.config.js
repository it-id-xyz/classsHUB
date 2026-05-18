/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',   // Biru Elektrik
        secondary: '#F3F4F6', // Abu-abu terang
        accent: '#FACC15',    // Kuning
        darkBg: '#111827',    // Background dark mode
      }
    },
  },
  plugins: [],
}
