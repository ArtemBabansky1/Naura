import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  // .glb models are fetched by URL (GLTFLoader); treat them as static assets.
  assetsInclude: ['**/*.glb'],
  build: {
    // Keep images as separate optimized files (the AVIF avatars are tiny and
    // load in parallel over HTTP/2) instead of inlining base64 into the eager
    // hero bundle, and so <picture> can negotiate avif/webp per request.
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // Split heavy, stable libraries so they cache independently of app code.
        // three is only ever dynamically imported (by the phone showcase), so its
        // chunk stays out of the initial load and downloads on approach.
        manualChunks: {
          gsap: ['gsap'],
          framer: ['framer-motion'],
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          lenis: ['lenis'],
          three: ['three'],
        },
      },
    },
  },
})
