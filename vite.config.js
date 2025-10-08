import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',                  // Pages na raiz do domínio
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)), // <-- habilita "@/..." apontando para /src
    },
  },
  build: { sourcemap: true },
})
