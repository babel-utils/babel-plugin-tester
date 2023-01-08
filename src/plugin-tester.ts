/* eslint-disable unicorn/consistent-destructuring */
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { EOL } from 'node:os';
import { isNativeError } from 'node:util/types';
import mergeWith from 'lodash.mergewith';
import stripIndent from 'strip-indent';

import { $type } from './symbols';

import {
  runPluginUnderTestHere,
  runPresetUnderTestHere,
  type ResultFormatter,
  type PluginTesterOptions,
  type TestObject,
  type FixtureOptions,
  type PluginTesterBaseConfig,
  type PluginTesterTestConfig,
  type PluginTesterTestDescribeConfig,
  type PluginTesterTestFixtureConfig,
  type PluginTesterTestObjectConfig,
  type MaybePluginTesterTestObjectConfig,
  type MaybePluginTesterTestFixtureConfig,
  type PartialPluginTesterBaseConfig
} from '.';

import type { Class } from 'type-fest';

const parseErrorStackRegExp =
  /at (?<fn>\S+) (?:.*? )?\(?(?<path>(?:\/|file:).*?)(?:\)|$)/i;

const parseScriptFilepathRegExp =
  /\/babel-plugin-tester\/(dist|src)\/(index|plugin-tester)\.(j|t)s$/;

export default pluginTester;

/**
 * An abstraction around babel to help you write tests for your babel plugin or
 * preset. It was built to work with Jest, but most of the functionality should
 * work with Mocha, Jasmine, and any other framework that defines standard
 * `describe` and `it` globals with async support.
 */
export function pluginTester(options: PluginTesterOptions = {}) {
  const globalContextHasExpectFn = 'expect' in globalThis && typeof expect == 'function';
  const globalContextHasTestFn = 'it' in globalThis && typeof it == 'function';

  const globalContextHasDescribeFn =
    'describe' in globalThis && typeof describe == 'function';

  const globalContextExpectFnHasToMatchSnapshot = globalContextHasExpectFn
    ? typeof expect(undefined)?.toMatchSnapshot == 'function'
    : false;

  const globalContextTestFnHasSkip = globalContextHasTestFn
    ? typeof it.skip == 'function'
    : false;

  const globalContextTestFnHasOnly = globalContextHasTestFn
    ? typeof it.only == 'function'
    : false;

  if (!globalContextHasDescribeFn) {
    throw new TypeError('testing environment must define `describe` in its global scope');
  }

  if (!globalContextHasTestFn) {
    throw new TypeError('testing environment must define `it` in its global scope');
  }

  let hasTests = false;
  const baseConfig = resolveBaseConfig();
  const normalizedTests = normalizeTests();

  if (!hasTests) {
    // TODO: debug statement here
    return;
  }

  registerTestsWithTestingFramework(normalizedTests);

  function resolveBaseConfig(): PluginTesterBaseConfig {
    const rawBaseConfig = mergeWith(
      {
        babelOptions: {
          parserOpts: {},
          generatorOpts: {},
          babelrc: false,
          configFile: false
        },
        endOfLine: 'lf',
        formatResult: ((r) => r) as ResultFormatter,
        snapshot: false,
        fixtureOutputName: 'output',
        setup: () => undefined,
        teardown: () => undefined
      },
      options,
      mergeCustomizer
    );

    if (
      (rawBaseConfig.plugin &&
        (rawBaseConfig.preset ||
          rawBaseConfig.presetName ||
          rawBaseConfig.presetOptions)) ||
      (rawBaseConfig.preset &&
        (rawBaseConfig.plugin || rawBaseConfig.pluginName || rawBaseConfig.pluginOptions))
    ) {
      throw new Error(
        'failed to validate configuration: cannot test a plugin and a preset simultaneously. Specify one set of options or the other'
      );
    }

    const baseConfig: PartialPluginTesterBaseConfig = {
      babel: rawBaseConfig.babel || require('@babel/core'),
      baseBabelOptions: rawBaseConfig.babelOptions,
      filepath: rawBaseConfig.filepath ?? rawBaseConfig.filename ?? tryInferFilepath(),
      endOfLine: rawBaseConfig.endOfLine,
      baseSetup: rawBaseConfig.setup,
      baseTeardown: rawBaseConfig.teardown,
      baseFormatResult: rawBaseConfig.formatResult,
      baseSnapshot: rawBaseConfig.snapshot,
      baseFixtureOutputName: rawBaseConfig.fixtureOutputName,
      baseFixtureOutputExt: rawBaseConfig.fixtureOutputExt,
      fixtures: rawBaseConfig.fixtures,
      tests: rawBaseConfig.tests || []
    };

    if (rawBaseConfig.plugin) {
      baseConfig.plugin = rawBaseConfig.plugin;
      baseConfig.pluginName =
        rawBaseConfig.pluginName || tryInferPluginName() || 'unknown plugin';
      baseConfig.basePluginOptions = rawBaseConfig.pluginOptions || {};
    } else if (rawBaseConfig.preset) {
      baseConfig.preset = rawBaseConfig.preset;
      baseConfig.presetName = rawBaseConfig.presetName || 'unknown preset';
      baseConfig.basePresetOptions = rawBaseConfig.presetOptions;
    } else {
      throw new TypeError(
        'failed to validate configuration: must provide either `plugin` or `preset` option'
      );
    }

    baseConfig.describeBlockTitle =
      rawBaseConfig.title ?? baseConfig.pluginName ?? baseConfig.presetName;

    return baseConfig as PluginTesterBaseConfig;

    function tryInferPluginName() {
      try {
        // * https://xunn.at/babel-helper-plugin-utils-src
        return rawBaseConfig.plugin!(
          {
            assertVersion: () => undefined,
            targets: () => undefined,
            assumption: () => undefined
          },
          {},
          process.cwd()
        ).name;
      } catch {
        return undefined;
      }
    }

    function tryInferFilepath() {
      // ? Allow the end user to unset filepath by setting it to undefined
      if ('filepath' in rawBaseConfig || 'filename' in rawBaseConfig) {
        return undefined;
      }

      const oldStackTraceLimit = Error.stackTraceLimit;
      Error.stackTraceLimit = Number.POSITIVE_INFINITY;

      try {
        let inferredFilepath: string | undefined = undefined;
        // ? Turn the V8 call stack into function names and file paths
        const reversedCallStack = (
          new Error('faux error').stack
            ?.split('\n')
            .map((line) => {
              const { fn: functionName, path: filePath } =
                line.match(parseErrorStackRegExp)?.groups || {};

              return functionName && filePath
                ? {
                    functionName,
                    // ? Paranoid just in case the script name/path has colons
                    filePath: filePath.split(':').slice(0, -2).join(':')
                  }
                : undefined;
            })
            .filter(<T>(o: T): o is NonNullable<T> => Boolean(o)) || []
        ).reverse();

        // TODO: debug statement here displaying reversed call stack contents

        if (reversedCallStack?.length) {
          // TODO: debug statements below
          const referenceIndex = findReferenceStackIndex(reversedCallStack);

          if (referenceIndex) {
            inferredFilepath = reversedCallStack.at(referenceIndex - 1)?.filePath;
          }
        }

        // TODO: debug statement here outputting inferredFilepath

        return inferredFilepath;
      } finally {
        Error.stackTraceLimit = oldStackTraceLimit;
      }

      function findReferenceStackIndex(
        reversedCallStack: { functionName: string; filePath: string }[]
      ) {
        // ? Different realms might have slightly different stacks depending on
        // ? which file was imported. Return the first one found.
        return [
          reversedCallStack.findIndex(({ functionName, filePath }) => {
            return (
              functionName == 'defaultPluginTester' &&
              parseScriptFilepathRegExp.test(filePath)
            );
          }),
          reversedCallStack.findIndex(({ functionName, filePath }) => {
            return (
              functionName == 'pluginTester' && parseScriptFilepathRegExp.test(filePath)
            );
          }),
          reversedCallStack.findIndex(({ functionName, filePath }) => {
            return (
              functionName == 'resolveBaseConfig' &&
              parseScriptFilepathRegExp.test(filePath)
            );
          })
        ].find((ndx) => ndx != -1);
      }
    }
  }

  function normalizeTests() {
    const { describeBlockTitle, filepath, tests, fixtures } = baseConfig;
    const testsIsArray = Array.isArray(tests);
    const fixturesAbsolutePath = getAbsolutePath(filepath, fixtures);
    const testConfigs: PluginTesterTestConfig[] = [];
    let currentTestNumber = 1;

    if (fixturesAbsolutePath) {
      if (fs.statSync(fixturesAbsolutePath).isDirectory()) {
        const describeBlock =
          typeof describeBlockTitle == 'string'
            ? createAndPushDescribeConfig(`${describeBlockTitle} fixtures`)
            : undefined;

        createAndPushFixtureConfigs({
          fixturesDirectory: fixturesAbsolutePath,
          parentDescribeConfig: describeBlock
        });
      } else {
        // TODO: debug statement here
      }
    }

    if (tests && (!testsIsArray || tests.length)) {
      const describeBlock =
        typeof describeBlockTitle == 'string'
          ? createAndPushDescribeConfig(describeBlockTitle)
          : undefined;

      if (testsIsArray) {
        (describeBlock?.tests || testConfigs).push(
          ...tests
            .filter((test) => {
              // TODO: debug statement here
              return Boolean(test);
            })
            .map((test) => createTestConfig(test))
        );
      } else {
        (describeBlock?.tests || testConfigs).push(
          ...Object.entries(tests)
            .filter(([/*title, */ test]) => {
              // TODO: debug statement here
              return Boolean(test);
            })
            .map(([title, test]) => {
              return createTestConfig({
                title,
                ...(typeof test == 'string' ? { code: test } : test)
              });
            })
        );
      }
    }

    return testConfigs;

    function createAndPushDescribeConfig(
      describeBlockTitle: PluginTesterTestDescribeConfig['describeBlockTitle'],
      parentDescribeConfig?: PluginTesterTestDescribeConfig
    ) {
      const describeConfig: PluginTesterTestDescribeConfig = {
        [$type]: 'describe-block',
        describeBlockTitle,
        tests: []
      };

      (parentDescribeConfig?.tests || testConfigs).push(describeConfig);
      return describeConfig;
    }

    function createAndPushFixtureConfigs({
      fixturesDirectory,
      fixtureOptions = {},
      parentDescribeConfig
    }: {
      fixturesDirectory: string;
      fixtureOptions?: FixtureOptions;
      parentDescribeConfig?: PluginTesterTestDescribeConfig;
    }) {
      if (!fs.statSync(fixturesDirectory).isDirectory()) {
        // TODO: debug statement here
        return;
      }

      const rootOptions = mergeWith(
        { setup: () => undefined, teardown: () => undefined },
        fixtureOptions,
        readFixtureOptions(fixturesDirectory),
        mergeCustomizer
      );

      fs.readdirSync(fixturesDirectory).forEach((filename) => {
        const fixtureSubdir = path.join(fixturesDirectory, filename);

        if (!fs.statSync(fixtureSubdir).isDirectory()) {
          // TODO: debug statement here
          return;
        }

        const blockTitle = filename.split('-').join(' ');
        const localOptions = mergeWith(
          {},
          rootOptions,
          readFixtureOptions(fixtureSubdir),
          mergeCustomizer
        );

        const directoryFiles = fs
          .readdirSync(fixtureSubdir, { withFileTypes: true })
          .filter((file) => file.isFile());

        const { name: codeFilename } =
          directoryFiles.find((file) => {
            return file.name.startsWith('code.');
          }) || {};

        const { name: execFilename } =
          directoryFiles.find((file) => {
            return file.name.startsWith('exec.');
          }) || {};

        if (!codeFilename && !execFilename) {
          createAndPushFixtureConfigs({
            fixturesDirectory: fixtureSubdir,
            fixtureOptions: localOptions,
            parentDescribeConfig: createAndPushDescribeConfig(
              blockTitle,
              parentDescribeConfig
            )
          });
        } else {
          const codePath = codeFilename
            ? path.join(fixtureSubdir, codeFilename)
            : undefined;

          const execPath = execFilename
            ? path.join(fixtureSubdir, execFilename)
            : undefined;

          const hasBabelrc = [
            '.babelrc',
            '.babelrc.json',
            '.babelrc.js',
            '.babelrc.cjs',
            '.babelrc.mjs'
          ].some((p) => {
            return fs.existsSync(path.join(fixtureSubdir, p));
          });

          const {
            plugin,
            basePluginOptions,
            preset,
            basePresetOptions,
            baseBabelOptions,
            endOfLine,
            baseFormatResult,
            baseFixtureOutputExt,
            baseFixtureOutputName
          } = baseConfig;

          const {
            babelOptions,
            pluginOptions,
            presetOptions,
            title,
            only,
            skip,
            throws,
            error,
            setup,
            teardown,
            formatResult,
            fixtureOutputName,
            fixtureOutputExt
          } = localOptions;

          // ? trimAndFixLineEndings is called later on the babel output instead
          const code = codePath ? fs.readFileSync(codePath, 'utf8') : undefined;

          const exec = execPath
            ? trimAndFixLineEndings(fs.readFileSync(execPath, 'utf8'), endOfLine)
            : undefined;

          const outputExtension = codeFilename
            ? (
                fixtureOutputExt ||
                baseFixtureOutputExt ||
                codeFilename.split('.').pop()!
              ).replace(/^\./, '')
            : undefined;

          const fixtureOutputBasename = codeFilename
            ? `${fixtureOutputName || baseFixtureOutputName}.${outputExtension}`
            : undefined;

          const outputPath = codeFilename
            ? path.join(fixtureSubdir, fixtureOutputBasename!)
            : undefined;

          const hasOutputFile = outputPath && fs.existsSync(outputPath);

          const output = hasOutputFile
            ? trimAndFixLineEndings(fs.readFileSync(outputPath, 'utf8'), endOfLine, code)
            : undefined;

          const testConfig: MaybePluginTesterTestFixtureConfig = mergeWith(
            { [$type]: 'fixture-object' } as const,
            { babelOptions: baseBabelOptions },
            {
              babelOptions: {
                filename: codePath || execPath || baseBabelOptions.filename,
                // ? If they have a babelrc, then we'll let them use that
                babelrc: hasBabelrc
              }
            },
            { babelOptions: babelOptions || {} },
            {
              testBlockTitle: `${currentTestNumber++}. ${title || blockTitle}`,
              only,
              skip,
              expectedError: throws ?? error,
              testSetup: setup,
              testTeardown: teardown,
              formatResult: formatResult || baseFormatResult,
              fixtureOutputBasename,
              code,
              codeFixture: codePath,
              output,
              outputFixture: outputPath,
              exec,
              execFixture: execPath
            },
            // ? This is last to ensure plugins/presets babelOptions are arrays
            { babelOptions: { plugins: [], presets: [] } },
            mergeCustomizer
          );

          if (plugin) {
            testConfig.babelOptions.plugins.push([
              plugin,
              mergeWith({}, basePluginOptions, pluginOptions, mergeCustomizer)
            ]);
          } else {
            testConfig.babelOptions.presets.unshift([
              preset,
              mergeWith({}, basePresetOptions, presetOptions, mergeCustomizer)
            ]);
          }

          finalizePluginAndPresetRunOrder(testConfig.babelOptions);
          validateTestConfig(testConfig);
          hasTests = true;

          (parentDescribeConfig?.tests || testConfigs).push(testConfig);
        }
      });
    }

    function createTestConfig(testObject: string | TestObject) {
      if (typeof testObject === 'string') {
        testObject = { code: testObject };
      }

      const {
        plugin,
        pluginName,
        basePluginOptions,
        preset,
        presetName,
        basePresetOptions,
        baseBabelOptions,
        endOfLine,
        baseFormatResult,
        baseSnapshot
      } = baseConfig;

      const {
        babelOptions,
        pluginOptions,
        presetOptions,
        title,
        only,
        skip,
        throws,
        error,
        setup,
        teardown,
        formatResult,
        snapshot,
        code: rawCode,
        output: rawOutput,
        exec: rawExec,
        fixture,
        codeFixture: rawCodeFixture,
        outputFixture,
        execFixture
      } = mergeWith(
        {
          setup: () => undefined,
          teardown: () => undefined
        },
        testObject,
        mergeCustomizer
      );

      const codeFixture = rawCodeFixture ?? fixture;
      const code = rawCode ? stripIndent(rawCode) : readCode(filepath, codeFixture);
      const output =
        rawOutput !== undefined
          ? stripIndent(rawOutput)
          : readCode(filepath, outputFixture);
      const exec = rawExec ?? readCode(filepath, execFixture);

      const testConfig: MaybePluginTesterTestObjectConfig = mergeWith(
        { [$type]: 'test-object' } as const,
        { babelOptions: baseBabelOptions },
        {
          babelOptions: {
            filename:
              getAbsolutePath(filepath, codeFixture) ||
              filepath ||
              baseBabelOptions.filename
          }
        },
        { babelOptions: babelOptions || {} },
        {
          snapshot: snapshot ?? baseSnapshot,
          testBlockTitle: `${currentTestNumber++}. ${title || pluginName || presetName}`,
          only,
          skip,
          expectedError: throws ?? error,
          testSetup: setup,
          testTeardown: teardown,
          formatResult: formatResult || baseFormatResult,
          // ? trimAndFixLineEndings is called later on the babel output instead
          code,
          codeFixture,
          output:
            output !== undefined
              ? trimAndFixLineEndings(output, endOfLine, code)
              : undefined,
          outputFixture,
          exec: exec ? trimAndFixLineEndings(exec, endOfLine) : undefined,
          execFixture
        },
        // ? This is last to ensure plugins/presets babelOptions are arrays
        { babelOptions: { plugins: [], presets: [] } },
        mergeCustomizer
      );

      if (plugin) {
        testConfig.babelOptions.plugins.push([
          plugin,
          mergeWith({}, basePluginOptions, pluginOptions, mergeCustomizer)
        ]);
      } else {
        testConfig.babelOptions.presets.unshift([
          preset,
          mergeWith({}, basePresetOptions, presetOptions, mergeCustomizer)
        ]);
      }

      finalizePluginAndPresetRunOrder(testConfig.babelOptions);
      validateTestConfig(testConfig);
      hasTests = true;

      return testConfig;
    }
  }

  function registerTestsWithTestingFramework(tests: PluginTesterTestConfig[]) {
    tests.forEach((testConfig) => {
      if (testConfig[$type] == 'describe-block') {
        describe(testConfig.describeBlockTitle, () => {
          registerTestsWithTestingFramework(testConfig.tests);
        });
      } else {
        const { skip, only, testBlockTitle } = testConfig;

        if (skip) {
          it.skip(testBlockTitle, frameworkTestWrapper(testConfig));
        } else if (only) {
          it.only(testBlockTitle, frameworkTestWrapper(testConfig));
        } else {
          it(testBlockTitle, frameworkTestWrapper(testConfig));
        }
      }
    });
  }

  function frameworkTestWrapper(
    testConfig: PluginTesterTestObjectConfig | PluginTesterTestFixtureConfig
  ) {
    return async () => {
      const { baseSetup, baseTeardown } = baseConfig;
      const { testSetup, testTeardown } = testConfig;
      const setupFunctions = [baseSetup, testSetup];
      const teardownFunctions = [testTeardown, baseTeardown];

      for (const setupFn of setupFunctions) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const maybeTeardownFn = await setupFn();

          if (typeof maybeTeardownFn === 'function') {
            teardownFunctions.unshift(maybeTeardownFn);
          }
        } catch (error) {
          throw new Error(
            `setup function failed: ${isNativeError(error) ? error.message : error}`,
            { cause: error }
          );
        }
      }

      let frameworkError: unknown;

      try {
        await frameworkTest(testConfig);
      } catch (error) {
        frameworkError = error;
      } finally {
        for (const teardownFn of teardownFunctions) {
          try {
            // eslint-disable-next-line no-await-in-loop
            await teardownFn();
          } catch (error) {
            // ? Ensure we don't swallow any errors from frameworkTest
            const frameworkErrorMessage = frameworkError
              ? `\n\nAdditionally, the testing framework reported the following error: ${
                  isNativeError(frameworkError) ? frameworkError.message : frameworkError
                }`
              : '';

            const errorMessage = `teardown function failed: ${
              isNativeError(error) ? error.message : error
            }${frameworkErrorMessage}`;

            // eslint-disable-next-line no-unsafe-finally
            throw new Error(errorMessage, {
              cause: { error, frameworkError }
            });
          }
        }

        // ? Ensure we don't swallow any errors from frameworkTest
        if (frameworkError) {
          // eslint-disable-next-line no-unsafe-finally
          throw frameworkError;
        }
      }
    };
  }

  async function frameworkTest(
    testConfig: PluginTesterTestObjectConfig | PluginTesterTestFixtureConfig
  ) {
    const { babel, endOfLine, filepath } = baseConfig;
    const {
      babelOptions,
      testBlockTitle,
      expectedError,
      formatResult,
      code,
      codeFixture,
      output,
      outputFixture,
      exec,
      execFixture
    } = testConfig;

    let errored = false;

    const rawBabelOutput = await (async () => {
      try {
        return (
          await (babel.transformAsync || babel.transform)(code ?? exec, babelOptions)
        )?.code;
      } catch (error) {
        if (expectedError) {
          errored = true;
          return error;
        } else {
          throw error;
        }
      }
    })();

    // ? We split rawBabelOutput and result into two steps to ensure exceptions
    // ? thrown by trimAndFixLineEndings and formatResult are not erroneously
    // ? captured when we only really care about errors thrown by babel
    const result =
      !errored && typeof rawBabelOutput == 'string'
        ? trimAndFixLineEndings(
            formatResult(rawBabelOutput || '', {
              filepath: codeFixture || execFixture || filepath
            }),
            endOfLine,
            code
          )
        : rawBabelOutput;

    assert(!expectedError || errored, 'expected babel to throw an error, but it did not');

    if (exec !== undefined) {
      // TODO: implement run in context via node vm
    } else if (testConfig[$type] == 'test-object' && testConfig.snapshot) {
      assert(
        result !== code,
        'code was unmodified but attempted to take a snapshot. If the code should not be modified, set `snapshot: false`'
      );

      const separator = '\n\n      ↓ ↓ ↓ ↓ ↓ ↓\n\n';
      const formattedOutput = [code, separator, result].join('');

      expect(`\n${formattedOutput}\n`).toMatchSnapshot(testBlockTitle);
    } else if (expectedError) {
      if (typeof expectedError === 'function') {
        if (expectedError === Error || expectedError.prototype instanceof Error) {
          assert(
            result instanceof expectedError,
            `expected error to be an instance of ${
              expectedError.name || 'the expected error'
            }`
          );
        } else if (
          (expectedError as Exclude<typeof expectedError, Class<Error>>)(result) !== true
        ) {
          assert.fail('expected `throws`/`error` function to return true');
        }
      } else {
        const resultString = isNativeError(result) ? result.message : String(result);

        if (typeof expectedError === 'string') {
          assert(
            resultString.includes(expectedError),
            `expected "${resultString}" to include "${expectedError}"`
          );
        } else if (expectedError instanceof RegExp) {
          assert(
            expectedError.test(resultString),
            `expected "${resultString}" to match ${expectedError}`
          );
        } // ? Else condition is handled in the assert above
      }
    } else if (typeof result !== 'string') {
      throw new TypeError(`unexpected result type "${typeof result}" (excepted string)`);
    } else if (typeof output === 'string') {
      assert.equal(
        result,
        output,
        `actual output does not match ${
          testConfig[$type] == 'fixture-object'
            ? testConfig.fixtureOutputBasename
            : 'expected output'
        }`
      );
    } else if (
      testConfig[$type] == 'fixture-object' &&
      outputFixture &&
      output === undefined
    ) {
      fs.writeFileSync(outputFixture, result);
    } else {
      assert.equal(
        result,
        trimAndFixLineEndings(code, endOfLine),
        'expected output to not change, but it did'
      );
    }
  }

  function validateTestConfig<
    T extends MaybePluginTesterTestObjectConfig | MaybePluginTesterTestFixtureConfig
  >(
    testConfig: T
  ): // * See: https://stackoverflow.com/a/71741336/1367414
  // @ts-expect-error: encountering the limits of type inference as of 4.9.4
  asserts testConfig is T extends MaybePluginTesterTestObjectConfig
    ? PluginTesterTestObjectConfig
    : PluginTesterTestFixtureConfig {
    const {
      testBlockTitle,
      skip,
      only,
      code,
      exec,
      output,
      babelOptions,
      expectedError
    } = testConfig;

    if (testConfig[$type] == 'test-object' && testConfig.snapshot) {
      if (!globalContextExpectFnHasToMatchSnapshot) {
        throwTypeError(
          'testing environment does not support `expect(...).toMatchSnapshot` method'
        );
      }

      if (output) {
        throwTypeError(
          'neither `output` nor `outputFixture` can be provided with `snapshot` enabled'
        );
      }

      if (exec) {
        throwTypeError(
          'neither `exec` nor `execFixture` can be provided with `snapshot` enabled'
        );
      }
    }

    if (skip && only) {
      throwTypeError('cannot enable both `skip` and `only` in the same test');
    }

    if (skip && !globalContextTestFnHasSkip) {
      throwTypeError('testing environment does not support `it.skip(...)` method');
    }

    if (only && !globalContextTestFnHasOnly) {
      throwTypeError('testing environment does not support `it.only(...)` method');
    }

    if (output && expectedError !== undefined) {
      throwTypeError(
        testConfig[$type] == 'test-object'
          ? 'neither `output` nor `outputFixture` can be provided with `throws` or `error`'
          : 'a fixture cannot be provided with `throws` or `error` and also contain an output file'
      );
    }

    if (exec && expectedError !== undefined) {
      ``;
      throwTypeError(
        testConfig[$type] == 'test-object'
          ? 'neither `exec` nor `execFixture` can be provided with `throws` or `error`'
          : 'a fixture cannot be provided with `throws` or `error` and also contain an exec file'
      );
    }

    if (!code && !exec) {
      throwTypeError(
        testConfig[$type] == 'test-object'
          ? 'a string or object with a `code`, `codeFixture`, `exec`, or `execFixture` must be provided'
          : 'a fixture must contain either a code file or an exec file'
      );
    }

    if (!!(code || output) && !!exec) {
      throwTypeError(
        testConfig[$type] == 'test-object'
          ? 'neither `code`, `codeFixture`, `output`, nor `outputFixture` can be provided with `exec` or `execFixture`'
          : 'a fixture cannot contain both an exec file and a code or output file'
      );
    }

    if (babelOptions.babelrc && !babelOptions.filename) {
      throwTypeError(
        '`babelOptions.babelrc` is enabled but `babelOptions.filename` was not provided'
      );
    }

    if (
      expectedError &&
      !(
        ['function', 'boolean', 'string'].includes(typeof expectedError) ||
        expectedError instanceof RegExp
      )
    ) {
      throwTypeError(
        '`throws`/`error` must be a function, string, boolean, RegExp, or Error subtype'
      );
    }

    function throwTypeError(message: string) {
      throw new TypeError(
        `failed to validate configuration for test "${testBlockTitle}": ${message}`
      );
    }
  }
}

function mergeCustomizer(
  objValue: unknown,
  srcValue: unknown,
  key: string,
  object: Record<string, unknown>,
  source: Record<string, unknown>
) {
  if (object && srcValue === undefined && key in source) {
    delete object[key];
  } else if (Array.isArray(objValue)) {
    return objValue.concat(srcValue);
  }

  return undefined;
}

function getAbsolutePath(filename?: string, basename?: string) {
  return !basename
    ? undefined
    : path.isAbsolute(basename)
    ? basename
    : filename
    ? path.join(path.dirname(filename), basename)
    : undefined;
}

function readFixtureOptions(baseDirectory: string) {
  const optionsPath = [
    path.join(baseDirectory, 'options.js'),
    path.join(baseDirectory, 'options.json')
  ].find((p) => fs.existsSync(p));

  return optionsPath ? (require(optionsPath) as FixtureOptions) : {};
}

function readCode(filename?: string, fixture?: string) {
  const path = getAbsolutePath(filename, fixture);
  return (path ? fs.readFileSync(path, 'utf8') : '') || undefined;
}

function trimAndFixLineEndings(
  source: string,
  endOfLine: NonNullable<PluginTesterOptions['endOfLine']>,
  input = source
) {
  return (
    endOfLine === false ? source : source.replaceAll(/\r?\n/g, getReplacement())
  ).trim();

  function getReplacement() {
    switch (endOfLine) {
      case 'lf': {
        return '\n';
      }
      case 'crlf': {
        return '\r\n';
      }
      case 'auto': {
        return EOL;
      }
      case 'preserve': {
        const match = input.match(/\r?\n/);
        if (match === null) {
          return EOL;
        }
        return match[0];
      }
      default: {
        throw new TypeError(
          "failed to validate configuration: invalid 'endOfLine' option"
        );
      }
    }
  }
}

/**
 * Clears out nullish plugin/preset values and replaces symbols with their
 * proper values.
 */
function finalizePluginAndPresetRunOrder(
  babelOptions: PluginTesterOptions['babelOptions']
) {
  // TODO: debug statements here about replacing symbols and clearing nullish

  if (babelOptions?.plugins) {
    babelOptions.plugins = babelOptions.plugins.filter((p) => {
      // TODO: debug statement here
      return Boolean(p);
    });

    if (babelOptions.plugins.includes(runPluginUnderTestHere)) {
      babelOptions.plugins.splice(
        babelOptions.plugins.indexOf(runPluginUnderTestHere),
        1,
        babelOptions.plugins.pop()!
      );
    }
  }

  if (babelOptions?.presets) {
    babelOptions.presets = babelOptions.presets.filter((p) => {
      // TODO: debug statement here
      return Boolean(p);
    });

    if (babelOptions.presets.includes(runPresetUnderTestHere)) {
      babelOptions.presets.splice(
        // ? -1 because we're shifting an element off the beginning afterwards
        babelOptions.presets.indexOf(runPresetUnderTestHere) - 1,
        1,
        babelOptions.presets.shift()!
      );
    }
  }
}
