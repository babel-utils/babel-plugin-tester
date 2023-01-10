/* eslint-disable unicorn/consistent-destructuring */
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { EOL } from 'node:os';
import { isNativeError } from 'node:util/types';
import mergeWith from 'lodash.mergewith';
import stripIndent from 'strip-indent';
import { createContext, Script } from 'node:vm';

import { $type } from './symbols';

import {
  runPluginUnderTestHere,
  runPresetUnderTestHere,
  validTitleNumberingValues,
  type Range,
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

const isIntegerRegExp = /^\d+$/;

const isIntegerRangeRegExp = /^(?<startStr>\d+)-(?<endStr>\d+)$/;

const noop = () => undefined;
Object.freeze(noop);

export default pluginTester;

/**
 * Internal current test counter. Used for automatic title numbering via the
 * `titleNumbering` and `restartTitleNumbering` babel-plugin-tester options.
 */
let currentTestNumber = 1;

/**
 * This function has the same effect as calling `pluginTester` with
 * `restartTitleNumbering: true`.
 */
export function restartTestTitleNumbering() {
  currentTestNumber = 1;
}

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
    throw new TypeError(
      'incompatible testing environment: testing environment must define `describe` in its global scope'
    );
  }

  if (!globalContextHasTestFn) {
    throw new TypeError(
      'incompatible testing environment: testing environment must define `it` in its global scope'
    );
  }

  let hasTests = false;
  const baseConfig = resolveBaseConfig();
  const envConfig = resolveConfigFromEnvironmentVariables();
  const normalizedTests = normalizeTests();

  // TODO: debug statements here printing resolved configs

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
        titleNumbering: 'all' as string | false,
        endOfLine: 'lf',
        formatResult: ((r) => r) as ResultFormatter,
        snapshot: false,
        fixtureOutputName: 'output',
        setup: noop,
        teardown: noop
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
      throw new TypeError(
        'failed to validate configuration: cannot test a plugin and a preset simultaneously. Specify one set of options or the other'
      );
    }

    if (!validTitleNumberingValues.includes(rawBaseConfig.titleNumbering)) {
      throw new TypeError(
        'failed to validate configuration: invalid `titleNumbering` option'
      );
    }

    const baseConfig: PartialPluginTesterBaseConfig = {
      babel: rawBaseConfig.babel || require('@babel/core'),
      baseBabelOptions: rawBaseConfig.babelOptions,
      titleNumbering: rawBaseConfig.titleNumbering,
      filepath: rawBaseConfig.filepath || rawBaseConfig.filename || tryInferFilepath(),
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
      rawBaseConfig.title === false
        ? false
        : rawBaseConfig.title ||
          baseConfig.pluginName ||
          baseConfig.presetName ||
          undefined;

    if (rawBaseConfig.restartTitleNumbering) {
      restartTestTitleNumbering();
    }

    return baseConfig as PluginTesterBaseConfig;

    function tryInferPluginName() {
      try {
        // * https://xunn.at/babel-helper-plugin-utils-src
        return rawBaseConfig.plugin!(
          {
            assertVersion: noop,
            targets: noop,
            assumption: noop
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

  function resolveConfigFromEnvironmentVariables() {
    return {
      skipTestsByRegExp: stringToRegExp(process.env.TEST_SKIP),
      onlyTestsByRegExp: stringToRegExp(process.env.TEST_ONLY),
      skipTestsByRange: stringToRanges('TEST_NUM_SKIP', process.env.TEST_NUM_SKIP),
      onlyTestsByRange: stringToRanges('TEST_NUM_ONLY', process.env.TEST_NUM_ONLY)
    };

    function stringToRegExp(str: string | undefined) {
      return str === undefined ? undefined : new RegExp(str, 'u');
    }

    function stringToRanges(name: string, str: string | undefined): (number | Range)[] {
      if (typeof str != 'string') {
        return [];
      }

      return str
        .split(',')
        .map((s) => {
          s = s.trim();

          if (s) {
            if (isIntegerRegExp.test(s)) {
              return Number(s);
            }

            const { startStr, endStr } = s.match(isIntegerRangeRegExp)?.groups || {};

            if (startStr && endStr) {
              const start = Number(startStr);
              const end = Number(endStr);

              if (start > end) {
                throw new TypeError(
                  `invalid environment variable "${name}": invalid range ${s}: ${start} is greater than ${end}`
                );
              } else if (start == end) {
                return start;
              }

              return { start, end };
            }

            throw new TypeError(
              `invalid environment variable "${name}": invalid range ${s}`
            );
          }
        })
        .filter((s): s is NonNullable<typeof s> => Boolean(s));
    }
  }

  function normalizeTests() {
    const { describeBlockTitle, filepath, tests, fixtures } = baseConfig;
    const testsIsArray = Array.isArray(tests);
    const fixturesAbsolutePath = getAbsolutePath(filepath, fixtures);
    const testConfigs: PluginTesterTestConfig[] = [];

    const useFixtureTitleNumbering =
      baseConfig.titleNumbering == 'all' || baseConfig.titleNumbering == 'fixtures-only';

    const useTestObjectTitleNumbering =
      baseConfig.titleNumbering == 'all' || baseConfig.titleNumbering == 'tests-only';

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
            .filter(([title, test]) => {
              // TODO: debug statement here instead of void
              void title;
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
        { setup: noop, teardown: noop } as object,
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
            // ! Keep the # of source objects to <=4 to get type inference
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
              // ? This is last to ensure plugins/presets babelOptions are
              // ? always arrays
              babelOptions: { plugins: [], presets: [] },
              testBlockTitle: (() => {
                const titleString = title || blockTitle;
                if (useFixtureTitleNumbering) {
                  const numericPrefix = currentTestNumber++;
                  return {
                    numericPrefix,
                    titleString,
                    fullString: `${numericPrefix}. ${titleString}`
                  };
                } else {
                  return {
                    numericPrefix: undefined,
                    titleString,
                    fullString: titleString
                  };
                }
              })(),
              only,
              skip,
              expectedError: throws ?? error,
              testSetup: setup || noop,
              testTeardown: teardown || noop,
              formatResult: formatResult || baseFormatResult,
              fixtureOutputBasename,
              code,
              codeFixture: codePath,
              output,
              outputFixture: outputPath,
              exec,
              execFixture: execPath
            },
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
          setup: noop,
          teardown: noop
        } as object,
        testObject,
        mergeCustomizer
      );

      const codeFixture = rawCodeFixture ?? fixture;
      const code =
        rawCode !== undefined ? stripIndent(rawCode) : readCode(filepath, codeFixture);
      const output =
        rawOutput !== undefined
          ? stripIndent(rawOutput)
          : readCode(filepath, outputFixture);
      const exec = rawExec ?? readCode(filepath, execFixture);

      const testConfig: MaybePluginTesterTestObjectConfig = mergeWith(
        { [$type]: 'test-object' } as const,
        // ! Keep the # of source objects to <=4 to get type inference
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
          // ? This is last to ensure plugins/presets babelOptions are always
          // ? arrays
          babelOptions: { plugins: [], presets: [] },
          snapshot: snapshot ?? baseSnapshot,
          testBlockTitle: (() => {
            const titleString = (title || pluginName || presetName) as string;
            if (useTestObjectTitleNumbering) {
              const numericPrefix = currentTestNumber++;
              return {
                numericPrefix,
                titleString,
                fullString: `${numericPrefix}. ${titleString}`
              };
            } else {
              return {
                numericPrefix: undefined,
                titleString,
                fullString: titleString
              };
            }
          })(),
          only,
          skip,
          expectedError: throws ?? error,
          testSetup: setup || noop,
          testTeardown: teardown || noop,
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
        const {
          skip,
          only,
          testBlockTitle: { numericPrefix, titleString, fullString }
        } = testConfig;

        let method: 'skip' | 'only' | undefined = undefined;

        if (
          envConfig.skipTestsByRegExp?.test(titleString) ||
          numericPrefixInRanges(numericPrefix, envConfig.skipTestsByRange)
        ) {
          method = 'skip';
        } else if (
          envConfig.onlyTestsByRegExp?.test(titleString) ||
          numericPrefixInRanges(numericPrefix, envConfig.onlyTestsByRange)
        ) {
          method = 'only';
        } else if (skip) {
          method = 'skip';
        } else if (only) {
          method = 'only';
        }

        (method ? it[method] : it)(fullString, frameworkTestWrapper(testConfig));
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

      for (const [index, setupFn] of setupFunctions.entries()) {
        try {
          // eslint-disable-next-line no-await-in-loop
          const maybeTeardownFn = await setupFn();

          if (typeof maybeTeardownFn === 'function') {
            teardownFunctions.splice(index - 1, 0, maybeTeardownFn);
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

    assert(!expectedError || errored, 'expected babel to throw an error, but it did not');

    if (expectedError) {
      if (typeof expectedError === 'function') {
        if (expectedError === Error || expectedError.prototype instanceof Error) {
          assert(
            rawBabelOutput instanceof expectedError,
            `expected error to be an instance of ${
              expectedError.name || 'the expected error'
            }`
          );
        } else if (
          (expectedError as Exclude<typeof expectedError, Class<Error>>)(
            rawBabelOutput
          ) !== true
        ) {
          assert.fail('expected `throws`/`error` function to return true');
        }
      } else {
        const resultString = isNativeError(rawBabelOutput)
          ? rawBabelOutput.message
          : String(rawBabelOutput);

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
        } // ? Else condition is handled by the typeof === 'function' branch
      }
    } else if (typeof rawBabelOutput !== 'string') {
      throw new TypeError(
        `unexpected babel output type "${typeof rawBabelOutput}" (excepted string)`
      );
    } else {
      const formatResultFilepath = codeFixture || execFixture || filepath;

      // ? We split rawBabelOutput and result into two steps to ensure
      // ? exceptions thrown by trimAndFixLineEndings and formatResult are not
      // ? erroneously captured when we only really care about errors thrown by
      // ? babel
      const result = trimAndFixLineEndings(
        formatResult(rawBabelOutput || '', {
          cwd: formatResultFilepath ? path.dirname(formatResultFilepath) : undefined,
          filepath: formatResultFilepath,
          filename: formatResultFilepath
        }),
        endOfLine,
        code
      );

      if (exec !== undefined) {
        const fakeModule = { exports: {} };
        const context = createContext({
          ...globalThis,
          module: fakeModule,
          exports: fakeModule.exports,
          require
        });

        new Script(result, { filename: execFixture }).runInContext(context, {
          displayErrors: true,
          breakOnSigint: true,
          microtaskMode: 'afterEvaluate'
        });
      } else if (testConfig[$type] == 'test-object' && testConfig.snapshot) {
        assert(
          result !== code,
          'code was unmodified but attempted to take a snapshot. If the code should not be modified, set `snapshot: false`'
        );

        const separator = '\n\n      ↓ ↓ ↓ ↓ ↓ ↓\n\n';
        const formattedOutput = [code, separator, result].join('');

        expect(`\n${formattedOutput}\n`).toMatchSnapshot(testBlockTitle.fullString);
      } else if (output !== undefined) {
      assert.equal(
        result,
        output,
        `actual output does not match ${
          testConfig[$type] == 'fixture-object'
            ? testConfig.fixtureOutputBasename
            : 'expected output'
        }`
      );
      } else if (testConfig[$type] == 'fixture-object' && outputFixture) {
      fs.writeFileSync(outputFixture, result);
    } else {
      assert.equal(
        result,
        trimAndFixLineEndings(code, endOfLine),
        'expected output to not change, but it did'
      );
      }
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

      if (output !== undefined) {
        throwTypeError(
          'neither `output` nor `outputFixture` can be provided with `snapshot` enabled'
        );
      }

      if (exec !== undefined) {
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

    if (output !== undefined && expectedError !== undefined) {
      throwTypeError(
        testConfig[$type] == 'test-object'
          ? 'neither `output` nor `outputFixture` can be provided with `throws` or `error`'
          : 'a fixture cannot be provided with `throws` or `error` and also contain an output file'
      );
    }

    if (exec !== undefined && expectedError !== undefined) {
      throwTypeError(
        testConfig[$type] == 'test-object'
          ? 'neither `exec` nor `execFixture` can be provided with `throws` or `error`'
          : 'a fixture cannot be provided with `throws` or `error` and also contain an exec file'
      );
    }

    if (code === undefined && exec === undefined) {
      throwTypeError(
        testConfig[$type] == 'test-object'
          ? 'a string or object with a `code`, `codeFixture`, `exec`, or `execFixture` must be provided'
          : 'a fixture must contain either a code file or an exec file'
      );
    }

    if ((code !== undefined || output !== undefined) && exec !== undefined) {
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
      expectedError !== undefined &&
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
        `failed to validate configuration for test "${testBlockTitle.fullString}": ${message}`
      );
    }
  }
}

/**
 * Custom lodash merge customizer that causes source arrays to be concatenated
 * and successive `undefined` values to unset (delete) the property if it
 * exists.
 *
 * @see https://lodash.com/docs/4.17.15#mergeWith
 */
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

/**
 * Take the dirname of a `filename` and join `basename` to it, creating an
 * absolute path. If `basename` is already absolute, it will be returned as is.
 * If either `basename` or `filename` is falsy, `undefined` is returned instead.
 */
function getAbsolutePath(filename?: string, basename?: string) {
  return !basename
    ? undefined
    : path.isAbsolute(basename)
    ? basename
    : filename
    ? path.join(path.dirname(filename), basename)
    : undefined;
}

/**
 * Synchronously `require()` the first available options file within a fixture.
 * Any errors will be passed up to the calling function.
 */
function readFixtureOptions(baseDirectory: string) {
  const optionsPath = [
    path.join(baseDirectory, 'options.js'),
    path.join(baseDirectory, 'options.json')
  ].find((p) => fs.existsSync(p));

  return optionsPath ? (require(optionsPath) as FixtureOptions) : {};
}

/**
 * Synchronously read in the file at `filename` after transforming the path into
 * an absolute path if it is not one already. Any errors will be passed up to
 * the calling function.
 */
function readCode(filename?: string, fixture?: string) {
  const path = getAbsolutePath(filename, fixture);
  return (path ? fs.readFileSync(path, 'utf8') : '') || undefined;
}

/**
 * Trim a string and normalize any line ending characters.
 */
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
          'failed to validate configuration: invalid `endOfLine` option'
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

/**
 * Determines if `numericPrefix` equals at least one number or is covered by at
 * least one range Range in the `ranges` array.
 */
function numericPrefixInRanges(
  numericPrefix: number | undefined,
  ranges: (number | Range)[]
) {
  if (typeof numericPrefix == 'number') {
    return ranges.some((range) => {
      return typeof range == 'number'
        ? numericPrefix == range
        : numericPrefix >= range.start && numericPrefix <= range.end;
    });
  }

  return false;
}
