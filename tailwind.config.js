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
        // HANOON color palette
        'hanoon-bg': '#0a0a12',
        'hanoon-panel': '#14141e',
        'hanoon-border': '#2a2a3a',
        'hanoon-text': '#e0e0e8',
        'hanoon-text-dim': '#8a8a9a',
        'hanoon-accent': '#00d4aa',
        'hanoon-warning': '#ffaa00',
        'hanoon-error': '#ff4466',
        'hanoon-success': '#00e676',
        'hanoon-halim': '#aa00ff',
        'hanoon-juli': '#00d4aa',
        'hanoon-nash': '#29b6f6',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
