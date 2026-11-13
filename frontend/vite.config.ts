import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt', // UpdateBanner asks before reloading, so a half-filled form isn't lost
      includeAssets: ['favicon.svg', 'icon.svg', 'icons/*.png'],
      manifest: {
        id: '/',
        name: 'SplitItt — Expense Splitter',
        short_name: 'SplitItt',
        description: 'Split group expenses with friends, roommates, and travel crews.',
        theme_color: '#0A0A0A', // matches the dark app icon and the TWA splash (android/twa-manifest.json)
        background_color: '#0A0A0A',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'en-IN',
        dir: 'ltr',
        categories: ['finance', 'utilities'],
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': `${import.meta.dirname}/src`,
    },
  },
})
