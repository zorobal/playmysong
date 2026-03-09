import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/auth': 'http://localhost:4000',
      '/request': 'http://localhost:4000',
      '/establishments': 'http://localhost:4000'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})

