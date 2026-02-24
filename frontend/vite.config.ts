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
    host: process.env.VITE_DEV_HOST ?? '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: (() => {
      const target = process.env.VITE_PROXY_TARGET ?? 'http://localhost:3000';
      return {
        '/api': { target, changeOrigin: true },
        '/auth/oauth': { target, changeOrigin: true },
        '/auth/me': { target, changeOrigin: true },
        '/auth/logout': { target, changeOrigin: true },
        '/auth/signup': { target, changeOrigin: true },
        '/auth/login': { target, changeOrigin: true },
        '/auth/verify-email': { target, changeOrigin: true },
        '/auth/resend-code': { target, changeOrigin: true },
        '/auth/update-preferences': { target, changeOrigin: true },
        '^/auth/invite(?:$|/(?:validate|accept)$)': {
          target,
          changeOrigin: true,
        },
      };
    })(),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    // Define test-specific environment variables for import.meta.env
    env: {
      VITE_AGENTS_ENABLED: 'true',
      VITE_MOTION_ENABLED: 'true',
      VITE_CURSOR_GLOW_ENABLED: 'false',
      VITE_ENABLE_DEV_LOGIN: 'true',
      VITE_API_URL: 'http://localhost:3000',
      VITE_DEFAULT_LOCALE: 'en',
      VITE_BRAND_NAME: 'AKIS',
    },
  },
});
