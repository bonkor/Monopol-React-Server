import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs';
import path from 'path';
import { configDefaults } from 'vitest/config';

const certPath = path.resolve(__dirname, 'certs/key.pem');
const certExists = fs.existsSync(certPath);

const https = certExists
  ? {
      key: fs.readFileSync(certPath),
      cert: fs.readFileSync(path.resolve(__dirname, 'certs/cert.pem')),
    }
  : false;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  server: {
    host: true,
    https,
    watch: {
      ignored: ['**/debug.json', 'server/*'], // <-- игнорируем файлы
    },
    fs: {
      allow: ['.'], // позволяет Vite читать из /shared
    },
    proxy: {
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1500, // в килобайтах
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts', 'shared/**/*.{test,spec}.ts'],
    exclude: [...configDefaults.exclude, 'node_modules'],
  },
})
