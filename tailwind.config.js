/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neo-pink': '#ff79c6',
        'neo-blue': '#8be9fd',
        'neo-yellow': '#f1fa8c',
        'neo-bg': '#f8f8f2',
        'neo-black': '#282a36',
        'neo-green': '#50fa7b',
        'neo-purple': '#bd93f9',
        'neo-orange': '#ffb86c',
      },
      boxShadow: {
        'neo': '4px 4px 0px 0px rgba(40,42,54,1)',
        'neo-hover': '6px 6px 0px 0px rgba(40,42,54,1)',
        'neo-active': '0px 0px 0px 0px rgba(40,42,54,1)',
      },
      fontFamily: {
        sans: ['"Space Grotesk"', 'sans-serif'],
        display: ['"Bebas Neue"', 'cursive', 'sans-serif'],
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
