import { defineConfig } from 'vitest/config';
import { existsSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Release guard (P-108): a public/placeholder build must never bundle the
 * local-only original artwork directory.
 */
function guardOriginalAssets() {
  return {
    name: 'guard-original-assets',
    apply: 'build' as const,
    configResolved() {
      const mode = process.env.VITE_ASSET_MODE ?? 'placeholder';
      if (mode !== 'original' && existsSync('public/assets-original')) {
        throw new Error(
          'public/assets-original/ exists — run `node scripts/extract-assets.mjs --mode=placeholder` (or verify-assets --mode=release) before a public build.',
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [
    guardOriginalAssets(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.svg'],
      manifest: {
        name: 'Focus Grove',
        short_name: 'Focus Grove',
        description: 'Plant a tree, grow your focus. Offline-first focus timer.',
        theme_color: '#51A387',
        background_color: '#51A387',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icons/maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,woff2}'],
        navigateFallbackDenylist: [/^\/(assets|assets-original)\//],
        runtimeCaching: [
          {
            urlPattern: /\/(assets|assets-original)\/(trees|sounds|ui)\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fg-assets',
              expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 60 },
            },
          },
          {
            urlPattern: /\/catalog\/.*\.json$/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'fg-catalog' },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    watch: process.env.VITE_USE_POLLING === '1' ? { usePolling: true, interval: 300 } : undefined,
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router', 'zustand'],
          data: ['dexie', 'dexie-react-hooks'],
          fx: ['framer-motion', 'howler', 'html-to-image', 'lottie-web'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
