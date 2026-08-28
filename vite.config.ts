import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        privacy: resolve(import.meta.dirname, 'privacy/index.html'),
        terms: resolve(import.meta.dirname, 'terms/index.html'),
        demo: resolve(import.meta.dirname, 'demo/index.html'),
        notFound: resolve(import.meta.dirname, '404.html'),
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'prompt',
      manifest: {
        name: 'Scan Reading Pack',
        short_name: 'Reading Pack',
        description: 'Turn scanned pages into traceable, audiobook-ready reading packs on your device.',
        id: '/?source=pwa',
        start_url: '/?v=1',
        scope: '/',
        display: 'standalone',
        background_color: '#090b12',
        theme_color: '#090b12',
        categories: ['utilities', 'books', 'productivity'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        navigateFallback: '/index.html',
        // Only known application routes receive the offline shell. Unknown
        // paths must reach Static Web Apps so its real HTTP 404 is preserved.
        navigateFallbackDenylist: [/^\/(?!$|index\.html$|demo\/?$|privacy\/?$|terms\/?$)/],
        globPatterns: ['**/*.{html,js,css,svg,png,webp,avif,woff2}'],
        globIgnores: ['ocr/**', 'tessdata/**'],
        maximumFileSizeToCacheInBytes: 3_000_000,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.sociobot\.in\/api\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'license-api-v1', networkTimeoutSeconds: 5, expiration: { maxEntries: 8, maxAgeSeconds: 86400 } },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/ocr/') || url.pathname.startsWith('/tessdata/'),
            handler: 'CacheFirst',
            options: { cacheName: 'ocr-assets-v1', expiration: { maxEntries: 12, maxAgeSeconds: 31_536_000 } },
          },
        ],
      },
    }),
  ],
});
