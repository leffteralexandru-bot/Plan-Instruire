/// <reference types="vitest/config" />
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
  test: {
    globals: true,
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
  plugins: [    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      includeAssets: ['favicon.png', 'favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'artGRANIT — Plan Instruire Inginer Proiectant',
        short_name: 'artGRANIT',
        description: 'Plan de Instruire și Adaptare Profesională — Rol Inginer Proiectant',
        theme_color: '#000000',
        background_color: '#0c0c0c',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Nu include toate PNG-urile — paginile Proliner (2–4 MB) depășesc limita Workbox
        globPatterns: [
          '**/*.{js,css,html,ico,svg,woff2}',
          'icons/icon-*.png',
          'favicon.png',
          'docs/**/*.html',
        ],
        globIgnores: [
          '**/node_modules/**',
          'docs/equipment/proliner/pages/**',
          '**/docs/equipment/proliner/pages/**',
        ],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /\/docs\/equipment\/proliner\/pages\/.+\.png$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'proliner-manual-pages',
              expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
