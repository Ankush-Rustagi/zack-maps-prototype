import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' produces relative asset URLs so the build works at any subpath
// on GitHub Pages (served at ankush-rustagi.github.io/zack-maps-prototype/).
//
// The `mapbox-gl` alias points to the CSP-safe build. The default
// `mapbox-gl.js` uses dynamic `import()` with `import.meta.url`. When Vite
// bundles those into the worker chunk, the resulting Worker is classic
// (not `{ type: 'module' }`), and `import.meta` throws at runtime, leaving
// the basemap blank. `mapbox-gl-csp.js` ships without dynamic imports and
// pairs with `mapbox-gl-csp-worker.js` (loaded via `?worker` in main.tsx).
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    // Regex ensures we only rewrite the bare `mapbox-gl` specifier, not
    // `mapbox-gl/dist/mapbox-gl.css` or `mapbox-gl/dist/mapbox-gl-csp-worker.js`.
    alias: [
      { find: /^mapbox-gl$/, replacement: 'mapbox-gl/dist/mapbox-gl-csp.js' },
    ],
  },
})
