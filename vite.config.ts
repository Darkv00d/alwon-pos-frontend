import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Alwon POS',
        short_name: 'Alwon',
        description: 'Sistema POS para tiendas automatizadas',
        theme_color: '#00BFFF',
        background_color: '#FAFAFA',
        display: 'standalone',
        orientation: 'landscape',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8088',
        changeOrigin: true
      },
      '/sessions': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/carts': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/products': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/payments': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/access': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/camera': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
