import debugFactory from 'debug';

import { prettierFormatter } from 'universe:formatters/prettier.ts';

import {
  pluginTester,
  runPluginUnderTestHere,
  runPresetUnderTestHere
} from 'universe:plugin-tester.ts';

import { unstringSnapshotSerializer } from 'universe:serializers/unstring-snapshot.ts';

import type { PluginTesterOptions } from 'typeverse:global.ts';

// {@symbiote/notExtraneous jest}

export type * from 'typeverse:global.ts';

export {
  defaultPluginTester as pluginTester,
  prettierFormatter,
  runPluginUnderTestHere,
  runPresetUnderTestHere,
  unstringSnapshotSerializer
};

const debug = debugFactory('babel-plugin-tester:index');

if ('expect' in globalThis && typeof expect.addSnapshotSerializer === 'function') {
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
  pluginTester({ formatResult: prettierFormatter, ...options });
}
