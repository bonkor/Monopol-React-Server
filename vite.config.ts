import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path';
import { configDefaults } from 'vitest/config';

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
    watch: {
      ignored: ['**/debug.json'], // <-- игнорируем файл
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
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts', 'shared/**/*.{test,spec}.ts'],
    exclude: [...configDefaults.exclude, 'node_modules'],
  },
})
