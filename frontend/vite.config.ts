import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';

// Get git commit SHA for version stamp
const getGitSha = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __GIT_SHA__: JSON.stringify(getGitSha()),
    __APP_VERSION__: JSON.stringify('0.1.0'),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  server: {
    // Bind to 127.0.0.1 explicitly to avoid IPv6 ECONNREFUSED issues
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    // Proxy API requests to backend (fixes JSON parse errors from HTML responses)
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Proxy only backend auth endpoints, avoid proxying UI routes like /auth/privacy-consent
      '/auth/oauth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/auth/me': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/auth/logout': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
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
