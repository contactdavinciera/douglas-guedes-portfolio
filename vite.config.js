import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  base: '/',              // <- importante!
  server: {
    watch: { usePolling: true },
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
