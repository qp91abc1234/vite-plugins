import { join } from 'node:path'
import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import ViteImgUpload from 'vite-img-upload'
import OSS from 'ali-oss'
import aliInfo from '../../env.json'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/vite-pro/',
  plugins: [
    uni(),
    ViteImgUpload({
      upload: async (uploadItems) => {
        const client: any = new OSS(aliInfo)
        const promises = uploadItems.map(({ md5Name, source }) => {
          return client.put(`tst/${md5Name}`, source)
        })

        return await Promise.all(promises)
      },
    }),
  ],
  resolve: {
    alias: {
      '@': join(__dirname, './src'),
    },
  },
})
