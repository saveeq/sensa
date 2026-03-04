import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths()
  ],
  
  server: {
    host: true, 
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        secure: false,

      },
      "/ws": {
        target: "ws://127.0.0.1:4000",
        ws: true,
        changeOrigin: true,
        rewriteWsOrigin: true,
      },
    },
  },
})
