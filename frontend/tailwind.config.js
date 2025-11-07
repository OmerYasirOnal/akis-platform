/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        'ak-primary': '#07D1AF',
        'ak-bg': '#0A1215',
        'ak-surface': '#0F181B',
        'ak-surface-2': '#141D21',
        'ak-text-primary': '#F5F5F5',
        'ak-text-secondary': '#B0B0B0',
        'ak-border': '#1F2932',
      },
    },
  },
  plugins: [],
}

