import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project site: https://agito522.github.io/weekly-fund-dashboard/
export default defineConfig({
  base: '/weekly-fund-dashboard/',
  plugins: [react()],
})
