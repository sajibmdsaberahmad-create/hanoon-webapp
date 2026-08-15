/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surface / chrome
        'hanoon-bg': '#0a0d14',
        'hanoon-surface': '#11151f',
        'hanoon-surface-2': '#171c29',
        'hanoon-border': '#232a3a',
        'hanoon-border-soft': 'rgba(255,255,255,0.06)',
        'hanoon-text': '#e7ebf2',
        'hanoon-text-dim': '#93a1b5',
        'hanoon-text-faint': '#5b6a80',
        // Semantic
        'hanoon-accent': '#2dd4bf',
        'hanoon-success': '#34d399',
        'hanoon-warning': '#fbbf24',
        'hanoon-error': '#f87171',
        // Brains
        'hanoon-juli': '#2dd4bf',
        'hanoon-nash': '#60a5fa',
        'hanoon-halim': '#a78bfa',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.18)',
        'card-hover': '0 1px 2px rgba(0,0,0,0.35), 0 14px 40px rgba(0,0,0,0.32)',
        tab: '0 0 0 1px rgba(45,212,191,0.25), 0 4px 14px rgba(45,212,191,0.15)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-6px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
        'fade-in-up': 'fade-in-up 0.3s cubic-bezier(0.16,1,0.3,1)',
        'slide-in': 'slide-in 0.25s cubic-bezier(0.16,1,0.3,1)',
        'pulse-slow': 'pulse 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
