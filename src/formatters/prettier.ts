import path from 'node:path';

import debugFactory from 'debug';

import {
  format as formatWithPrettier,
  resolveConfig as resolvePrettierConfig,
  type Options as PrettierOptions
} from 'prettier';

import type { ResultFormatter } from 'universe';

export type { PrettierOptions };

/**
 * A prettier-based formatter used to normalize babel output.
 *
 * If no `filepath` is given, it will be set to `${cwd}/dummy.js` by
 * default. This is useful to leverage prettier's extension-based parser
 * inference (which usually ends up triggering babel).
 *
 * @see https://prettier.io/docs/en/options.html#file-path
 */
export const prettierFormatter: ResultFormatter<{
  /**
   * Options passed directly to prettier, allowing you to override the defaults.
   */
  prettierOptions: MaybePrettierOptions;
  /**
   * If this deprecated parameter is given as an argument, treat it as the value
   * of `prettierOptions`. Otherwise, it should not be used.
   *
   * @deprecated Use `prettierOptions` instead.
   */
  config: MaybePrettierOptions;
}> = async (
  code,
  {
    // eslint-disable-next-line no-restricted-syntax
    cwd = process.cwd(),
    filename,
    filepath = filename || path.join(cwd, 'dummy.js'),
    config,
    prettierOptions = config || getCachedConfig(filepath)
  } = {}
) => {
  const finalPrettierOptions = {
    filepath,
    ...(await prettierOptions)
  };

  debug('cwd: %O', cwd);
  debug('filepath: %O', filepath);
  debug('prettier options: %O', finalPrettierOptions);
  debug('original code: %O', code);

  const formattedCode = await formatWithPrettier(code, finalPrettierOptions);
  debug('formatted code: %O', code);

  return formattedCode;
};

export default prettierFormatter;

const debug = debugFactory('babel-plugin-tester:formatter');

type MaybePrettierOptions = PrettierOptions | null;
const configDirectoryCache: Record<string, MaybePrettierOptions> = Object.create(null);

const getCachedConfig = async (filepath: string) => {
  if (!(filepath in configDirectoryCache)) {
    configDirectoryCache[filepath] = await resolvePrettierConfig(filepath);
    debug(
      `caching prettier configuration resolved from ${filepath}: %O`,
      configDirectoryCache[filepath]
    );
  } else {
    debug(`using cached prettier configuration resolved from ${filepath}`);
  }

  return configDirectoryCache[filepath];
};
