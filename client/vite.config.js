// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',        // SW tự kiểm tra cập nhật
      injectRegister: 'auto',            // tự chèn code register SW
      manifest: {
        name: 'HUIT Social Credits',
        short_name: 'HUIT SC',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0ea5e9',
        icons: [
          { src: 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        runtimeCaching: [
          // Ví dụ: cache API GET
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/') && url.search === '',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'api-cache', matchOptions: { ignoreVary: true } }
          },
          // Ví dụ: cache ảnh
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      }
    })
  ]
})
