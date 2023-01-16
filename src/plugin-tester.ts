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
import { ErrorMessage } from './errors';
import { prettierFormatter } from './formatters/prettier';
import { unstringSnapshotSerializer } from './serializers/unstring-snapshot';

import type {
  Range,
  ResultFormatter,
  PluginTesterOptions,
  TestObject,
  FixtureOptions,
  PluginTesterBaseConfig,
  PluginTesterTestConfig,
  PluginTesterTestDescribeConfig,
  PluginTesterTestFixtureConfig,
  PluginTesterTestObjectConfig,
  MaybePluginTesterTestObjectConfig,
  MaybePluginTesterTestFixtureConfig,
  PartialPluginTesterBaseConfig
} from './types';

import type { Class } from 'type-fest';

const parseErrorStackRegExp =
  /at (?<fn>\S+) (?:.*? )?\(?(?<path>(?:\/|file:|\w:\\).*?)(?:\)|$)/i;

const parseScriptFilepathRegExp =
  /(\/|\\)babel-plugin-tester(\/|\\)(dist|src)(\/|\\)(index|plugin-tester)\.(j|t)s$/;

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

/**
 * A unique symbol that, when included in `babelOptions.plugins`, will be
 * replaced with the plugin under test. Use this symbol to create a custom
 * plugin run order.
 *
 * @see https://npm.im/babel-plugin-tester#custom-plugin-and-preset-run-order
 */
const runPluginUnderTestHere: unique symbol = Symbol('run-plugin-under-test-here');

/**
 * A unique symbol that, when included in `babelOptions.presets`, will be
 * replaced with the preset under test. Use this symbol to create a custom
 * preset run order.
 *
 * @see https://npm.im/babel-plugin-tester#custom-plugin-and-preset-run-order
 */
const runPresetUnderTestHere: unique symbol = Symbol('run-preset-under-test-here');

/**
 * Valid choices for the `titleNumbering` babel-plugin-tester option.
 */
const validTitleNumberingValues = ['all', 'tests-only', 'fixtures-only', false] as const;

/**
 * Valid choices for the `endOfLine` babel-plugin-tester option.
 */
const validEndOfLineValues = ['lf', 'crlf', 'auto', 'preserve', false] as const;

/**
 * Internal current test counter. Used for automatic title numbering via the
 * `titleNumbering` and `restartTitleNumbering` babel-plugin-tester options.
 */
let currentTestNumber = 1;

/**
 * This function has the same effect as calling `pluginTester` with
 * `restartTitleNumbering: true`.
 */
function restartTestTitleNumbering() {
  debug1('restarted title numbering');
  currentTestNumber = 1;
}

/**
 * An abstraction around babel to help you write tests for your babel plugin or
 * preset.
 */
function pluginTester(options: PluginTesterOptions = {}) {
  debug1('executing main babel-plugin-tester function');

  const globalContextHasExpectFn = 'expect' in globalThis && typeof expect == 'function';
  const globalContextHasTestFn = 'it' in globalThis && typeof it == 'function';

  const globalContextHasDescribeFn =
    'describe' in globalThis && typeof describe == 'function';

  const globalContextExpectFnHasToMatchSnapshot = (() => {
    try {
      return globalContextHasExpectFn
    ? typeof expect(undefined)?.toMatchSnapshot == 'function'
    : false;
    } catch {
      /* istanbul ignore next */
      return false;
    }
  })();

  const globalContextTestFnHasSkip = globalContextHasTestFn
    ? typeof it.skip == 'function'
    : false;

  const globalContextTestFnHasOnly = globalContextHasTestFn
    ? typeof it.only == 'function'
    : false;

  if (!globalContextHasDescribeFn) {
    throw new TypeError(ErrorMessage.TestEnvironmentUndefinedDescribe());
  }

  if (!globalContextHasTestFn) {
    throw new TypeError(ErrorMessage.TestEnvironmentUndefinedIt());
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
      throw new TypeError(ErrorMessage.BadConfigPluginAndPreset());
    }

    if (!validTitleNumberingValues.includes(rawBaseConfig.titleNumbering)) {
      throw new TypeError(ErrorMessage.BadConfigInvalidTitleNumbering());
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
      throw new TypeError(ErrorMessage.BadConfigFixturesNotString());
    }

    if (
      baseConfig.tests !== undefined &&
      !Array.isArray(baseConfig.tests) &&
      (!baseConfig.tests || typeof baseConfig.tests != 'object')
    ) {
      throw new TypeError(ErrorMessage.BadConfigInvalidTestsType());
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
            throw new TypeError(ErrorMessage.BadConfigInvalidTestsArrayItemType(ndx));
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
                ErrorMessage.BadConfigInvalidTestsObjectProperty(title)
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
      throw new TypeError(ErrorMessage.BadConfigNoPluginOrPreset());
    }

    baseConfig.describeBlockTitle =
      rawBaseConfig.title === false
        ? false
        : rawBaseConfig.title ||
          baseConfig.pluginName ||
          baseConfig.presetName ||
          /* istanbul ignore next */
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
            .filter(<T>(o: T): o is NonNullable<T> => Boolean(o)) ||
          /* istanbul ignore next */ []
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
              functionName == 'pluginTester' &&
              /* istanbul ignore next */ parseScriptFilepathRegExp.test(filePath)
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
              const range = { start, end };

              if (start > end) {
                throw new TypeError(
                  ErrorMessage.BadEnvironmentVariableRange(name, s, range)
                );
              } else if (start == end) {
                return start;
              }

              return range;
            }

            throw new TypeError(ErrorMessage.BadEnvironmentVariableRange(name, s));
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
    } else if (typeof fixtures == 'string') {
      throw new TypeError(
        ErrorMessage.UnableToDeriveAbsolutePath(
          filepath,
          '`filepath`',
          fixtures,
          '`fixtures`'
        )
      );
    } else {
      debug2('skipped loading fixtures: no fixtures path provided');
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
    } else {
      debug2(
        'skipped loading test objects from tests: no tests object or array provided'
      );
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

      /* istanbul ignore next */
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
          const exec = readCode(execPath);

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
                // ? It is impossible for the following to be undefined
                filename: (codePath || execPath) as string,
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
              testSetup: setup || /* istanbul ignore next */ noop,
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
          testSetup: setup || /* istanbul ignore next */ noop,
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
        verbose2(
          `running setup function #${index + 1}${setupFn === noop ? ' (noop)' : ''}`
        );

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
          const message = ErrorMessage.SetupFunctionFailed(error);
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
          verbose2(
            `running teardown function #${index + 1}${
              teardownFn === noop ? ' (noop)' : ''
            }`
          );

          try {
            // eslint-disable-next-line no-await-in-loop
            await teardownFn();
          } catch (error) {
            // ? Ensure we don't swallow any errors from frameworkTest
            const message = ErrorMessage.TeardownFunctionFailed(error, frameworkError);
            verbose2(message);
            // eslint-disable-next-line no-unsafe-finally
            throw new Error(message, { cause: { error, frameworkError } });
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

    debug2(`test framework has triggered test "${testBlockTitle.fullString}"`);

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
        assert(errored, ErrorMessage.ExpectedBabelToThrow());

        if (typeof expectedError === 'function') {
          if (expectedError === Error || expectedError.prototype instanceof Error) {
            assert(
              rawBabelOutput instanceof expectedError,
              ErrorMessage.ExpectedErrorToBeInstanceOf(expectedError)
            );
          } else if (
            (expectedError as Exclude<typeof expectedError, Class<Error>>)(
              rawBabelOutput
            ) !== true
          ) {
            assert.fail(ErrorMessage.ExpectedThrowsFunctionToReturnTrue());
          }
        } else {
          const resultString = isNativeError(rawBabelOutput)
            ? rawBabelOutput.message
            : String(rawBabelOutput);

          if (typeof expectedError === 'string') {
            assert(
              resultString.includes(expectedError),
              ErrorMessage.ExpectedErrorToIncludeString(resultString, expectedError)
            );
          } else if (expectedError instanceof RegExp) {
            assert(
              expectedError.test(resultString),
              ErrorMessage.ExpectedErrorToMatchRegExp(resultString, expectedError)
            );
          } // ? Else condition is handled by the typeof === 'function' branch
        }
      } else if (typeof rawBabelOutput !== 'string') {
        throw new TypeError(ErrorMessage.BabelOutputTypeIsNotString(rawBabelOutput));
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

          assert(result.length > 0, ErrorMessage.BabelOutputUnexpectedlyEmpty());

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
            ErrorMessage.AttemptedToSnapshotUnmodifiedBabelOutput()
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
            ErrorMessage.ExpectedOutputToEqualActual(testConfig)
          );
        } else if (testConfig[$type] == 'fixture-object' && outputFixture) {
          debug2('writing output from babel transform function to new output file');
          fs.writeFileSync(outputFixture, result);
        } else {
          debug2('expecting output from babel transform function to match input');
          assert.equal(
            result,
            trimAndFixLineEndings(code, endOfLine),
            ErrorMessage.ExpectedOutputNotToChange()
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
        throwTypeErrorWithDebugOutput(ErrorMessage.InvalidHasCodeAndCodeFixture());
      }

      if (hasOutputAndOutputFixture) {
        throwTypeErrorWithDebugOutput(ErrorMessage.InvalidHasOutputAndOutputFixture());
      }

      if (hasExecAndExecFixture) {
        throwTypeErrorWithDebugOutput(ErrorMessage.InvalidHasExecAndExecFixture());
      }
    }

    if (testConfig[$type] == 'test-object' && testConfig.snapshot) {
      if (!globalContextExpectFnHasToMatchSnapshot) {
        throwTypeErrorWithDebugOutput(ErrorMessage.TestEnvironmentNoSnapshotSupport());
      }

      if (output !== undefined) {
        throwTypeErrorWithDebugOutput(ErrorMessage.InvalidHasSnapshotAndOutput());
      }

      if (exec !== undefined) {
        throwTypeErrorWithDebugOutput(ErrorMessage.InvalidHasSnapshotAndExec());
      }

      if (expectedError !== undefined) {
        throwTypeErrorWithDebugOutput(ErrorMessage.InvalidHasSnapshotAndThrows());
      }
    }

    if (skip && only) {
      throwTypeErrorWithDebugOutput(ErrorMessage.InvalidHasSkipAndOnly());
    }

    if (skip && !globalContextTestFnHasSkip) {
      throwTypeErrorWithDebugOutput(ErrorMessage.TestEnvironmentNoSkipSupport());
    }

    if (only && !globalContextTestFnHasOnly) {
      throwTypeErrorWithDebugOutput(ErrorMessage.TestEnvironmentNoOnlySupport());
    }

    if (output !== undefined && expectedError !== undefined) {
      throwTypeErrorWithDebugOutput(ErrorMessage.InvalidHasThrowsAndOutput(testConfig));
    }

    if (exec !== undefined && expectedError !== undefined) {
      throwTypeErrorWithDebugOutput(ErrorMessage.InvalidHasThrowsAndExec(testConfig));
    }

    if (code === undefined && exec === undefined) {
      throwTypeErrorWithDebugOutput(ErrorMessage.InvalidMissingCodeOrExec(testConfig));
    }

    if ((code !== undefined || output !== undefined) && exec !== undefined) {
      throwTypeErrorWithDebugOutput(
        ErrorMessage.InvalidHasExecAndCodeOrOutput(testConfig)
      );
    }

    if (babelOptions.babelrc && !babelOptions.filename) {
      throwTypeErrorWithDebugOutput(ErrorMessage.InvalidHasBabelrcButNoFilename());
    }

    if (
      expectedError !== undefined &&
      !(
        ['function', 'boolean', 'string'].includes(typeof expectedError) ||
        expectedError instanceof RegExp
      )
    ) {
      throwTypeErrorWithDebugOutput(ErrorMessage.InvalidThrowsType());
    }

    function throwTypeErrorWithDebugOutput(message: string): never {
      const finalMessage = ErrorMessage.ValidationFailed(
        testBlockTitle.fullString,
        message
      );

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
  const { verbose: verbose2 } = getDebuggers('to-abs-path', debug1);

  const result = !basename
    ? undefined
    : path.isAbsolute(basename)
    ? basename
    : filepath
    ? path.join(path.dirname(filepath), basename)
    : undefined;

  verbose2(`dirname(${filepath}) + ${basename} => ${result}`);
  return result;
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
    const message = ErrorMessage.GenericErrorWithPath(error, optionsPath);
    verbose2(`attempt to require options file failed: ${message}`);
    throw new Error(message);
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
    const message = ErrorMessage.PathIsNotAbsolute(codePath);
    verbose2(`attempt to read in contents from file failed: ${message}`);
    throw new Error(message);
  }

  try {
    verbose2(`reading in contents from file ${codePath}`);
    return fs.readFileSync(codePath, 'utf8');
  } catch (error) {
    const message = ErrorMessage.GenericErrorWithPath(error, codePath);
    verbose2(`attempt to read in contents from file failed: ${message}`);
    throw new Error(message);
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
        throw new TypeError(ErrorMessage.BadConfigInvalidEndOfLine(endOfLine));
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

      /* istanbul ignore next */
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

      /* istanbul ignore next */
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

export {
  pluginTester as default,
  pluginTester,
  restartTestTitleNumbering,
  prettierFormatter,
  unstringSnapshotSerializer,
  runPluginUnderTestHere,
  runPresetUnderTestHere,
  validTitleNumberingValues,
  validEndOfLineValues
};

export * from './types';

// ? What follows is some not-so-pretty interop for backwards compatible require
// ? calls using the old CJS default import syntax. In the next major version of
// ? babel-plugin-tester, all default exports will be removed entirely.
pluginTester.default = pluginTester;
pluginTester.pluginTester = pluginTester;
pluginTester.restartTestTitleNumbering = restartTestTitleNumbering;
pluginTester.prettierFormatter = prettierFormatter;
pluginTester.unstringSnapshotSerializer = unstringSnapshotSerializer;
pluginTester.runPluginUnderTestHere = runPluginUnderTestHere;
pluginTester.runPresetUnderTestHere = runPresetUnderTestHere;
pluginTester.validTitleNumberingValues = validTitleNumberingValues;
pluginTester.validEndOfLineValues = validEndOfLineValues;
module.exports = pluginTester;
