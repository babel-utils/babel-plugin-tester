import stripAnsi from 'strip-ansi~6';

import { ErrorMessage } from 'universe:errors.ts';

import type { UnwrapTagged } from 'type-fest';
import type { RunTestFixtureContext } from 'testverse:util.ts';

const combineStdOutAndStdErr = (testResult: RunTestFixtureContext['testResult']) => {
  return (
    stripAnsi((testResult.stdout as string) || '') +
    stripAnsi((testResult.stderr as string) || '')
  );
};

export function expectSuccess(context: UnwrapTagged<RunTestFixtureContext>) {
  const output = combineStdOutAndStdErr(context.testResult);

  expect(output).toMatch(/\bpass|((?<!not )\bok\b)|\b0 failures\b/i);

  // ? Jasmine wants to be special
  if (output.includes('Incomplete: fit() or fdescribe() was found')) {
    expect(context.testResult.exitCode).toBe(2);
  } else {
    expect(context.testResult.exitCode).toBe(0);
  }
}

export function expectSuccessAndOutput(context: UnwrapTagged<RunTestFixtureContext>) {
  expect(combineStdOutAndStdErr(context.testResult)).toMatch(
    /\bpass|((?<!not )\bok\b)|\b0 failures\b/i
  );
  expect(context.testResult.stdout).toInclude('working');
  expect(context.testResult.exitCode).toBe(0);
}

export function expectErrorNoDescribe(context: UnwrapTagged<RunTestFixtureContext>) {
  expect(context.testResult.stderr).toInclude(
    ErrorMessage.TestEnvironmentUndefinedDescribe()
  );
  expect(context.testResult.exitCode).not.toBe(0);
}

export function expectErrorNoOnly(context: UnwrapTagged<RunTestFixtureContext>) {
  expect(context.testResult.stderr).toInclude(
    ErrorMessage.TestEnvironmentNoOnlySupport()
  );
  expect(context.testResult.exitCode).not.toBe(0);
}

export function expectErrorNoSkip(context: UnwrapTagged<RunTestFixtureContext>) {
  expect(context.testResult.stderr).toInclude(
    ErrorMessage.TestEnvironmentNoSkipSupport()
  );
  expect(context.testResult.exitCode).not.toBe(0);
}

export function expectErrorNoSnapshot(context: UnwrapTagged<RunTestFixtureContext>) {
  expect(context.testResult.stderr).toInclude(
    ErrorMessage.TestEnvironmentNoSnapshotSupport()
  );
  expect(context.testResult.exitCode).not.toBe(0);
}
