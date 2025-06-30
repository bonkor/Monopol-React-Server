import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs';
import path from 'path';
import { configDefaults } from 'vitest/config';
import createSvgSpritePlugin from 'vite-plugin-svg-sprite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
//    createSvgSpritePlugin({
//      include: [path.resolve(__dirname, 'src/assets/icons/flags/**/*.svg')],
//      symbolId: 'icon-flag-[name]',
//      inject: 'body-last',
//      exportType: 'vanilla',
//    }),
//    createSvgSpritePlugin({
//      include: [path.resolve(__dirname, 'src/assets/icons/industries/**/*.svg')],
//      symbolId: 'icon-industries-[name]',
//      inject: 'body-last',
//      exportType: 'vanilla',
//    }),
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  server: {
    host: true,
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'certs/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'certs/cert.pem')),
    },
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
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.ts', 'shared/**/*.{test,spec}.ts'],
    exclude: [...configDefaults.exclude, 'node_modules'],
  },
})
