/// <reference types="vitest/config" />
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    port: 5174,
    strictPort: false,
  },
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
          'docs/equipment/proliner/videos/**',
          '**/docs/equipment/proliner/videos/**',
          'docs/equipment/prodim-ct/pages/**',
          '**/docs/equipment/prodim-ct/pages/**',
          'docs/equipment/prodim-ct/videos/**',
          '**/docs/equipment/prodim-ct/videos/**',
          'docs/equipment/prodim-stairs/pages/**',
          '**/docs/equipment/prodim-stairs/pages/**',
          'docs/equipment/prodim-stairs/videos/**',
          '**/docs/equipment/prodim-stairs/videos/**',
          'docs/equipment/proliner-stairs-app/pages/**',
          '**/docs/equipment/proliner-stairs-app/pages/**',
          'docs/equipment/proliner-stairs-app/videos/**',
          '**/docs/equipment/proliner-stairs-app/videos/**',
          'docs/equipment/proliner-remote/pages/**',
          '**/docs/equipment/proliner-remote/pages/**',
          'docs/equipment/proliner-remote/videos/**',
          '**/docs/equipment/proliner-remote/videos/**',
          'docs/equipment/proliner-new-remote/pages/**',
          '**/docs/equipment/proliner-new-remote/pages/**',
          'docs/equipment/proliner-new-remote/videos/**',
          '**/docs/equipment/proliner-new-remote/videos/**',
          'docs/equipment/bosch-gll-3-80/pages/**',
          '**/docs/equipment/bosch-gll-3-80/pages/**',
          'docs/equipment/bosch-gll-3-80/videos/**',
          '**/docs/equipment/bosch-gll-3-80/videos/**',
          'docs/equipment/bosch-glm-40/pages/**',
          '**/docs/equipment/bosch-glm-40/pages/**',
          'docs/equipment/bosch-glm-40/videos/**',
          '**/docs/equipment/bosch-glm-40/videos/**',
          'docs/equipment/bosch-tape-5m/pages/**',
          '**/docs/equipment/bosch-tape-5m/pages/**',
          'docs/equipment/bosch-tape-5m/videos/**',
          '**/docs/equipment/bosch-tape-5m/videos/**',
          'docs/equipment/factory-fabricator/pages/**',
          '**/docs/equipment/factory-fabricator/pages/**',
          'docs/equipment/factory-fabricator/videos/**',
          '**/docs/equipment/factory-fabricator/videos/**',
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
          {
            urlPattern: /\/docs\/equipment\/proliner\/videos\/.+\.mp4$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'proliner-manual-videos',
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
          {
            urlPattern: /\/docs\/equipment\/prodim-ct\/pages\/.+\.png$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'prodim-ct-manual-pages',
              expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/docs\/equipment\/prodim-ct\/videos\/.+\.mp4$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'prodim-ct-manual-videos',
              expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
          {
            urlPattern: /\/docs\/equipment\/prodim-stairs\/pages\/.+\.png$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'prodim-stairs-manual-pages',
              expiration: { maxEntries: 24, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/docs\/equipment\/prodim-stairs\/videos\/.+\.mp4$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'prodim-stairs-manual-videos',
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
          {
            urlPattern: /\/docs\/equipment\/proliner-stairs-app\/pages\/.+\.png$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'proliner-stairs-app-manual-pages',
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/docs\/equipment\/proliner-stairs-app\/videos\/.+\.mp4$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'proliner-stairs-app-manual-videos',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
          {
            urlPattern: /\/docs\/equipment\/proliner-remote\/pages\/.+\.png$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'proliner-remote-manual-pages',
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/docs\/equipment\/proliner-remote\/videos\/.+\.mp4$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'proliner-remote-manual-videos',
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
          {
            urlPattern: /\/docs\/equipment\/proliner-new-remote\/pages\/.+\.png$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'proliner-new-remote-manual-pages',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/docs\/equipment\/proliner-new-remote\/videos\/.+\.mp4$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'proliner-new-remote-manual-videos',
              expiration: { maxEntries: 4, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
          {
            urlPattern: /\/docs\/equipment\/bosch-gll-3-80\/pages\/.+\.png$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bosch-gll-380-manual-pages',
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/docs\/equipment\/bosch-gll-3-80\/videos\/.+\.mp4$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bosch-gll-380-manual-videos',
              expiration: { maxEntries: 6, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
          {
            urlPattern: /\/docs\/equipment\/bosch-glm-40\/pages\/.+\.png$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bosch-glm-40-manual-pages',
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/docs\/equipment\/bosch-glm-40\/videos\/.+\.mp4$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bosch-glm-40-manual-videos',
              expiration: { maxEntries: 6, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
          {
            urlPattern: /\/docs\/equipment\/bosch-tape-5m\/pages\/.+\.png$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bosch-tape-5m-manual-pages',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/docs\/equipment\/bosch-tape-5m\/videos\/.+\.mp4$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bosch-tape-5m-manual-videos',
              expiration: { maxEntries: 6, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
          {
            urlPattern: /\/docs\/equipment\/factory-fabricator\/pages\/.+\.png$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'factory-fabricator-manual-pages',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/docs\/equipment\/factory-fabricator\/videos\/.+\.mp4$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'factory-fabricator-manual-videos',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
              rangeRequests: true,
            },
          },
        ],
      },
    }),
  ],
});
