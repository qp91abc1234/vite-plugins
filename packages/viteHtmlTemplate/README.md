---
theme: z-blue
---
#### 思路
- 在 transformIndexHtml 钩子中获取到 html 字符串
- 通过 ejs 模板引擎在 JavaScript 中注入数据生成 HTML
- 在 generateBundle 钩子中通过 html-minifier-terser 对 html 产物文件进行压缩

#### 插件使用
```
pnpm add vite-html-template -D
```
```
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ViteHtmlTemplate from 'vite-html-template'

export default defineConfig({
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
})
```

##### 参数说明
```
interface IInjectData {
  regx?: string
  data?: Record<string, any>
  tags?: HtmlTagDescriptor[]
  ejsOptions?: EJSOptions
}

interface IOptions {
  minify?: boolean | MinifyOptions
  inject?: IInjectData[]
}
````
- minify：是否压缩产物 html，是（默认）
- inject：注入数据数组
    - regx：正则字符串，用于匹配 html 文件名，不填则匹配所有
    - data：html 模板内注入的数据
    - tags：html 模板内注入的标签
    - ejsOptions：ejs 模板引擎参数

注入数据是通过正则对 html 文件名进行正则匹配，匹配到则使用该注入数据，不会再对后续注入数据进行匹配，因此通用注入数据要位于数组的末位

#### 核心逻辑
```js
export default function ViteHtmlTemplate(opts: IOptions) {
  let minify = opts.minify
  const injectData = opts.inject ?? []
  let config: ResolvedConfig

  return [{
      name: 'vite-html-template',
      configResolved(cfg) {
        config = cfg
      },
      transformIndexHtml: {
        order: 'pre',
        handler: async (html, ctx) => {
          const htmlName = path.basename(ctx.filename)

          // 根据 html 文件名寻找合适的注入数据
          let param: IInjectData = {}
          for (const item of injectData) {
            const regx = new RegExp(item.regx || '.*')
            if (regx.test(htmlName)) {
              param = item
              break
            }
          }

          // 注入数据考虑环境变量
          const ejsData: Record<string, any> = {
            ...config.env,
            ...(config.define ?? {}),
            ...(param.data ?? {}),
          }
          
          const finalHtml = await render(html, ejsData, param.ejsOptions)
          return {
            html: finalHtml,
            tags: param.tags ?? [],
          }
        },
      },
    }, { // html 压缩逻辑
      name: 'vite-html-compress',
      enforce: 'post',
      apply: 'build',
      async generateBundle(_, bundle) {
        if (minify === false) return
        const keys = Object.keys(bundle)
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i]
          const item = bundle[key]
          if (
            item.type === 'asset' &&
            item.fileName.endsWith('.html') &&
            typeof item.source === 'string'
          ) {
            item.source = await minifyFn(item.source, minify)
          }
        }
      },
    }
  ]
}
```

#### 最后
感兴趣的可移步[源码](https://github.com/qp91abc1234/vite-html-template)
