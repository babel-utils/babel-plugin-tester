import debugFactory from 'debug';

import { prettierFormatter } from './formatters/prettier';
import { unstringSnapshotSerializer } from './serializers/unstring-snapshot';

import {
  pluginTester,
  runPluginUnderTestHere,
  runPresetUnderTestHere
} from './plugin-tester';

import type { PluginTesterOptions } from './types';

const debug = debugFactory('babel-plugin-tester:index');

if ('expect' in globalThis && typeof expect?.addSnapshotSerializer == 'function') {
  debug(
    'added unstring snapshot serializer globally; all snapshots after this point will be affected'
  );
  expect.addSnapshotSerializer(unstringSnapshotSerializer);
} else {
  /* istanbul ignore next */
  debug(
    'unable to add unstring snapshot serializer: global expect object is missing or unsupported'
  );
}

/**
 * An abstraction around babel to help you write tests for your babel plugin or
 * preset.
 */
function defaultPluginTester(options?: PluginTesterOptions) {
  return pluginTester({ formatResult: prettierFormatter, ...options });
}

export {
  defaultPluginTester as pluginTester,
  prettierFormatter,
  runPluginUnderTestHere,
  runPresetUnderTestHere,
  unstringSnapshotSerializer
};

export * from './types';
