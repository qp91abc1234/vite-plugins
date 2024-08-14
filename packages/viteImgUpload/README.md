#### 思路

- 在 vite 打包过程中获取项目所用到的图片
  - 在 generateBundle 钩子中，获取类型为 asset 的 chunk
  - 进一步识别 chunk 是否为图片资源，就可以获取项目所用到的图片
- 将图片资源进行上传
- 将上传后的远程图片路径替换掉代码中使用的本地图片路径

#### 插件使用

```
pnpm add vite-img-upload -D
```

```
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import OSS from 'ali-oss'
import ViteImgUpload from 'vite-img-upload'
import aliInfo from '../../env.json'

export default defineConfig({
  plugins: [
    vue(),
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
})
```

##### 参数说明

```
interface IOptions {
  log?: boolean
  cache?: boolean | 'reset'
  test?: RegExp
  include?: RegExp | string | string[]
  exclude?: RegExp | string | string[]
  png?: PngOptions
  jpeg?: JpegOptions
  jpg?: JpegOptions
  upload: (uploadItems: { md5Name: string, source: any }[]) => Promise<{ url: string }[]>
}
```

- log：是否打印日志，是（默认）
- cache：是否进行缓存，是（默认）/否/重置缓存
- test/include/exclude：过滤选项
- png/jpeg/jpg：上传过程中的图片压缩选项
- upload：上传逻辑【必填】

#### 核心逻辑

代码不长，主要就是 generateBundle 钩子下的 uploadImg 和 replaceImgPath 两个函数

- uploadImg 将符合条件的 chunk 进行上传，并记录上传前后的路径映射
- replaceImgPath 则通过正则和路径映射去替换代码和样式中的图片路径

```
import type { ResolvedConfig } from 'vite'

interface IOptions {
  upload: (uploadItems: { md5Name: string, source: any }[]) => Promise<{ url: string }[]>
}

export default function ViteImgUpload(opts: IOptions) {
  let config: ResolvedConfig
  const imgsMap = {}

  async function uploadImg(bundle) {
    const keys = Object.keys(bundle)

    const uploadItems: any[] = []
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const item = bundle[key]

      // 检测资源是否符合条件，ex.是否为图片，是否被 include or exclude
      if (item.type === 'asset' && checkAsset(item.name)) {
          const nameArr = item.fileName.split('/')
          uploadItems.push({
            key,
            name: item.name,
            md5Name: nameArr[nameArr.length - 1],
            source: item.source,
          })
        }
      }

    // 此处将上传逻辑放于插件外，由业务侧进行逻辑书写
    const resultArr = await opts.upload(uploadItems)
    uploadItems.forEach(({ key }, index) => {
      // 缓存上传后的 url 用于后续路径替换
      imgsMap[key] = resultArr[index].url
      // 上传后删除 chunk，防止生成产物图片
      delete bundle[key]
    })
  }

  async function replaceImgPath(bundle) {
    const imageRegex = new RegExp(`(?:\.\.\/|\\.\\.)*${config.base}(${config.build.assetsDir}/.*?\\.(?:jpg|jpeg|png|gif|bmp|webp))`, 'gi')
    const replaceFunc: Function = (match, p1) => {
      return imgsMap[p1] || match
    }

    // 遍历剩余的代码文件和 css，采用正则匹配的方式对文件内图片的路径进行替换
    const chunkKeys = Object.keys(bundle)
    chunkKeys.forEach((key) => {
      const item = bundle[key]
      if (item.source) {
        item.source = item.source.replace(imageRegex, replaceFunc)
      }
      else {
        item.code = item.code.replace(imageRegex, replaceFunc)
      }
    })
  }

  return {
    name: 'vite-img-upload',
    enforce: 'post' as any,
    configResolved(cfg) {
      config = cfg
    },
    generateBundle: async (_, bundle) => {
      await uploadImg(bundle)
      replaceImgPath(bundle)
    },
  }
}
```

#### 最后

除了上述核心功能外，还加入了其他功能

- 图片压缩
- 上传缓存
- ...

感兴趣的可移步[源码](https://github.com/qp91abc1234/vite-img-upload)
