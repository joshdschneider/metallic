import { sentryVitePlugin } from '@sentry/vite-plugin';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'path';
import { defineConfig } from 'vite';

if (process.env['NODE_ENV'] !== 'production') {
  const dirName = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.resolve(dirName, '../../.env');
  dotenv.config({ path: envPath });
}

export default defineConfig({
  server: { port: Number(process.env.DASHBOARD_PORT) || 3000 },
  define: { 'process.env': process.env },
  plugins: [
    react(),
    sentryVitePlugin({
      org: 'metallic',
      project: 'metallic-dashboard',
      authToken: process.env.SENTRY_AUTH_TOKEN
    })
  ]
});
