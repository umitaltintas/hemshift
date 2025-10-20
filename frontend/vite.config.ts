import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tailwindcss from "@tailwindcss/vite";
//__dirname is a Node.js variable that points to the root of the project

const __dirname = path.dirname(new URL(import.meta.url).pathname);
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(),    tailwindcss(),],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
