import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // ~170 KB gzipped including the Supabase client: fine for this app.
  build: { chunkSizeWarningLimit: 700 },
})
