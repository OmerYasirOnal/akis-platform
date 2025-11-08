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
        'ak-bg': 'var(--ak-bg)',
        'ak-primary': 'var(--ak-primary)',
        'ak-primary-soft': 'var(--ak-primary-soft)',
        'ak-surface': 'var(--ak-surface)',
        'ak-surface-2': 'var(--ak-surface-2)',
        'ak-text-primary': 'var(--ak-text-primary)',
        'ak-text-secondary': 'var(--ak-text-secondary)',
        'ak-border': 'var(--ak-border)',
        'ak-danger': 'var(--ak-danger)',
      },
    },
  },
  plugins: [],
}

