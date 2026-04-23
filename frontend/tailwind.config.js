/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f7ff',
          100: '#dfeeff',
          200: '#b8dcff',
          300: '#78bfff',
          400: '#3a9fff',
          500: '#0b7dda',
          600: '#0062b8',
          700: '#004d95',
        },
        mint:  { 100: '#ddf5ec', 400: '#5cc9a7', 600: '#2a9d6f' },
        coral: { 100: '#ffe4e4', 400: '#ff7b7b', 600: '#d63b3b' },
        sand:  { 50: '#faf8f5', 100: '#f5f0e8', 200: '#e8dcc8' },
      },
      fontFamily: {
        display: ['"DM Sans"', 'system-ui', 'sans-serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,.06), 0 6px 16px rgba(0,0,0,.04)',
        lift: '0 4px 24px rgba(0,0,0,.08)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
