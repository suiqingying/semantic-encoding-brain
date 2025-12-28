import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Tauri loads from local files in production; keep relative asset paths.
  base: process.env.TAURI_PLATFORM ? './' : '/',
  server: {
    port: 5173,
    strictPort: true,
  },
})
