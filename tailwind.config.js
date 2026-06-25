/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
    './constants/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        app: {
          bg: '#0a0c10',
          surface: '#141820',
          card: '#1a2030',
          border: '#2d3548',
          muted: '#8b94a8',
          dim: '#5c6578',
          text: '#f0f3fa',
          accent: '#5b9eff',
          'accent-pressed': '#4a8ae8',
          running: '#34d399',
          danger: '#f87171',
        },
      },
    },
  },
  plugins: [],
};
