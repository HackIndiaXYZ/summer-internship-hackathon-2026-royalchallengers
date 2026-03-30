/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#006B5B',
          deep: '#005144',
          container: '#006b5b',
          fixed: '#9ff2de',
        },
        surface: {
          DEFAULT: '#f2fcf9',
          low: '#ecf6f3',
          lowest: '#ffffff',
          bright: '#f2fcf9',
          variant: '#dbe5e2',
          dim: '#d2dcd9',
        },
        'on-surface': {
          DEFAULT: '#141d1c',
          variant: '#3e4946',
        },
        secondary: {
          DEFAULT: '#006c4c',
          container: '#78fac3',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
        verdict: {
          safe: '#16A34A',
          limit: '#D97706',
          avoid: '#DC2626',
        }
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'ambient': '0 2px 12px rgba(0, 107, 91, 0.08)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
