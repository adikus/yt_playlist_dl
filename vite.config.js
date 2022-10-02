import { fileURLToPath, URL } from 'node:url'
import { resolve } from 'path'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuePugPlugin from 'vue-pug-plugin'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
    manifest: true,
    rollupOptions: {
      input: resolve(__dirname, 'frontend/main.js')
    },
  },
  plugins: [vue({template: {preprocessOptions: {plugins: [vuePugPlugin]}}})],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./frontend', import.meta.url)),
      '~bootstrap': resolve(__dirname, 'node_modules/bootstrap'),
      '~font-awesome': resolve(__dirname, 'node_modules/font-awesome'),
      'vue': 'vue/dist/vue.esm-bundler.js'  // Allow compiling templates in production build
    }
  }
})
