import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  base: '/',
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      overlay: true,
      timeout: 10000,
    },
    // Keep connections alive
    cors: true,
  },
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    exclude: ['tus-js-client'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
