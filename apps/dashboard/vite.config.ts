import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import path from 'path';
import { defineConfig } from 'vite';

const dirName = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(dirName, '../../.env');
dotenv.config({ path: envPath });

export default defineConfig({
  plugins: [react()],
  server: { port: Number(process.env.DASHBOARD_PORT) || 4300 },
  define: { 'process.env': process.env }
});
