import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const ghRepo = process.env.GITHUB_REPOSITORY?.split('/')?.[1]
const ghBase = `/${ghRepo || 'semantic-encoding-brain'}/`

export default defineConfig({
  plugins: [react()],
  // Tauri loads from local files in production; keep relative asset paths.
  // GitHub Pages serves under "/<repo>/", so set an explicit base in CI.
  base: process.env.TAURI_PLATFORM ? './' : process.env.GITHUB_PAGES ? ghBase : '/',
  server: {
    port: 5173,
    strictPort: true,
  },
})
