import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    sveltekit(),
    SvelteKitPWA({
      // Never auto-reload mid-session: prompt the user to refresh (spec §13).
      registerType: 'prompt',
      manifest: {
        name: 'Bridgette Bar Training',
        short_name: 'Bridgette',
        description: 'Wine training for Bridgette Bar Calgary — wines, pairings, pronunciation, and guest practice.',
        start_url: '/today',
        id: '/today',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#132b3b',
        background_color: '#132b3b',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // Precache the app shell + data + audio so the PWA works offline.
        // woff2 only — every SW-capable browser reads woff2, so the parallel .woff
        // files are dead weight in the precache (PERF-01).
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2,mp3,json}']
      }
    })
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    exclude: ['**/node_modules/**', 'tests/**', '.svelte-kit/**']
  }
});
