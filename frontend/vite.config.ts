import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node', // Use node for API tests, jsdom only if needed for component tests
    setupFiles: './src/test/setup.ts',
  },
});
