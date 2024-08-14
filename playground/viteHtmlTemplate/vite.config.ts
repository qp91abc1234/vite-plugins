import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ViteHtmlTemplate from 'vite-html-template'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/vite-pro/',
  plugins: [
    vue(),
    ViteHtmlTemplate({
      inject: [{
        data: {
          ver: 'vite-pro'
        }
      }]
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
