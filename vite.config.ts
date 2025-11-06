import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  base: isProd ? '/Video-Frame-Extractor/' : '/',
  plugins: [react()],
})
