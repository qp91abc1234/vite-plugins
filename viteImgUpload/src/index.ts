import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ResolvedConfig } from 'vite'
import type { JpegOptions, PngOptions } from 'sharp'
import sharp from 'sharp'
import ansi from 'ansi-colors'

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

let __filename
let __dirname

if (typeof __filename === 'undefined') {
  // ESM 环境
  __filename = fileURLToPath(import.meta.url)
  __dirname = path.dirname(__filename)
}
else {
  // CJS 环境
  // eslint-disable-next-line
  __dirname = __dirname
}

export default function ViteImgUpload(opts: IOptions) {
  let config: ResolvedConfig
  opts.log = opts.log ?? true
  opts.cache = opts.cache ?? true

  const logInfo = {}
  const imgsMap = {}

  function isImg(val) {
    const imageRegex = /\.(?:jpg|jpeg|png|gif|bmp|webp)$/i
    return imageRegex.test(val)
  }

  function isAssetMatch(name: string, matcher): boolean {
    if (Object.prototype.toString.call(matcher) === '[object String]')
      return name === matcher
    if (Object.prototype.toString.call(matcher) === '[object RegExp]')
      return matcher.test(name)
    if (Array.isArray(matcher))
      return matcher.includes(name)
    return false
  }

  function checkAsset(val) {
    if (!isImg(val))
      return false

    if (opts.include && isAssetMatch(val, opts.include)) {
      return true
    }

    if (opts.exclude && isAssetMatch(val, opts.exclude)) {
      return false
    }

    if (opts.test && !opts.test.test(val)) {
      return false
    }

    return true
  }

  async function getCache() {
    const filePath = path.join(__dirname, 'cache.json')

    let cache = {}
    try {
      if (opts.cache === true) {
        // 检查文件是否存在
        await fs.access(filePath, fs.constants.F_OK)

        // 文件存在，读取并修改内容
        const data = await fs.readFile(filePath, 'utf8')
        cache = JSON.parse(data)
      }
    }
    catch (err: any) {
      if (err.code === 'ENOENT') {
        const dataToWrite = JSON.stringify(cache, null, 2)
        await fs.writeFile(filePath, dataToWrite, 'utf8')
      }
      else {
        console.error('Error:', err)
      }
    }

    return {
      cache,
      async updateCache() {
        if (opts.cache === false)
          return
        const updatedJsonData = JSON.stringify(cache, null, 2)
        await fs.writeFile(filePath, updatedJsonData, 'utf8')
      },
    }
  }

  async function compressImg(uploadItems) {
    const promises = uploadItems.map(async (item) => {
      const { name, source } = item
      const nameArr = name.split('.')
      const ext = nameArr[nameArr.length - 1]
      const p = await sharp(source)
        .toFormat(ext, opts[ext] || { quality: 80 })
        .toBuffer()
        .then((buffer) => {
          const oldSize: number = item.source.byteLength
          const newSize: number = buffer.byteLength

          logInfo[name] = logInfo[name] || {}
          logInfo[name].oldSize = oldSize
          logInfo[name].newSize = newSize

          if (newSize < oldSize) {
            item.source = buffer
          }
        })
      return p
    })

    await Promise.all(promises)
  }

  async function uploadImg(bundle) {
    const keys = Object.keys(bundle)
    const { cache, updateCache } = await getCache()

    const uploadItems: any[] = []
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const item = bundle[key]

      if (item.type === 'asset' && checkAsset(item.name)) {
        const cacheKey = `${key}-${item.source.byteLength}`
        if (cache[cacheKey]) {
          imgsMap[key] = cache[cacheKey]
          delete bundle[key]
        }
        else {
          const nameArr = item.fileName.split('/')
          uploadItems.push({
            key,
            cacheKey,
            name: item.name,
            md5Name: nameArr[nameArr.length - 1],
            source: item.source,
          })
        }
      }
    }

    await compressImg(uploadItems)
    const resultArr = await opts.upload(uploadItems)
    uploadItems.forEach(({ key, cacheKey, name }, index) => {
      imgsMap[key] = resultArr[index].url
      cache[cacheKey] = resultArr[index].url
      logInfo[name].url = resultArr[index].url
      delete bundle[key]
    })

    updateCache()
  }

  async function replaceImgPath(bundle) {
    const imageRegex = new RegExp(`(?:\.\.\/|\\.\\.)*${config.base}(${config.build.assetsDir}/.*?\\.(?:jpg|jpeg|png|gif|bmp|webp))`, 'gi')
    const replaceFunc: Function = (match, p1) => {
      return imgsMap[p1] || match
    }

    const chunkKeys = Object.keys(bundle)
    chunkKeys.forEach((key) => {
      if(bundle[key].type === 'asset') return
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
    closeBundle() {
      if (!opts.log)
        return
      console.info(ansi.greenBright('\nvite-img-upload:'))
      for (const key in logInfo) {
        const item = logInfo[key]
        const sizeChange = item.oldSize > item.newSize ? `compress: ${item.oldSize} -> ${item.newSize}` : 'compress: none'
        console.info(`${ansi.yellow(key)}: ${item.url} ${sizeChange}`)
      }
      console.info(ansi.greenBright('\nvite-img-upload finished!'))
    },
  }
}
