import fs from 'node:fs';
import path from 'node:path';
import { type AssertionError } from 'node:assert';
import { isNativeError } from 'node:util/types';

import { pluginTester } from '../../src/plugin-tester';

import type {
  ErrorExpectation,
  FixtureOptions,
  PluginTesterOptions
} from '../../src/index';

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
 * Dummy `fixtures` path.
 *
 * Equivalent to calling `getFixturePath('simple')`.
 */
export const simpleFixture = getFixturePath('simple');

/**
 * Dummy canary `code`/`output`/`exec` value that should never show up in test
 * output or snapshots unless the test is failing.
 */
export const shouldNotBeSeen = 'if you see this text, the test is failing';

/**
 * Dummy `filepath` value pointing to a non-existent `fake-file.js` file at the
 * project root.
 */
export const dummyProjectRootFilepath = path.join(__dirname, './../../fake-file.js');

/**
 * Dummy `pluginName` value used by `getDummyPluginOptions`.
 */
export const dummyExplicitPluginName = 'captains-log (explicit)';

/**
 * Dummy inferrable plugin name used by `getDummyPluginOptions`.
 */
export const dummyInferredPluginName = 'captains-log (inferred)';

/**
 * Dummy `presetName` value used by `getDummyPresetOptions`.
 */
export const dummyPresetName = 'black-box (preset)';

/**
 * Dummy name of the plugin provided within the preset returned by
 * `getDummyPresetOptions`.
 */
export const dummyPresetPluginName = 'black-box (preset-plugin)';

/**
 * Since babel-plugin-tester uses Jest globals (like `it` and `describe`) under
 * the hood, and we're using Jest to test babel-plugin-tester, we mock those
 * globals before `pluginTester` is invoked.
 *
 * This function is used by those mocks to keep track of the tests that
 * babel-plugin-tester passes to functions like `it`.
 */
export function addPendingJestTest(
  testName: string,
  testFn: jest.ProvidesCallback | undefined
) {
  pendingJestTests.push(
    Promise.resolve(testFn?.(dummyDoneCallback)).catch(async (error: unknown) => {
      if (isNativeError(error)) {
        // ? Since we don't have the real Jest `it` function to do it for us,
        // ? let's make debugging a little easier by pinpointing which test failed
        error.message = `${testName}: ${error.message}`;

        if (isAssertionError(error)) {
          error.message += `\n\nactual:\n${error.actual}\n\nexpected:\n${error.expected}`;
        }
      }

      throw error;

      function isAssertionError(error: Error): error is AssertionError {
        return error.name == 'AssertionError';
      }
    })
  );
}

/**
 * Returns a ready-made dummy babel-plugin-tester options object for a plugin.
 */
export function getDummyPluginOptions(
  overrides?: PluginTesterOptions
): PluginTesterOptions {
  const {
    preset: _,
    presetName: __,
    presetOptions: ___,
    ...finalOverrides
  } = overrides || {};

  return {
    pluginName: dummyExplicitPluginName,
    plugin: () => ({ name: dummyInferredPluginName, visitor: {} }),
    ...finalOverrides
  };
}

/**
 * Returns a ready-made dummy babel-plugin-tester options object for a preset.
 */
export function getDummyPresetOptions(
  overrides?: PluginTesterOptions
): PluginTesterOptions {
  const {
    plugin: _,
    pluginName: __,
    pluginOptions: ___,
    ...finalOverrides
  } = overrides || {};

  return {
    presetName: dummyPresetName,
    preset: () => ({ plugins: [{ name: dummyPresetPluginName, visitor: {} }] }),
    ...finalOverrides
  };
}

/**
 * Since babel-plugin-tester uses Jest globals (like `it` and `describe`) under
 * the hood, and we're also using Jest to test babel-plugin-tester, we mock
 * those globals before `pluginTester` is invoked.
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
export async function runPluginTesterExpectThrownException(
  options?: PluginTesterOptions
) {
  await expect(runPluginTester(options)).rejects.toThrowErrorMatchingSnapshot();
}

/**
 * This is a sugar function wrapping `runPluginTester` that accepts an
 * `error`/`throws` option. The dummy babel plugin provided with this function
 * will always throw the same `SyntaxError`.
 *
 * Tests both `tests` (`simpleTest`) and `fixtures` (standard).
 */
export async function runPluginTesterExpectCapturedError(
  throws: ErrorExpectation,
  overrides?: PluginTesterOptions
) {
  const faultyPluginOrPreset = () => {
    throw new SyntaxError('expected this error to be captured');
  };

  return Promise.all([
    expect(
      runPluginTester(
        getDummyPluginOptions({
          plugin: faultyPluginOrPreset,
          tests: [{ code: simpleTest, throws }],
          fixtures: getFixturePath('simple'),
          ...overrides
        })
      )
    ).resolves.toBeArrayOfSize(2),
    expect(
      runPluginTester(
        getDummyPresetOptions({
          preset: faultyPluginOrPreset,
          tests: [{ code: simpleTest, throws }],
          fixtures: getFixturePath('simple'),
          ...overrides
        })
      )
    ).resolves.toBeArrayOfSize(2)
  ]);
}

/**
 * This function combines the functionality of
 * `runPluginTesterExpectCapturedError` and that of
 * `runPluginTesterExpectThrownException` together in a single function.
 */
export async function runPluginTesterExpectThrownExceptionWhenCapturingError(
  throws: ErrorExpectation,
  overrides?: PluginTesterOptions
) {
  const faultyPluginOrPreset = () => {
    throw new SyntaxError('expected this error to be captured');
  };

  return Promise.all([
    expect(
      runPluginTester(
        getDummyPluginOptions({
          plugin: faultyPluginOrPreset,
          tests: [{ code: simpleTest, throws }],
          ...overrides
        })
      )
    ).rejects.toThrowErrorMatchingSnapshot(),
    expect(
      runPluginTester(
        getDummyPresetOptions({
          preset: faultyPluginOrPreset,
          tests: [{ code: simpleTest, throws }],
          ...overrides
        })
      )
    ).rejects.toThrowErrorMatchingSnapshot()
  ]);
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
export function getFixtureContents(fixture: string, { trim = true } = {}) {
  const fullPath = getFixturePath(fixture);
  return fs.readFileSync(fullPath, 'utf8')[trim ? 'trim' : 'toString']();
}

/**
 * Returns the options object of the specified `fixture` path via `require()`.
 * The `fixture` path must be a relative path of a file within a subdirectory of
 * `test/fixtures`.
 *
 * If a valid `options.js` file and a valid `options.json` file are both
 * present, the `options.js` file will be `require`'d and the `options.json`
 * file will be completely ignored.
 *
 * @example requireFixtureContents('custom-title');
 */
export function requireFixtureOptions(fixture: string): FixtureOptions {
  const fullPath = getFixturePath(fixture);

  try {
    return tryRequire(path.join(fullPath, 'fixture'));
  } catch {
    return tryRequire(fullPath);
  }

  function tryRequire(path: string) {
    try {
      return require(`${path}/options.js`);
    } catch (jsError) {
      try {
        return require(`${path}/options.json`);
      } catch (jsonError) {
        throw new Error(
          'failed to require fixture options: failed to require either options.js or options.json',
          { cause: new Error(`${jsError}\n\n${jsonError}`) }
        );
      }
    }
  }
}
