import { isNativeError } from 'node:util/types';

import { $type } from './symbols';

import type {
  MaybePluginTesterTestFixtureConfig,
  MaybePluginTesterTestObjectConfig,
  PluginTesterTestFixtureConfig,
  PluginTesterTestObjectConfig,
  Range
} from './index';

type TestConfig = PluginTesterTestFixtureConfig | PluginTesterTestObjectConfig;
type MaybeTestConfig =
  | MaybePluginTesterTestFixtureConfig
  | MaybePluginTesterTestObjectConfig;

/**
 * A collection of possible errors and warnings.
 */
export const ErrorMessage = {
  TestEnvironmentUndefinedDescribe: () =>
    'incompatible testing environment: testing environment must define `describe` in its global scope',
  TestEnvironmentUndefinedIt: () =>
    'incompatible testing environment: testing environment must define `it` in its global scope',
  TestEnvironmentNoSnapshotSupport: () =>
    'testing environment does not support `expect(...).toMatchSnapshot` method',
  TestEnvironmentNoSkipSupport: () =>
    'testing environment does not support `it.skip(...)` method',
  TestEnvironmentNoOnlySupport: () =>
    'testing environment does not support `it.only(...)` method',
  BadConfigPluginAndPreset: () =>
    'failed to validate configuration: cannot test a plugin and a preset simultaneously. Specify one set of options or the other',
  BadConfigNoPluginOrPreset: () =>
    'failed to validate configuration: must provide either `plugin` or `preset` option',
  BadConfigInvalidTitleNumbering: () =>
    'failed to validate configuration: invalid `titleNumbering` option',
  BadConfigFixturesNotString: () =>
    'failed to validate configuration: `fixtures`, if defined, must be a string',
  BadConfigInvalidTestsType: () =>
    'failed to validate configuration: `tests`, if defined, must be an array or an object',
  BadConfigInvalidTestsArrayItemType: (index: number) =>
    `failed to validate configuration: \`tests\` array item at index ${index} must be a string, TestObject, or nullish`,
  BadConfigInvalidTestsObjectProperty: (title: string) =>
    `failed to validate configuration: \`tests\` object property "${title}" must have a value of type string, TestObject, or nullish`,
  BadConfigInvalidEndOfLine: (endOfLine: unknown) =>
    `failed to validate configuration: invalid \`endOfLine\` option "${endOfLine}"`,
  BadEnvironmentVariableRange: (name: string, rangeStr: string, range?: Range) =>
    `invalid environment variable "${name}": invalid range ${rangeStr}` +
    (range ? `: ${range.start} is greater than ${range.end}` : ''),
  SetupFunctionFailed: (error: unknown) =>
    `setup function failed: ${isNativeError(error) ? error.message : error}`,
  TeardownFunctionFailed: (functionError: unknown, frameworkError?: unknown) => {
    const frameworkErrorMessage = frameworkError
      ? `\n\nAdditionally, the testing framework reported the following error: ${
          isNativeError(frameworkError) ? frameworkError.message : frameworkError
        }`
      : '';
    return `teardown function failed: ${
      isNativeError(functionError) ? functionError.message : functionError
    }${frameworkErrorMessage}`;
  },
  ExpectedBabelToThrow: () => 'expected babel to throw an error, but it did not',
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExpectedErrorToBeInstanceOf: (expectedError: Function) =>
    `expected error to be an instance of ${expectedError.name || 'the expected error'}`,
  ExpectedThrowsFunctionToReturnTrue: () =>
    'expected `throws`/`error` function to return true',
  ExpectedErrorToIncludeString: (resultString: string, expectedError: string) =>
    `expected "${resultString}" to include "${expectedError}"`,
  ExpectedErrorToMatchRegExp: (resultString: string, expectedError: RegExp) =>
    `expected "${resultString}" to match ${expectedError}`,
  BabelOutputTypeIsNotString: (rawBabelOutput: unknown) =>
    `unexpected babel output type "${typeof rawBabelOutput}" (expected string)`,
  BabelOutputUnexpectedlyEmpty: () =>
    'attempted to execute babel output but it was empty. An empty string cannot be evaluated',
  AttemptedToSnapshotUnmodifiedBabelOutput: () =>
    'code was unmodified but attempted to take a snapshot. If the code should not be modified, set `snapshot: false`',
  ExpectedOutputToEqualActual: (testConfig: TestConfig) => {
    return `actual output does not match ${
      testConfig[$type] == 'fixture-object'
        ? testConfig.fixtureOutputBasename
        : 'expected output'
    }`;
  },
  ExpectedOutputNotToChange: () => 'expected output not to change, but it did',
  ValidationFailed: (title: string, message: string) =>
    `failed to validate configuration for test "${title}": ${message}`,
  InvalidHasCodeAndCodeFixture: () => '`code` cannot be provided with `codeFixture`',
  InvalidHasOutputAndOutputFixture: () =>
    '`output` cannot be provided with `outputFixture`',
  InvalidHasExecAndExecFixture: () => '`exec` cannot be provided with `execFixture`',
  InvalidHasSnapshotAndOutput: () =>
    'neither `output` nor `outputFixture` can be provided with `snapshot` enabled',
  InvalidHasSnapshotAndExec: () =>
    'neither `exec` nor `execFixture` can be provided with `snapshot` enabled',
  InvalidHasSnapshotAndThrows: () =>
    'neither `throws` nor `error` can be provided with `snapshot` enabled',
  InvalidHasSkipAndOnly: () => 'cannot enable both `skip` and `only` in the same test',
  InvalidHasThrowsAndOutput: (testConfig: MaybeTestConfig) => {
    return testConfig[$type] == 'test-object'
      ? 'neither `output` nor `outputFixture` can be provided with `throws` or `error`'
      : 'a fixture cannot be provided with `throws` or `error` and also contain an output file';
  },
  InvalidHasThrowsAndExec: (testConfig: MaybeTestConfig) => {
    return testConfig[$type] == 'test-object'
      ? 'neither `exec` nor `execFixture` can be provided with `throws` or `error`'
      : 'a fixture cannot be provided with `throws` or `error` and also contain an exec file';
  },
  InvalidHasCodeAndExec: (testConfig: MaybeTestConfig) => {
    return testConfig[$type] == 'test-object'
      ? 'a string or object with a `code`, `codeFixture`, `exec`, or `execFixture` must be provided'
      : 'a fixture must contain either a code file or an exec file';
  },
  InvalidHasExecAndCodeOrOutput: (testConfig: MaybeTestConfig) => {
    return testConfig[$type] == 'test-object'
      ? 'neither `code`, `codeFixture`, `output`, nor `outputFixture` can be provided with `exec` or `execFixture`'
      : 'a fixture cannot contain both an exec file and a code or output file';
  },
  InvalidHasBabelrcButNoFilename: () =>
    '`babelOptions.babelrc` is enabled but `babelOptions.filename` was not provided',
  InvalidThrowsType: () =>
    '`throws`/`error` must be a function, string, boolean, RegExp, or Error subtype',
  GenericErrorWithPath: (error: unknown, path: string | undefined) => {
    const message = `${isNativeError(error) ? error.message : error}`;
    // ? Some realms/runtimes don't include the failing path, so we make sure
    return !path || message.includes(path) ? message : `${path}: ${message}`;
  },
  PathIsNotAbsolute: (path: string) => `"${path}" is not an absolute path`
};
