/* eslint jest/require-hook: ["error", { "allowedFunctionCalls": ["pluginTester"] }] */

import {
  pluginTester,
  prettierFormatter,
  runPluginUnderTestHere,
  runPresetUnderTestHere,
  unstringSnapshotSerializer
} from 'universe';

const uglyTest = `var output = paragraph + "one"+\n\n'paragraph' + \`\\two\``;
const expectedPrettierFormatterResult =
  "var output = paragraph + 'one' + 'paragraph' + `\\two`;\n";

test('prettierFormatter(uglyTest) === expectedPrettierFormatterResult', async () => {
  expect.hasAssertions();
  await expect(prettierFormatter(uglyTest)).resolves.toBe(
    expectedPrettierFormatterResult
  );
});

test('prettierFormatter is exported', async () => {
  expect.hasAssertions();
  expect(typeof prettierFormatter).toBe('function');
});

test('unstringSnapshotSerializer is exported', async () => {
  expect.hasAssertions();
  expect(unstringSnapshotSerializer).toHaveProperty('test');
  expect(unstringSnapshotSerializer).toHaveProperty('print');
});

test('runPluginUnderTestHere is exported', async () => {
  expect.hasAssertions();
  expect(typeof runPluginUnderTestHere).toBe('symbol');
});

test('runPresetUnderTestHere is exported', async () => {
  expect.hasAssertions();
  expect(typeof runPresetUnderTestHere).toBe('symbol');
});

pluginTester({
  pluginName: 'captains-log',
  plugin: () => ({ name: 'captains-log', visitor: {} }),
  tests: [
    // ? Test that prettierFormatter is the default `formatResult` function
    { code: uglyTest, output: expectedPrettierFormatterResult },
    // ? Test that unstringSnapshotSerializer is the active snapshot serializer
    // ! Requires manual inspection of snapshot
    { code: uglyTest, snapshot: true }
  ]
});
