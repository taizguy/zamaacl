import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Avoid Vite emitting a modulepreload polyfill file which can
    // sometimes be picked up by PostCSS during certain CI builds.
    polyfillModulePreload: false,
  },
})
