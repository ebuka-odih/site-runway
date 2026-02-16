import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const configuredBackendApiBaseUrl = env.BACKEND_API_BASE_URL?.trim();
  const legacyBackendOrigin = env.VITE_BACKEND_ORIGIN?.trim();
  const runtimeApiBaseUrl = configuredBackendApiBaseUrl || '/api/v1';

  let proxyTarget = legacyBackendOrigin || 'https://api.runwayalgo.com';
  let proxyRewrite: ((requestPath: string) => string) | undefined;

  if (configuredBackendApiBaseUrl) {
    const parsed = new URL(configuredBackendApiBaseUrl);
    const backendBasePath = parsed.pathname.replace(/\/$/, '');

    proxyTarget = parsed.origin;
    proxyRewrite = (requestPath: string) => requestPath.replace(/^\/api\/v1/, backendBasePath);
  } else if (!legacyBackendOrigin) {
    proxyRewrite = (requestPath: string) => requestPath.replace(/^\/api\/v1/, '/backend/public/api/v1');
  }

  return {
    define: {
      __API_BASE_URL__: JSON.stringify(runtimeApiBaseUrl),
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          rewrite: proxyRewrite,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
