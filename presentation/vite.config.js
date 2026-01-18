import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Tauri loads from local files in production; keep relative asset paths.
  // GitHub Pages serves under "/<repo>/", so set an explicit base in CI.
  base: process.env.TAURI_PLATFORM ? './' : process.env.GITHUB_PAGES ? '/semantic-encoding-brain/' : '/',
  server: {
    port: 5173,
    strictPort: true,
  },
})
