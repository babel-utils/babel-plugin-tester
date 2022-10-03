import fs from 'node:fs';
import path from 'node:path';
import { isNativeError } from 'node:util/types';
import { toss } from 'toss-expression';

import { pluginTester } from '../../src/plugin-tester';

import type { PluginTesterOptions } from '../../src/index';

const dummyDoneCallback: jest.DoneCallback = () => {
  throw new Error('unexpected callback invocation');
};
dummyDoneCallback.fail = dummyDoneCallback;

let pendingJestTests: Promise<unknown>[];

export const simpleTest = "var hi = 'hey';";

export function addPendingJestTest(testFn: jest.ProvidesCallback | undefined) {
  pendingJestTests.push(Promise.resolve(testFn?.(dummyDoneCallback)));
}

export function getDummyOptions(overrides?: PluginTesterOptions): PluginTesterOptions {
  return {
    pluginName: 'captains-log',
    plugin: () => ({ name: 'captains-log', visitor: {} }),
    tests: [simpleTest],
    ...overrides
  };
}

export async function runPluginTester(options?: PluginTesterOptions) {
  pendingJestTests = [];

  try {
    pluginTester(options);
    return await Promise.all(pendingJestTests);
  } finally {
    pendingJestTests = [];
  }
}

export async function runPluginTesterExpectException(options?: PluginTesterOptions) {
  let error: Error | undefined;

  try {
    await runPluginTester(options);
  } catch (e) {
    error = isNativeError(e) ? e : toss(new Error('unexpected non-Error instance'));
  }

  expect(error?.message).toMatchSnapshot();
}

export function runPluginTesterCaptureError(
  error: PluginTesterOptions['error'],
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

export async function runPluginTesterCaptureErrorExpectException(
  error: PluginTesterOptions['error'],
  overrides?: PluginTesterOptions
) {
  let errorThrown: Error | undefined;

  try {
    await runPluginTesterCaptureError(error, overrides);
  } catch (e) {
    errorThrown = isNativeError(e) ? e : toss(new Error('unexpected non-Error instance'));
  }

  expect(errorThrown?.message).toMatchSnapshot();
}

export function getFixturePath(fixture = '') {
  return path.join(__dirname, '..', 'fixtures', fixture);
}

export function getFixtureContents(fixture: string) {
  const fullPath = getFixturePath(fixture);
  return fs.readFileSync(fullPath, 'utf8').trim();
}
