/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand:{ 50:'#eef6ff',100:'#d9ebff',200:'#bcdcff',300:'#8ec6ff',400:'#59a5ff',500:'#3384f5',600:'#1a65e0',700:'#1550b8' },
        mint: { 100:'#d7f5e9',400:'#34d399',600:'#059669' },
        coral:{ 100:'#ffe4e4',400:'#f87171',600:'#dc2626' },
        sand: { 50:'#faf8f5',100:'#f3efe7' },
      },
      fontFamily: { sans:['"DM Sans"','system-ui','sans-serif'] },
    },
  },
  plugins: [],
};
