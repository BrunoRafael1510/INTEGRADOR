/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        sans: ['Inter', '"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eaf7f4',
          100: '#d2eee8',
          200: '#a9ddd4',
          300: '#7bc7bd',
          400: '#4daea3',
          500: '#328f85',
          600: '#28796f',
          700: '#23635b',
          800: '#1f504b',
          900: '#1b433f',
        },
        cyan: {
          50:  '#fff4ea',
          100: '#ffe4c9',
          200: '#ffc994',
          300: '#f8aa63',
          400: '#e58c3f',
          500: '#ca7130',
          600: '#a95728',
          700: '#884326',
          800: '#6f3824',
          900: '#5c3021',
        },
        sage: {
          50:  '#edf8ef',
          100: '#d7efd9',
          200: '#b2dfb8',
          300: '#84c890',
          400: '#5fae70',
          500: '#438f57',
          600: '#347444',
          700: '#2c5d39',
          800: '#274a31',
          900: '#213d2a',
        },
        stone: {
          50:  '#fffdf8',
          100: '#f7f1e7',
          200: '#eadfce',
          300: '#d9c8af',
          400: '#ad9881',
          500: '#75685d',
          600: '#5d534c',
          700: '#473f3a',
          800: '#302b28',
          900: '#211d1b',
        }
      },
      borderRadius: {
        '2xl': '0.75rem',
        '3xl': '0.75rem',
        '4xl': '0.75rem',
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(45,42,39,0.05)',
        'card': '0 8px 24px rgba(45,42,39,0.08)',
        'glow': '0 0 0 1px rgba(230,223,214,0.7)',
      },
      animation: {
        'fade-in': 'fadeIn 0.16s ease-out',
        'slide-up': 'slideUp 0.18s ease-out',
        'pulse-soft': 'pulseSoft 0.18s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
}
