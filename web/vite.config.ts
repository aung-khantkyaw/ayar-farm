import { defineConfig } from 'vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { resolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/', 
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
  ],
    resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    // Docker Desktop bind mounts (Windows host) often miss fs events.
    // Polling guarantees HMR triggers; enabled via VITE_USE_POLLING=true
    // in docker-compose.dev.yml. No effect on production builds.
    watch: {
      usePolling: process.env.VITE_USE_POLLING === 'true',
      interval: 1000,
    },
    proxy: {
      '/api/market': {
        target: 'https://mm-market-api.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/market/, '/api/market')
      },
      '/v2/weather': {
        target: 'https://getweatherbycity.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/v2\/weather/, '/v2/weather')
      }
    }
  },
  preview: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: [process.env.ALLOWED_HOST || 'ayarfarm-web.onrender.com']
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
