/* eslint-disable unicorn/consistent-destructuring */
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { EOL } from 'node:os';
import { isNativeError } from 'node:util/types';
import mergeWith from 'lodash.mergewith';
import stripIndent from 'strip-indent';
import { createContext, Script } from 'node:vm';
import debugFactory from 'debug';

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

const getDebuggers = (namespace: string, parentDebugger: debugFactory.Debugger) => {
  const debug = parentDebugger.extend(namespace);

  return {
    debug,
    verbose: debug.extend('verbose')
  };
};

const { debug: debug1, verbose: verbose1 } = getDebuggers(
  'tester',
  debugFactory('babel-plugin-tester')
);

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
  debug1('restarted title numbering');
  currentTestNumber = 1;
}

/**
 * An abstraction around babel to help you write tests for your babel plugin or
 * preset. It was built to work with Jest, but most of the functionality should
 * work with Mocha, Jasmine, and any other framework that defines standard
 * `describe` and `it` globals with async support.
 */
export function pluginTester(options: PluginTesterOptions = {}) {
  debug1('executing main babel-plugin-tester function');

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

  debug1('global context check succeeded');

  let hasTests = false;
  const baseConfig = resolveBaseConfig();
  const envConfig = resolveConfigFromEnvironmentVariables();
  const normalizedTests = normalizeTests();

  verbose1('base configuration: %O', baseConfig);
  verbose1('environment-derived config: %O', envConfig);
  verbose1('normalized test blocks: %O', normalizedTests);

  if (!hasTests) {
    debug1('terminated early: no valid tests provided');
    return;
  }

  registerTestsWithTestingFramework(normalizedTests);

  debug1('finished registering all test blocks with testing framework');
  debug1('finished executing main babel-plugin-tester function');

  function resolveBaseConfig(): PluginTesterBaseConfig {
    const { debug: debug2, verbose: verbose2 } = getDebuggers('resolve-base', debug1);

    debug2('resolving base configuration');

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

    verbose2('raw base configuration: %O', rawBaseConfig);

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

    verbose2('partially constructed base configuration: %O', baseConfig);

    if (baseConfig.fixtures !== undefined && typeof baseConfig.fixtures != 'string') {
      throw new TypeError(
        'failed to validate configuration: `fixtures`, if defined, must be a string'
      );
    }

    if (
      baseConfig.tests !== undefined &&
      !Array.isArray(baseConfig.tests) &&
      (!baseConfig.tests || typeof baseConfig.tests != 'object')
    ) {
      throw new TypeError(
        'failed to validate configuration: `tests`, if defined, must be an array or an object'
      );
    }

    baseConfig.tests = Array.isArray(baseConfig.tests)
      ? baseConfig.tests.filter((test, ndx) => {
          if (
            Array.isArray(test) ||
            (typeof test != 'string' &&
              test !== null &&
              test !== undefined &&
              typeof test != 'object')
          ) {
            throw new TypeError(
              `failed to validate configuration: \`tests\` array item at index ${ndx} must be a string, TestObject, or nullish`
            );
          }

          const result = typeof test == 'string' || Boolean(test);

          if (!result) {
            debug2(`test item \`%O\` at index ${ndx} was skipped`, test);
          }

          return result;
        })
      : Object.fromEntries(
          Object.entries(baseConfig.tests).filter(([title, test]) => {
            if (
              Array.isArray(test) ||
              (typeof test != 'string' &&
                test !== null &&
                test !== undefined &&
                typeof test != 'object')
            ) {
              throw new TypeError(
                `failed to validate configuration: \`tests\` object property "${title}" must have a value of type string, TestObject, or nullish`
              );
            }

            const result = typeof test == 'string' || Boolean(test);

            if (!result) {
              debug2(`test property "${title}" with value \`%O\` was skipped`, test);
            }

            return result;
          })
        );

    if (rawBaseConfig.plugin) {
      debug2('running in plugin mode');

      baseConfig.plugin = rawBaseConfig.plugin;
      baseConfig.pluginName =
        rawBaseConfig.pluginName || tryInferPluginName() || 'unknown plugin';
      baseConfig.basePluginOptions = rawBaseConfig.pluginOptions || {};
    } else if (rawBaseConfig.preset) {
      debug2('running in preset mode');

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

    debug2('describe block title: %O', baseConfig.describeBlockTitle);

    if (rawBaseConfig.restartTitleNumbering) {
      restartTestTitleNumbering();
    }

    return baseConfig as PluginTesterBaseConfig;

    function tryInferPluginName() {
      debug2('attempting to infer plugin name');

      try {
        // * https://xunn.at/babel-helper-plugin-utils-src
        const { name } = rawBaseConfig.plugin!(
          {
            assertVersion: noop,
            targets: noop,
            assumption: noop
          },
          {},
          process.cwd()
        );

        debug2('plugin name inference succeeded: %O', name);
        return name;
      } catch {
        debug2('plugin name inference failed');
        return undefined;
      }
    }

    function tryInferFilepath() {
      // ? Allow the end user to unset filepath by setting it to undefined
      if ('filepath' in rawBaseConfig || 'filename' in rawBaseConfig) {
        debug2('filepath was manually unset');
        return undefined;
      }

      debug2('attempting to infer filepath');

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

        verbose2('reversed call stack: %O', reversedCallStack);

        if (reversedCallStack?.length) {
          const referenceIndex = findReferenceStackIndex(reversedCallStack);
          verbose2('reference index: %O', referenceIndex);

          if (referenceIndex) {
            inferredFilepath = reversedCallStack.at(referenceIndex - 1)?.filePath;
          }
        }

        debug2('inferred filepath: %O', inferredFilepath);
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
    const { debug: debug2 } = getDebuggers('resolve-env', debug1);

    debug2('resolving environment variable configuration');

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
    const { debug: debug2 } = getDebuggers('normalize', debug1);

    debug2('normalizing test items into test objects');

    const { describeBlockTitle, filepath, tests, fixtures } = baseConfig;
    const testsIsArray = Array.isArray(tests);
    const fixturesAbsolutePath = getAbsolutePathUsingFilepathDirname(filepath, fixtures);
    const testConfigs: PluginTesterTestConfig[] = [];

    const useFixtureTitleNumbering =
      baseConfig.titleNumbering == 'all' || baseConfig.titleNumbering == 'fixtures-only';

    const useTestObjectTitleNumbering =
      baseConfig.titleNumbering == 'all' || baseConfig.titleNumbering == 'tests-only';

    if (fixturesAbsolutePath) {
      debug2(
        'potentially generating test objects from fixtures path: %O',
        fixturesAbsolutePath
      );

      if (fs.statSync(fixturesAbsolutePath).isDirectory()) {
        debug2('generating test objects from fixtures path');

        const describeBlock =
          typeof describeBlockTitle == 'string'
            ? createAndPushDescribeConfig(`${describeBlockTitle} fixtures`)
            : undefined;

        if (describeBlock === undefined) {
          debug2('skipped creating describe block');
        }

        createAndPushFixtureConfigs({
          fixturesDirectory: fixturesAbsolutePath,
          parentDescribeConfig: describeBlock
        });
      } else {
        debug2('not generating test objects from fixtures path: path is not a directory');
      }
    }

    if (tests && (!testsIsArray || tests.length)) {
      debug2('generating test objects from tests');

      const describeBlock =
        typeof describeBlockTitle == 'string'
          ? createAndPushDescribeConfig(describeBlockTitle)
          : undefined;

      if (describeBlock === undefined) {
        debug2('skipped creating describe block');
      }

      if (testsIsArray) {
        debug2(`${tests.length} tests were provided via an array`);
        (describeBlock?.tests || testConfigs).push(
          ...tests.map((test) => createTestConfig(test))
        );
      } else {
        const entries = Object.entries(tests);
        debug2(`${entries.length} tests were provided via an object`);
        (describeBlock?.tests || testConfigs).push(
          ...entries.map(([title, test]) => {
            return createTestConfig({
              title,
              ...(typeof test == 'string' ? { code: test } : test)
            });
          })
        );
      }
    }

    debug2('finished normalizing tests');
    return testConfigs;

    function createAndPushDescribeConfig(
      describeBlockTitle: PluginTesterTestDescribeConfig['describeBlockTitle'],
      parentDescribeConfig?: PluginTesterTestDescribeConfig
    ) {
      const { debug: debug3 } = getDebuggers('create-desc', debug2);

      debug3('generating new describe block: %O', describeBlockTitle);

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
      const { debug: debug3, verbose: verbose3 } = getDebuggers('create-fix', debug2);

      debug3(
        'potentially generating test objects from fixture at path %O',
        fixturesDirectory
      );

      if (!fs.statSync(fixturesDirectory).isDirectory()) {
        debug3('test objects generation skipped: path is not a directory');
        return;
      }

      const rootOptions = mergeWith(
        { setup: noop, teardown: noop } as object,
        fixtureOptions,
        readFixtureOptions(fixturesDirectory),
        mergeCustomizer
      );

      verbose3('root options: %O', rootOptions);

      fs.readdirSync(fixturesDirectory).forEach((filename) => {
        const fixtureSubdir = path.join(fixturesDirectory, filename);

        debug3(
          'potentially generating new test object from fixture at subpath %O',
          fixtureSubdir
        );

        if (!fs.statSync(fixtureSubdir).isDirectory()) {
          debug3('test object generation skipped: subpath is not a directory');
          return;
        }

        const blockTitle = filename.split('-').join(' ');
        const localOptions = mergeWith(
          {},
          rootOptions,
          readFixtureOptions(fixtureSubdir),
          mergeCustomizer
        );

        verbose3('localOptions: %O', localOptions);

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

        verbose3('code filename: %O', codeFilename);
        verbose3('exec filename: %O', execFilename);

        // ! Code in the else branch is relying specifically on this check
        if (!codeFilename && !execFilename) {
          debug3(
            'no code or exec file found in subpath. Skipped generating test object. Subpath will be scanned for nested fixtures'
          );

          createAndPushFixtureConfigs({
            fixturesDirectory: fixtureSubdir,
            fixtureOptions: localOptions,
            parentDescribeConfig: createAndPushDescribeConfig(
              blockTitle,
              parentDescribeConfig
            )
          });
        } else {
          debug3(
            'code or exec file found in subpath. Skipped scanning for nested fixtures. Test object will be generated'
          );

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
          const code = readCode(codePath);

          // ? trimAndFixLineEndings is called later on the babel output instead
          const exec = execPath ? readCode(execPath) : undefined;

          const outputExtension = (
            fixtureOutputExt ||
            baseFixtureOutputExt ||
            // ? It is impossible for any of the following to be undefined
            (codeFilename || execFilename)!.split('.').pop()!
          ).replace(/^\./, '');

          const fixtureOutputBasename = `${
            fixtureOutputName || baseFixtureOutputName
          }.${outputExtension}`;

          const outputPath = path.join(fixtureSubdir, fixtureOutputBasename);

          const hasOutputFile = outputPath && fs.existsSync(outputPath);

          const output = hasOutputFile
            ? trimAndFixLineEndings(readCode(outputPath), endOfLine, code)
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

          verbose3('partially constructed fixture-based test object: %O', testConfig);

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
          verbose3('finalized fixture-based test object: %O', testConfig);

          validateTestConfig(testConfig);
          hasTests = true;

          (parentDescribeConfig?.tests || testConfigs).push(testConfig);
        }
      });
    }

    function createTestConfig(testObject: string | TestObject) {
      const { verbose: verbose3 } = getDebuggers('create-obj', debug2);

      verbose3('generating new test object');

      if (typeof testObject === 'string') {
        testObject = { code: testObject };
      }

      verbose3('raw test object: %O', testObject);

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
        execFixture: rawExecFixture
      } = mergeWith(
        {
          setup: noop,
          teardown: noop
        } as object,
        testObject,
        mergeCustomizer
      );

      const codeFixture = getAbsolutePathUsingFilepathDirname(
        filepath,
        rawCodeFixture ?? fixture
      );

      const execFixture = getAbsolutePathUsingFilepathDirname(filepath, rawExecFixture);

      const code = rawCode !== undefined ? stripIndent(rawCode) : readCode(codeFixture);

      const output =
        rawOutput !== undefined
          ? stripIndent(rawOutput)
          : readCode(filepath, outputFixture);

      const exec = rawExec ?? readCode(execFixture);

      const testConfig: MaybePluginTesterTestObjectConfig = mergeWith(
        { [$type]: 'test-object' } as const,
        // ! Keep the # of source objects to <=4 to get type inference
        { babelOptions: baseBabelOptions },
        {
          babelOptions: {
            filename: codeFixture || execFixture || filepath || baseBabelOptions.filename
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
          exec,
          execFixture
        },
        mergeCustomizer
      );

      verbose3('partially constructed test object: %O', testConfig);

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
      verbose3('finalized test object: %O', testConfig);

      validateTestConfig(testConfig, {
        hasCodeAndCodeFixture: !!(rawCode && codeFixture),
        hasOutputAndOutputFixture: !!(rawOutput && outputFixture),
        hasExecAndExecFixture: !!(rawExec && execFixture)
      });

      hasTests = true;
      return testConfig;
    }
  }

  function registerTestsWithTestingFramework(tests: PluginTesterTestConfig[]) {
    const { debug: debug2 } = getDebuggers('register', debug1);

    debug2(`registering ${tests.length} blocks with testing framework`);

    tests.forEach((testConfig) => {
      if (testConfig[$type] == 'describe-block') {
        debug2(
          `registering describe block "${testConfig.describeBlockTitle}" and its sub-blocks`
        );
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
          debug2(
            `registering test block "${fullString}" (with \`skip\` property enabled via environment variable)`
          );
        } else if (
          envConfig.onlyTestsByRegExp?.test(titleString) ||
          numericPrefixInRanges(numericPrefix, envConfig.onlyTestsByRange)
        ) {
          method = 'only';
          debug2(
            `registering test block "${fullString}" (with \`only\` property enabled via environment variable)`
          );
        } else if (skip) {
          method = 'skip';
          debug2(
            `registering test block "${fullString}" (with \`skip\` property enabled)`
          );
        } else if (only) {
          method = 'only';
          debug2(
            `registering test block "${fullString}" (with \`only\` property enabled)`
          );
        } else {
          debug2(`registering test block "${fullString}"`);
        }

        (method ? it[method] : it)(fullString, frameworkTestWrapper(testConfig));
      }
    });
  }

  function frameworkTestWrapper(
    testConfig: PluginTesterTestObjectConfig | PluginTesterTestFixtureConfig
  ) {
    const { verbose: verbose2 } = getDebuggers('wrapper', debug1);

    return async () => {
      const { baseSetup, baseTeardown } = baseConfig;
      const { testSetup, testTeardown } = testConfig;
      const setupFunctions = [baseSetup, testSetup];
      const teardownFunctions = [testTeardown, baseTeardown];

      for (const [index, setupFn] of setupFunctions.entries()) {
        verbose2(`running setup function #${index + 1}`);

        try {
          // eslint-disable-next-line no-await-in-loop
          const maybeTeardownFn = await setupFn();

          if (typeof maybeTeardownFn === 'function') {
            verbose2(
              `registered teardown function returned from setup function #${index + 1}`
            );
            teardownFunctions.splice(index - 1, 0, maybeTeardownFn);
          }
        } catch (error) {
          const message = `setup function failed: ${
            isNativeError(error) ? error.message : error
          }`;

          verbose2(message);
          throw new Error(message, { cause: error });
        }
      }

      let frameworkError: unknown;

      try {
        await frameworkTest(testConfig);
      } catch (error) {
        frameworkError = error;
        verbose2('caught framework test failure');
      } finally {
        for (const [index, teardownFn] of teardownFunctions.entries()) {
          verbose2(`running teardown function #${index + 1}`);

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

            verbose2(errorMessage);

            // eslint-disable-next-line no-unsafe-finally
            throw new Error(errorMessage, { cause: { error, frameworkError } });
          }
        }

        // ? Ensure we don't swallow any errors from frameworkTest
        if (frameworkError) {
          verbose2('rethrowing framework test failure');
          // eslint-disable-next-line no-unsafe-finally
          throw frameworkError;
        }
      }
    };
  }

  async function frameworkTest(
    testConfig: PluginTesterTestObjectConfig | PluginTesterTestFixtureConfig
  ) {
    const { debug: debug2, verbose: verbose2 } = getDebuggers('test', debug1);

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

    debug2(`test framework has triggered test "${testBlockTitle}"`);

    let errored = false;

    const rawBabelOutput = await (async () => {
      try {
        const transformer = babel.transformAsync || babel.transform;
        const parameters = [code ?? exec, babelOptions] as const;
        verbose2(
          `calling babel transform function (${transformer.name}) with parameters: %O`,
          parameters
        );
        return (await transformer(...parameters))?.code;
      } catch (error) {
        verbose2(`babel transformation failed with error: ${error}`);
        if (expectedError) {
          errored = true;
          return error;
        } else {
          throw error;
        }
      }
    })();

    try {
      if (expectedError) {
        debug2('expecting babel transform function to fail with error');
        assert(errored, 'expected babel to throw an error, but it did not');

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
        debug2('expecting babel transform function to succeed');
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
          debug2('executing output from babel transform function');

          assert(
            result.length > 0,
            'attempted to execute babel output but it was empty. An empty string cannot be evaluated'
          );

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
          debug2('expecting output from babel transform function to match snapshot');

          assert(
            result !== code,
            'code was unmodified but attempted to take a snapshot. If the code should not be modified, set `snapshot: false`'
          );

          const separator = '\n\n      ↓ ↓ ↓ ↓ ↓ ↓\n\n';
          const formattedOutput = [code, separator, result].join('');

          expect(`\n${formattedOutput}\n`).toMatchSnapshot(testBlockTitle.fullString);
        } else if (output !== undefined) {
          debug2(
            'expecting output from babel transform function to match expected output'
          );

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
          debug2('writing output from babel transform function to new output file');
          fs.writeFileSync(outputFixture, result);
        } else {
          debug2('expecting output from babel transform function to match input');
          assert.equal(
            result,
            trimAndFixLineEndings(code, endOfLine),
            'expected output not to change, but it did'
          );
        }
      }
    } catch (error) {
      verbose2(`test failed: ${error}`);
      throw error;
    }
  }

  function validateTestConfig<
    T extends MaybePluginTesterTestObjectConfig | MaybePluginTesterTestFixtureConfig
  >(
    testConfig: T,
    knownViolations?: {
      hasCodeAndCodeFixture: boolean;
      hasOutputAndOutputFixture: boolean;
      hasExecAndExecFixture: boolean;
    }
  ): // * See: https://stackoverflow.com/a/71741336/1367414
  // @ts-expect-error: encountering the limits of type inference as of 4.9.4
  asserts testConfig is T extends MaybePluginTesterTestObjectConfig
    ? PluginTesterTestObjectConfig
    : PluginTesterTestFixtureConfig {
    const { verbose: verbose2 } = getDebuggers('validate', debug1);
    verbose2('known violations: %O', knownViolations);

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

    if (knownViolations) {
      const { hasCodeAndCodeFixture, hasOutputAndOutputFixture, hasExecAndExecFixture } =
        knownViolations;

      if (hasCodeAndCodeFixture) {
        throwTypeError('`code` cannot be provided with `codeFixture`');
      }

      if (hasOutputAndOutputFixture) {
        throwTypeError('`output` cannot be provided with `outputFixture`');
      }

      if (hasExecAndExecFixture) {
        throwTypeError('`exec` cannot be provided with `execFixture`');
      }
    }

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
      const finalMessage = `failed to validate configuration for test "${testBlockTitle.fullString}": ${message}`;
      verbose2(finalMessage);
      throw new TypeError(finalMessage);
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
 * Take the dirname of `filepath` and join `basename` to it, creating an
 * absolute path. If `basename` is already absolute, it will be returned as is.
 * If either `basename` is falsy or `filepath` is falsy and `basename` is not
 * absolute, `undefined` is returned instead.
 */
function getAbsolutePathUsingFilepathDirname(filepath?: string, basename?: string) {
  return !basename
    ? undefined
    : path.isAbsolute(basename)
    ? basename
    : filepath
    ? path.join(path.dirname(filepath), basename)
    : undefined;
}

/**
 * Synchronously `require()` the first available options file within a fixture.
 * Any errors will be passed up to the calling function.
 */
function readFixtureOptions(baseDirectory: string) {
  const { verbose: verbose2 } = getDebuggers('read-opts', debug1);

  const optionsPath = [
    path.join(baseDirectory, 'options.js'),
    path.join(baseDirectory, 'options.json')
  ].find((p) => fs.existsSync(p));

  try {
    if (optionsPath) {
      verbose2(`requiring options file ${optionsPath}`);
      return require(optionsPath) as FixtureOptions;
    } else {
      verbose2('attempt to require options file ignored: no such file exists');
      return {};
    }
  } catch (error) {
    const message = `${isNativeError(error) ? error.message : error}`;
    verbose2(`attempt to require options file failed: ${message}`);
    throw new Error(
      // ? Some realms/runtimes don't include the failing path, so we make sure
      message.includes(optionsPath!) ? message : `${optionsPath}: ${message}`
    );
  }
}

/**
 * Synchronously read in the file at `filepath` after transforming the path into
 * an absolute path if it is not one already. If `filepath` is `undefined`,
 * `undefined` is returned.
 */
function readCode<T extends string | undefined>(filepath: T): T;
/**
 * Synchronously read in the file at the path created by taking the dirname of
 * `filepath` and joining `basename` to it, yielding an absolute path. If
 * `basename` is already an absolute path, it will be read in as-is. If either
 * `basename` is falsy or `filepath` is falsy and `basename` is not absolute,
 * `undefined` is returned instead.
 */
function readCode(
  filepath: string | undefined,
  basename: string | undefined
): string | undefined;
function readCode(filepath: string | undefined, basename?: string): string | undefined {
  const { verbose: verbose2 } = getDebuggers('read-code', debug1);

  const codePath =
    arguments.length == 1
      ? filepath
      : getAbsolutePathUsingFilepathDirname(filepath, basename);

  if (!codePath) {
    verbose2(
      `attempt to read in contents from file ignored: no absolute path derivable from filepath "${filepath}" and basename "${basename}"`
    );
    return undefined;
  }

  /* istanbul ignore next */
  if (!path.isAbsolute(codePath)) {
    const message = `"${codePath}" is not an absolute path`;
    verbose2(`attempt to read in contents from file failed: ${message}`);
    throw new Error(message);
  }

  try {
    verbose2(`reading in contents from file ${codePath}`);
    return fs.readFileSync(codePath, 'utf8');
  } catch (error) {
    const message = `${isNativeError(error) ? error.message : error}`;
    verbose2(`attempt to read in contents from file failed: ${message}`);
    // ? Some realms/runtimes don't include the failing path, so we make sure
    throw new Error(message.includes(codePath) ? message : `${codePath}: ${message}`);
  }
}

/**
 * Trim a string and normalize any line ending characters.
 */
function trimAndFixLineEndings(
  source: string,
  endOfLine: NonNullable<PluginTesterOptions['endOfLine']>,
  input = source
) {
  const { verbose: verbose2 } = getDebuggers('eol', debug1);
  source = source.trim();

  if (endOfLine === false) {
    verbose2('no EOL fix applied: EOL conversion disabled');
    return source;
  }

  verbose2(`applying EOL fix "${endOfLine}": all EOL will be replaced`);
  verbose2(
    'input (trimmed) with original EOL: %O',
    source.replaceAll('\r', '\\r').replaceAll('\n', '\\n')
  );

  const output = source.replaceAll(/\r?\n/g, getReplacement()).trim();

  verbose2(
    'output (trimmed) with EOL fix applied: %O',
    output.replaceAll('\r', '\\r').replaceAll('\n', '\\n')
  );

  return output;

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
        verbose2(`encountered invalid EOL option "${endOfLine}"`);
        throw new TypeError(
          `failed to validate configuration: invalid \`endOfLine\` option "${endOfLine}"`
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
  const { verbose: verbose2 } = getDebuggers('finalize', debug1);

  if (babelOptions?.plugins) {
    babelOptions.plugins = babelOptions.plugins.filter((p) => {
      const result = Boolean(p);

      if (!result) {
        verbose2('a falsy `babelOptions.plugins` item was filtered out');
      }

      return result;
    });

    if (babelOptions.plugins.includes(runPluginUnderTestHere)) {
      verbose2(
        'replacing `runPluginUnderTestHere` symbol in `babelOptions.plugins` with plugin under test'
      );

      babelOptions.plugins.splice(
        babelOptions.plugins.indexOf(runPluginUnderTestHere),
        1,
        babelOptions.plugins.pop()!
      );
    }
  }

  if (babelOptions?.presets) {
    babelOptions.presets = babelOptions.presets.filter((p) => {
      const result = Boolean(p);

      if (!result) {
        verbose2('a falsy `babelOptions.presets` item was filtered out');
      }

      return result;
    });

    if (babelOptions.presets.includes(runPresetUnderTestHere)) {
      verbose2(
        'replacing `runPresetUnderTestHere` symbol in `babelOptions.presets` with preset under test'
      );

      babelOptions.presets.splice(
        // ? -1 because we're shifting an element off the beginning afterwards
        babelOptions.presets.indexOf(runPresetUnderTestHere) - 1,
        1,
        babelOptions.presets.shift()!
      );
    }
  }

  verbose2('finalized test object plugin and preset run order');
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
