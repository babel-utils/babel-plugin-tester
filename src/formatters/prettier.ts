import path from 'node:path';

import {
  resolveConfig as resolvePrettierConfig,
  format as formatWithPrettier,
  type Options as PrettierOptions
} from 'prettier';

import type { ResultFormatter } from '..';

type MaybePrettierOptions = PrettierOptions | null;
const configDirCache: Record<string, MaybePrettierOptions> = Object.create(null);

const getCachedConfig = (dir: string) => {
  if (!(dir in configDirCache)) {
    configDirCache[dir] = resolvePrettierConfig.sync(dir);
  }

  return configDirCache[dir];
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
  return formatWithPrettier(code, {
    filepath,
    ...prettierOptions
  });
};

export default prettierFormatter;
