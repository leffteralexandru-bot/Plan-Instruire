/** @type {import('tailwindcss').Config} */
import containerQueries from '@tailwindcss/container-queries';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        corporate: {
          /** artgranit.ro — theme-color #000000 */
          black: '#0c0c0c',
          darker: '#000000',
          /** Accent auriu — #B38F55 din site */
          gold: '#B38F55',
          'gold-hover': '#9a7648',
          'gold-light': '#f5efe6',
          stone: '#5a5041',
          muted: '#757575',
          surface: '#f5f5f5',
          'surface-warm': '#fafafa',
          border: '#e8e8e8',
          /** Aliasuri compatibilitate */
          dark: '#0c0c0c',
          accent: '#B38F55',
          'accent-blue': '#B38F55',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        neural:
          '0 4px 24px -4px rgba(12, 12, 12, 0.1), 0 0 0 1px rgba(12, 12, 12, 0.04)',
        'neural-lg': '0 12px 40px -8px rgba(12, 12, 12, 0.14)',
        gold: '0 4px 20px -4px rgba(179, 143, 85, 0.35)',
        'gold-soft': '0 0 32px -8px rgba(179, 143, 85, 0.25)',
      },
      backgroundImage: {
        'artgranit-stone':
          'linear-gradient(145deg, #ffffff 0%, #faf7f2 38%, #ffffff 72%, #f5efe6 100%)',
        'artgranit-dark':
          'linear-gradient(165deg, #0c0c0c 0%, #141414 42%, #0c0c0c 100%)',
      },
      keyframes: {
        'artgranit-shimmer': {
          '0%': { transform: 'translateX(-120%) skewX(-12deg)' },
          '100%': { transform: 'translateX(220%) skewX(-12deg)' },
        },
        'artgranit-glow': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.7' },
        },
        'artgranit-border': {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'artgranit-shimmer': 'artgranit-shimmer 4.5s ease-in-out infinite',
        'artgranit-glow': 'artgranit-glow 5s ease-in-out infinite',
        'artgranit-border': 'artgranit-border 3.5s ease-in-out infinite',
      },
    },
  },
  plugins: [containerQueries],
};
