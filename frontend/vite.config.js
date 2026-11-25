import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API calls to backend during development
      '/api': {
        target: process.env.VITE_API_URL ? process.env.VITE_API_URL.replace('/api','') : 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})\n
