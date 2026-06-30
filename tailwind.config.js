/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fdf8f0',
          100: '#f9edd9',
          200: '#f3d9b0',
          300: '#e9be82',
          400: '#dd9d52',
          500: '#d4813a',
          600: '#c06830',
          700: '#9f502a',
          800: '#804128',
          900: '#693724',
        },
        sand: {
          50:  '#fdfcfb',
          100: '#f7f3ed',
          200: '#ede5d7',
          300: '#ddd1bd',
          400: '#c8b89a',
          500: '#b39e7b',
          600: '#957f60',
          700: '#7a654d',
          800: '#614f3e',
          900: '#504135',
        },
        slate: {
          850: '#1a2234',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(212, 129, 58, 0.3)',
        'glow-lg': '0 0 40px rgba(212, 129, 58, 0.4)',
        'card': '0 2px 20px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.05)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.07)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
