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
        'ak-bg': '#0A1215',
        'ak-primary': '#07D1AF',
        'ak-surface': '#0D171B',
        'ak-surface-2': '#122027',
        'ak-text-primary': '#E9F1F3',
        'ak-text-secondary': '#A9B6BB',
        'ak-border': '#1A262C',
        'ak-danger': '#FF6B6B',
      },
    },
  },
  plugins: [],
}

