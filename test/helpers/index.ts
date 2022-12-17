import fs from 'node:fs';
import path from 'node:path';
import { isNativeError } from 'node:util/types';
import { toss } from 'toss-expression';

import { pluginTester } from '../../src/plugin-tester';

import type { ErrorExpectation, PluginTesterOptions } from '../../src/index';

const dummyDoneCallback: jest.DoneCallback = () => {
  throw new Error('unexpected callback invocation');
};
dummyDoneCallback.fail = dummyDoneCallback;

let pendingJestTests: Promise<unknown>[];

/**
 * Dummy `tests` element and/or `code` option value.
 */
export const simpleTest = "var hi = 'hey';";

/**
 * Since babel-plugin-tester uses Jest globals (like `it` and `describe`) under
 * the hood, and we're using Jest to test babel-plugin-tester, we mock those
 * globals before `pluginTester` is invoked.
 *
 * This function is used by those mocks to keep track of the tests that
 * babel-plugin-tester passes to functions like `it`.
 */
export function addPendingJestTest(testFn: jest.ProvidesCallback | undefined) {
  pendingJestTests.push(Promise.resolve(testFn?.(dummyDoneCallback)));
}

/**
 * Returns a ready-made dummy babel-plugin-tester options object.
 */
export function getDummyOptions(overrides?: PluginTesterOptions): PluginTesterOptions {
  return {
    pluginName: 'captains-log',
    plugin: () => ({ name: 'captains-log', visitor: {} }),
    tests: [simpleTest],
    ...overrides
  };
}

/**
 * Since babel-plugin-tester uses Jest globals (like `it` and `describe`) under
 * the hood, and we're using Jest to test babel-plugin-tester, we mock those
 * globals before `pluginTester` is invoked.
 *
 * This function wraps `pluginTester`, ensuring the tests that it passes to
 * functions like `it` are eventually run and their results awaited. In the
 * event of an exception, any pending tests are cancelled and the pending queue
 * is cleared.
 */
export async function runPluginTester(options?: PluginTesterOptions) {
  pendingJestTests = [];

  try {
    pluginTester(options);
    return await Promise.all(pendingJestTests);
  } finally {
    pendingJestTests = [];
  }
}

/**
 * This function wraps `runPluginTester`, but expects `runPluginTester` to throw
 * an error matching a Jest snapshot.
 */
export async function runPluginTesterExpectException(options?: PluginTesterOptions) {
  let errorThrown: Error | undefined;

  try {
    await runPluginTester(options);
  } catch (error) {
    errorThrown = isNativeError(error)
      ? error
      : toss(new Error('unexpected non-Error instance'));
  }

  expect(errorThrown?.message).toMatchSnapshot();
}

/**
 * This is a sugar function wrapping `runPluginTester` that accepts an
 * `error`/`throws` option. The dummy babel plugin provided with this function
 * will always throw the same `SyntaxError`.
 */
export function runPluginTesterCaptureError(
  error: ErrorExpectation,
  overrides?: PluginTesterOptions
) {
  return runPluginTester(
    getDummyOptions({
      plugin: () => {
        throw new SyntaxError('fake syntax error');
      },
      tests: [
        {
          code: simpleTest,
          error
        }
      ],
      ...overrides
    })
  );
}

/**
 * This function wraps `runPluginTesterCaptureError`, combining its
 * functionality and that of `runPluginTesterExpectException` together in a
 * single function.
 */
export async function runPluginTesterCaptureErrorExpectException(
  error: ErrorExpectation,
  overrides?: PluginTesterOptions
) {
  let errorThrown: Error | undefined;

  try {
    await runPluginTesterCaptureError(error, overrides);
  } catch (error) {
    errorThrown = isNativeError(error)
      ? error
      : toss(new Error('unexpected non-Error instance'));
  }

  expect(errorThrown?.message).toMatchSnapshot();
}

/**
 * Returns the absolute path of the specified `fixture` path. The `fixture` path
 * must be a relative path of a subdirectory of `test/fixtures`.
 *
 * @example getFixturePath('fixtures');
 */
export function getFixturePath(fixture = '') {
  return path.join(__dirname, '..', 'fixtures', fixture);
}

/**
 * Returns the contents of the `fixture` file path. The `fixture` path must be a
 * relative path of a file within a subdirectory of `test/fixtures`.
 *
 * @example getFixtureContents('creates-output-file/code.js');
 */
export function getFixtureContents(fixture: string) {
  const fullPath = getFixturePath(fixture);
  return fs.readFileSync(fullPath, 'utf8').trim();
}
