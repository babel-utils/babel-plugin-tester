import stripAnsi from 'strip-ansi';
import { ErrorMessage } from '../../src/errors';

import type { FixtureContext } from '../setup';

const combineStdOutAndStdErr = (testResult: FixtureContext['testResult']) => {
  return stripAnsi(testResult?.stdout || '') + stripAnsi(testResult?.stderr || '');
};

export function expectSuccess(context: FixtureContext) {
  const output = combineStdOutAndStdErr(context.testResult);

  expect(output).toMatch(/\bpass|\bok\b|\b0 failures\b/i);

  // ? Jasmine wants to be special
  if (output.includes('Incomplete: fit() or fdescribe() was found')) {
    expect(context.testResult?.code).toBe(2);
  } else {
    expect(context.testResult?.code).toBe(0);
  }
}

export function expectSuccessAndOutput(context: FixtureContext) {
  expect(combineStdOutAndStdErr(context.testResult)).toMatch(
    /\bpass|\bok\b|\b0 failures\b/i
  );
  expect(context.testResult?.stdout).toInclude('working');
  expect(context.testResult?.code).toBe(0);
}

export function expectErrorNoDescribe(context: FixtureContext) {
  expect(context.testResult?.stderr).toInclude(
    ErrorMessage.TestEnvironmentUndefinedDescribe()
  );
  expect(context.testResult?.code).not.toBe(0);
}

export function expectErrorNoOnly(context: FixtureContext) {
  expect(context.testResult?.stderr).toInclude(
    ErrorMessage.TestEnvironmentNoOnlySupport()
  );
  expect(context.testResult?.code).not.toBe(0);
}

export function expectErrorNoSkip(context: FixtureContext) {
  expect(context.testResult?.stderr).toInclude(
    ErrorMessage.TestEnvironmentNoSkipSupport()
  );
  expect(context.testResult?.code).not.toBe(0);
}

export function expectErrorNoSnapshot(context: FixtureContext) {
  expect(context.testResult?.stderr).toInclude(
    ErrorMessage.TestEnvironmentNoSnapshotSupport()
  );
  expect(context.testResult?.code).not.toBe(0);
}
