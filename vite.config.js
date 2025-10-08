import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Em Cloudflare Pages na raiz do domínio, use "/" para evitar tela branca por caminho relativo
  base: "/",
  build: { sourcemap: true } // ajuda a ver erro real no console, se tiver
})
