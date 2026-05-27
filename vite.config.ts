import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' produces relative asset URLs so the build works at any subpath
// on GitHub Pages (served at ankush-rustagi.github.io/zack-maps-prototype/).
export default defineConfig({
  plugins: [react()],
  base: './',
})
