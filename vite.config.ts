import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative URLs also work when GitHub Pages serves /ProductLab-AI/.
  base: './',
  plugins: [react()],
  worker: { format: 'es' },
})
