import type { ResolvedConfig } from 'vite'
import type { HtmlTagDescriptor } from 'vite'
import type { Options as EJSOptions } from 'ejs'
import { render } from 'ejs'
import path from 'node:path'
import type { Options as MinifyOptions } from 'html-minifier-terser'
import { minify as minifyFn } from 'html-minifier-terser'

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

export default function ViteHtmlTemplate(opts: IOptions) {
  let minify = opts.minify
  const injectData = opts.inject ?? []
  let config: ResolvedConfig

  if(minify === null || minify === undefined || minify === true) {
    minify = {
      collapseWhitespace: true,
      keepClosingSlash: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      useShortDoctype: true,
      minifyCSS: true,
    }
  }

  return [{
      name: 'vite-html-template',
      configResolved(cfg) {
        config = cfg
      },
      transformIndexHtml: {
        order: 'pre',
        handler: async (html, ctx) => {
          const htmlName = path.basename(ctx.filename)

          let param: IInjectData = {}
          for (const item of injectData) {
            const regx = new RegExp(item.regx || '.*')
            if (regx.test(htmlName)) {
              param = item
              break
            }
          }

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
    }, {
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
