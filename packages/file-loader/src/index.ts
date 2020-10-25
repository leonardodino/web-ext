import path = require('path')
import loaderUtils = require('loader-utils')
import schemaUtils = require('schema-utils')
import schema = require('./options.json')

const { validate } = schemaUtils
const { getOptions, interpolateName } = loaderUtils

type Options = import('./types').Options
type Loader = import('webpack').loader.Loader

const isImmutable = (name: Options['name']): boolean => {
  if (typeof name !== 'string') return false
  return /\[([^:\]]+:)?(hash|contenthash)(:[^\]]+)?\]/gi.test(name)
}

const WebExtFileLoader: Loader = function WebExtFileLoader(content) {
  const options = getOptions(this) as Options

  validate(schema as any, options, {
    name: 'File Loader',
    baseDataPath: 'options',
  })

  const context = options.context || this.rootContext
  const name = options.name || '[name].[contenthash].[ext]'

  const url = interpolateName(
    this,
    // @ts-ignore
    name,
    { context, content, regExp: options.regExp },
  )

  const outputPath =
    typeof options.outputPath === 'function'
      ? options.outputPath(url, this.resourcePath, context)
      : typeof options.outputPath === 'string'
      ? path.posix.join(options.outputPath, url)
      : url

  if (typeof options.emitFile === 'undefined' || options.emitFile) {
    this.emitFile(
      outputPath,
      content,
      null,
      // @ts-ignore https://github.com/webpack-contrib/file-loader/pull/383
      { immutable: isImmutable(name) },
    )
  }

  const polyfill = typeof options.polyfill === 'undefined' || options.polyfill
  const esModule = typeof options.esModule === 'undefined' || options.esModule
  const browser = polyfill ? 'browser' : 'chrome'
  const assetUrl = `${browser}.runtime.getURL(${JSON.stringify(outputPath)})`

  const lines = {
    polyfill: esModule
      ? 'import browser from "webextension-polyfill";'
      : 'const browser = require("webextension-polyfill");',
    export: esModule
      ? `export default ${assetUrl};`
      : `module.exports = ${assetUrl};`,
  }

  return polyfill ? [lines.polyfill, lines.export].join('\n') : lines.export
}

WebExtFileLoader.raw = true
module.exports = WebExtFileLoader
module.exports.default = WebExtFileLoader
