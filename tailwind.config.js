/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'kawaii': ['Comfortaa', 'sans-serif'],
      },
      colors: {
        'kawaii-pink': {
          50: '#fef7ff',
          100: '#fde6ff',
          200: '#fbccfe',
          300: '#f8a3fc',
          400: '#f270f7',
          500: '#e542e8',
          600: '#c821cb',
          700: '#a51aa8',
          800: '#881888',
          900: '#6f1a6d',
        },
        'kawaii-purple': {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
        'kawaii-blue': {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      },
      animation: {
        'bounce-cute': 'bounce 1s infinite',
        'pulse-pink': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          'from': {
            'box-shadow': '0 0 20px #e542e8, 0 0 30px #e542e8, 0 0 40px #e542e8',
          },
          'to': {
            'box-shadow': '0 0 30px #f270f7, 0 0 40px #f270f7, 0 0 50px #f270f7',
          }
        }
      },
      backdropBlur: {
        'kawaii': '20px',
      }
    },
  },
  plugins: [],
};