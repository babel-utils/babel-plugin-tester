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
  type MaybePluginTesterTestFixtureConfig
} from '.';

import type { Class } from 'type-fest';

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

    // TODO: implement support for preset testing configuration

    // ? Need to do this here instead of in the validation function since plugin
    // name inference relies on plugin being defined
    if (!rawBaseConfig.plugin) {
      throw new TypeError('plugin is a required parameter');
    }

    const pluginName =
      rawBaseConfig.pluginName || tryInferPluginName() || 'unknown plugin';

    const baseConfig = {
      plugin: rawBaseConfig.plugin,
      pluginName,
      basePluginOptions: rawBaseConfig.pluginOptions || {},
      preset: undefined,
      presetName: undefined,
      basePresetOptions: undefined,
      babel: rawBaseConfig.babel || require('@babel/core'),
      baseBabelOptions: rawBaseConfig.babelOptions,
      describeBlockTitle: rawBaseConfig.title ?? pluginName,
      // TODO: implement default filepath inference using Error stack trace
      filepath: rawBaseConfig.filepath ?? rawBaseConfig.filename,
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

    return baseConfig;

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
            // TODO: use this preset, TODO: use this basePresetOptions,
            baseBabelOptions,
            endOfLine,
            baseFormatResult,
            baseFixtureOutputExt,
            baseFixtureOutputName
          } = baseConfig;

          const {
            babelOptions,
            pluginOptions,
            // TODO: use this presetOptions,
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
                filename: codePath,
                // ? If they have a babelrc, then we'll let them use that
                babelrc: hasBabelrc
              }
            },
            { babelOptions },
            {
              babelOptions: {
                // ? Ensure `localOptions` comes before `babelOptions.plugins` ?
                // to preserve default plugin run order
                plugins: [
                  [
                    plugin,
                    mergeWith({}, basePluginOptions, pluginOptions, mergeCustomizer)
                  ]
                ]
              },
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
            mergeCustomizer
          );

          finalizePluginAndPresetRunOrder(testConfig.babelOptions);
          // ? Ensures we have an actual PluginTesterTestFixtureConfig object
          validateTestConfig(testConfig);
          hasTests = true;

          (parentDescribeConfig?.tests || testConfigs).push(
            testConfig as PluginTesterTestFixtureConfig
          );
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
        // TODO: use this preset, TODO: use this presetName, TODO: use this
        //basePresetOptions,
        baseBabelOptions,
        endOfLine,
        baseFormatResult,
        baseSnapshot
      } = baseConfig;

      const {
        babelOptions,
        pluginOptions,
        // TODO: use this presetOptions,
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
          babelOptions: { filename: getAbsolutePath(filepath, codeFixture) }
        },
        { babelOptions },
        {
          snapshot: snapshot ?? baseSnapshot,
          // ? Ensure `rawFixtureConfig` comes before ? `babelOptions.plugins`
          // to preserve default plugin run order
          babelOptions: {
            plugins: [
              [plugin, mergeWith({}, basePluginOptions, pluginOptions, mergeCustomizer)]
            ]
          },
          testBlockTitle: `${currentTestNumber++}. ${title || pluginName}`,
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
        mergeCustomizer
      );

      finalizePluginAndPresetRunOrder(testConfig.babelOptions);
      // ? Ensures we have an actual PluginTesterTestObjectConfig object
      validateTestConfig(testConfig);
      hasTests = true;

      return testConfig as PluginTesterTestObjectConfig;
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

function mergeCustomizer(objValue: unknown[], srcValue: unknown) {
  return Array.isArray(objValue) ? objValue.concat(srcValue) : undefined;
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

function finalizePluginAndPresetRunOrder(
  babelOptions: PluginTesterOptions['babelOptions']
) {
  if (babelOptions?.plugins?.includes(runPluginUnderTestHere)) {
    babelOptions.plugins.splice(
      babelOptions.plugins.indexOf(runPluginUnderTestHere),
      1,
      babelOptions.plugins.pop()!
    );
  }

  // TODO: also finalize preset run order
}
