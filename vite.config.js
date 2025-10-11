import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  base: '/',              // <- importante!
  server: {
    port: 5173,
    strictPort: false,
    watch: { usePolling: true },
  },
  plugins: [react()],
  css: {
    preprocessorOptions: {},
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
    devSourcemap: false,
  },
  optimizeDeps: {
    exclude: ['tus-js-client'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
