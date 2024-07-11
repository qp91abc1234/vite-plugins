import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import OSS from 'ali-oss'
import ViteImgUpload from 'vite-img-upload'
import aliInfo from '../../env.json'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/vite-pro/',
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue'],
    }),
    Components({
      resolvers: [NaiveUiResolver()],
    }),
    ViteImgUpload({
      upload: async (uploadItems) => {
        const client = new OSS(aliInfo)
        const promises = uploadItems.map(({ md5Name, source }) => {
          return client.put(`tst/${md5Name}`, source)
        })

        return await Promise.all(promises)
      },
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import '@/common/scss/mixin.scss';`,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
