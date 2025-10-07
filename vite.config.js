import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  server: {
    watch: {
      usePolling: true
    }
  },

  plugins: [react(),tailwindcss()],
  build: {
    rollupOptions: {
      external: ['tus-js-client'],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
