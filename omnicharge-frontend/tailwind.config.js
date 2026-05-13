/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        galaxy: {
          bg: '#f8fafc',
          primary: '#2563eb',
          accent: '#7c3aed',
          slate: '#0f172a'
        },
        glass: {
          bg: 'rgba(255, 255, 255, 0.6)',
          border: 'rgba(255, 255, 255, 0.3)'
        }
      },
      animation: {
        'slow-drift': 'drift 20s ease-in-out infinite',
        'slow-twinkle': 'twinkle 3s ease-in-out infinite',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(10px, -10px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: 0.3 },
          '50%': { opacity: 1 },
        }
      }
    },
  },
  plugins: [],
}
