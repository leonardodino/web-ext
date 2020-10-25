export type Options = Readonly<{
  /**
   * The filename template for the target file(s)
   * @see {@link https://github.com/webpack-contrib/file-loader#name|options.name}
   */
  name?: string | ((resourcePath: string, resourceQuery?: string) => string)

  /**
   * A filesystem path where the target file(s) will be placed
   * @see {@link https://github.com/webpack-contrib/file-loader#outputpath|options.outputpath}
   */
  outputPath?:
    | string
    | ((url: string, resourcePath: string, context: string) => string)

  /**
   * A custom file context
   * @see {@link https://github.com/webpack-contrib/file-loader#context|options.context}
   */
  context?: string

  /**
   * Enables/Disables emit files
   * @see {@link https://github.com/webpack-contrib/file-loader#emitfile|options.emitfile}
   */
  emitFile?: boolean

  /**
   * A Regular Expression to one or many parts of the target file path. The capture groups can be reused in the name property using [N] placeholder
   * @see {@link https://github.com/webpack-contrib/file-loader#regexp|options.regexp}
   */
  regExp?: string | RegExp

  /**
   * By default, file-loader generates JS modules that use the ES modules syntax.
   */
  esModule?: boolean

  /**
   * By default, @web-ext/file-loader loads mozilla/webextension-polyfill.
   */
  polyfill?: boolean
}>
