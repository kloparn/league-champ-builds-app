/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        hex: {
          void: '#010A13',
          deep: '#091428',
          shadow: '#0A1428',
          panel: '#0F1F33',
          border: '#1E3A4F',
          steel: '#3C5878',
          mist: '#A09B8C',
          parchment: '#F0E6D2',
          gold: '#C8AA6E',
          goldHi: '#F0E6D2',
          cyan: '#0AC8B9',
          cyanHi: '#0397AB'
        }
      },
      fontFamily: {
        display: ['"Cinzel"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        hex: '0 0 0 1px rgba(200, 170, 110, 0.3), 0 8px 24px rgba(0, 0, 0, 0.6)',
        hexHover: '0 0 0 1px rgba(240, 230, 210, 0.6), 0 12px 32px rgba(10, 200, 185, 0.25)'
      },
      animation: {
        'fade-in': 'fadeIn 600ms ease-out',
        'slide-up': 'slideUp 500ms ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: []
};
