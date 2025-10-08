import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: "/",           // deixe assim por enquanto (funciona no Pages na raiz)
  build: { sourcemap: true }
})
