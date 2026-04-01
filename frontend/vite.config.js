import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: false,  // Disable minification to avoid terser dependency
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 5173,
    open: true
  }
})