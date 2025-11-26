import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    // Define test-specific environment variables for import.meta.env
    env: {
      VITE_AGENTS_ENABLED: 'true',
      VITE_MOTION_ENABLED: 'false',
      VITE_CURSOR_GLOW_ENABLED: 'false',
      VITE_ENABLE_DEV_LOGIN: 'true',
      VITE_API_URL: 'http://localhost:3000',
      VITE_DEFAULT_LOCALE: 'en',
      VITE_BRAND_NAME: 'AKIS',
    },
  },
});
