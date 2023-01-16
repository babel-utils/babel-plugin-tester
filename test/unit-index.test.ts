/* eslint jest/require-hook: ["error", { "allowedFunctionCalls": ["pluginTesterAsDefault","pluginTester"] }] */

import pluginTesterAsDefault, {
  prettierFormatter,
  unstringSnapshotSerializer,
  pluginTester,
  runPluginUnderTestHere,
  runPresetUnderTestHere
} from '../src/index';

test('prettierFormatter is exported', () => {
  expect.hasAssertions();
  expect(typeof prettierFormatter).toBe('function');
});

test('unstringSnapshotSerializer is exported', () => {
  expect.hasAssertions();
  expect(unstringSnapshotSerializer).toHaveProperty('test');
  expect(unstringSnapshotSerializer).toHaveProperty('print');
});

test('the default export and the named export point to the same function', () => {
  expect.hasAssertions();
  expect(pluginTester).toBe(pluginTesterAsDefault);
});

test('runPluginUnderTestHere is exported', () => {
  expect.hasAssertions();
  expect(typeof runPluginUnderTestHere).toBe('symbol');
});

test('runPresetUnderTestHere is exported', () => {
  expect.hasAssertions();
  expect(typeof runPresetUnderTestHere).toBe('symbol');
});

const uglyTest = `var output = paragraph + "one"+\n\n'paragraph' + \`\\two\``;

pluginTesterAsDefault({
  pluginName: 'captains-log',
  plugin: () => ({ name: 'captains-log', visitor: {} }),
  tests: [
    // ? Test that prettierFormatter is the default `formatResult` function
    { code: uglyTest, output: prettierFormatter(uglyTest) },
    // ? Test that unstringSnapshotSerializer is the active snapshot serializer
    // ! Requires manual inspection of snapshot
    { code: uglyTest, snapshot: true }
  ]
});
