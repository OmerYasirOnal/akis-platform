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
        'ak-surface-3': 'var(--ak-surface-3)',
        'ak-text-primary': 'var(--ak-text-primary)',
        'ak-text-secondary': 'var(--ak-text-secondary)',
        'ak-border': 'var(--ak-border)',
        'ak-danger': 'var(--ak-danger)',
      },
      // Glow shadows (Liquid Neon)
      boxShadow: {
        'ak-glow': 'var(--ak-glow-accent)',
        'ak-glow-sm': 'var(--ak-glow-subtle)',
        'ak-glow-lg': '0 0 40px rgba(7, 209, 175, 0.3)',
        'ak-sm': '0 2px 8px rgba(0, 0, 0, 0.4)',
        'ak-md': '0 4px 16px rgba(0, 0, 0, 0.5)',
        'ak-lg': '0 8px 32px rgba(0, 0, 0, 0.6)',
        'ak-elevation-1': 'var(--ak-elevation-1)',
        'ak-elevation-2': 'var(--ak-elevation-2)',
        'ak-elevation-3': 'var(--ak-elevation-3)',
      },
      borderRadius: {
        'ak-card': 'var(--ak-card-radius)',
      },
      spacing: {
        'ak-section': 'var(--ak-section-gap)',
        'ak-card': 'var(--ak-card-padding)',
      },
      // Motion durations
      transitionDuration: {
        'fast': 'var(--ak-motion-fast)',
        'base': 'var(--ak-motion-base)',
        'slow': 'var(--ak-motion-slow)',
      },
      // Blur values
      blur: {
        'backdrop': 'var(--ak-blur-backdrop)',
        'card': 'var(--ak-blur-card)',
        'blob': 'var(--ak-blur-blob)',
      },
      // Animation keyframes for liquid background
      keyframes: {
        'blob-drift': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.15' },
          '25%': { transform: 'translate(20px, -15px) scale(1.05)', opacity: '0.18' },
          '50%': { transform: 'translate(-10px, 10px) scale(0.95)', opacity: '0.12' },
          '75%': { transform: 'translate(15px, 20px) scale(1.02)', opacity: '0.16' },
        },
        'blob-drift-alt': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)', opacity: '0.12' },
          '33%': { transform: 'translate(-25px, 10px) scale(1.08)', opacity: '0.15' },
          '66%': { transform: 'translate(15px, -20px) scale(0.92)', opacity: '0.10' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'blob-drift': 'blob-drift 20s ease-in-out infinite',
        'blob-drift-alt': 'blob-drift-alt 25s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 200ms ease-out',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
