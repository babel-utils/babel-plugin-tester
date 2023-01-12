import path from 'node:path';
import debugFactory from 'debug';

import {
  resolveConfig as resolvePrettierConfig,
  format as formatWithPrettier,
  type Options as PrettierOptions
} from 'prettier';

import type { ResultFormatter } from '..';

const debug = debugFactory('babel-plugin-tester:formatter');

type MaybePrettierOptions = PrettierOptions | null;
const configDirectoryCache: Record<string, MaybePrettierOptions> = Object.create(null);

const getCachedConfig = (directory: string) => {
  if (!(directory in configDirectoryCache)) {
    debug(
      `caching prettier configuration resolved from ${directory}: %O`,
      configDirectoryCache[directory]
    );
    configDirectoryCache[directory] = resolvePrettierConfig.sync(directory);
  } else {
    debug(`using cached prettier configuration resolved from ${directory}`);
  }

  return configDirectoryCache[directory];
};

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
  prettierOptions: MaybePrettierOptions;
}> = (
  code,
  {
    cwd = process.cwd(),
    filename,
    filepath = filename || path.join(cwd, 'dummy.js'),
    prettierOptions = getCachedConfig(cwd)
  } = {}
) => {
  debug('cwd: %O', cwd);
  debug('filepath: %O', filepath);
  debug('original  code: %O', code);

  const formattedCode = formatWithPrettier(code, {
    filepath,
    ...prettierOptions
  });

  debug('formatted code: %O', code);
  return formattedCode;
};

export default prettierFormatter;
