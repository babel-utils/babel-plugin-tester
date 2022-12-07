import { prettierFormatter } from './formatters/prettier';
import { unstringSnapshotSerializer } from './serializers/unstring-snapshot';
import { pluginTester } from './plugin-tester';

import type * as Babel from '@babel/core';
import type { Class, Promisable } from 'type-fest';

/* istanbul ignore else (it's not worth testing) */
if (typeof expect !== 'undefined' && expect.addSnapshotSerializer) {
  expect.addSnapshotSerializer(unstringSnapshotSerializer);
}

/**
 * A unique symbol that, when included in `babelOptions.plugins`, will be
 * replaced with the plugin under test. Use this symbol to create a custom
 * plugin run order.
 *
 * @see https://npm.im/babel-plugin-tester#custom-plugin-and-preset-run-order
 */
export const runPluginUnderTestHere: unique symbol = Symbol('run-plugin-under-test-here');

export {
  prettierFormatter,
  unstringSnapshotSerializer,
  defaultPluginTester as pluginTester
};

export default function defaultPluginTester(options?: PluginTesterOptions) {
  return pluginTester({ formatResult: prettierFormatter, ...options });
}

/**
 * The shape of the Babel API.
 *
 * @see https://npm.im/babel-plugin-tester#babel
 */
export type BabelType = typeof Babel;

/**
 * The shape of a `throws` (or `error`) test object or fixture option.
 *
 * @see https://npm.im/babel-plugin-tester#throws
 */
export type ErrorExpectation =
  | boolean
  | string
  | RegExp
  | Error
  | Class<Error>
  | ((error: unknown) => boolean);

/**
 * The shape of a `setup` test object or fixture option.
 *
 * @see https://npm.im/babel-plugin-tester#setup
 */
export type SetupFunction = () => Promisable<void | TeardownFunction>;

/**
 * The shape of a `teardown` test object or fixture option.
 *
 * @see https://npm.im/babel-plugin-tester#teardown
 */
export type TeardownFunction = () => Promisable<void>;

/**
 * Options passed as parameters to the `pluginTester` function.
 *
 * @see https://npm.im/babel-plugin-tester#options
 */
export interface PluginTesterOptions extends FixtureOptions, TestObject {
  /**
   * This is used to provide the babel plugin under test.
   *
   * @see https://npm.im/babel-plugin-tester#plugin
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugin?: (...args: any[]) => Babel.PluginObj<any>;
  /**
   * This is used as the describe block name and in your tests' names. If
   * `pluginName` can be inferred from the `plugin`'s name, then it will be and
   * you don't need to provide this option. If it cannot be inferred for
   * whatever reason, `pluginName` defaults to `"unknown plugin"`.
   *
   * Note that there is a small caveat when relying on `pluginName` inference.
   *
   * @see https://npm.im/babel-plugin-tester#pluginName
   */
  pluginName?: string;
  /**
   * This is used to pass options into your plugin at transform time. This
   * option can be overwritten in a test object or fixture options.
   *
   * @see https://npm.im/babel-plugin-tester#pluginOptions
   */
  pluginOptions?: Babel.PluginOptions;
  /**
   * This is used to provide the babel preset under test.
   *
   * @see https://npm.im/babel-plugin-tester#preset
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  preset?: (...args: any[]) => Babel.TransformOptions;
  /**
   * This is used as the describe block name and in your tests' names. Defaults
   * to `"unknown preset"`.
   *
   * @see https://npm.im/babel-plugin-tester#presetName
   */
  presetName?: string;
  /**
   * This is used to pass options into your preset at transform time. This
   * option can be overwritten using test object properties or fixture options.
   *
   * @see https://npm.im/babel-plugin-tester#presetOptions
   */
  presetOptions?: Babel.PluginOptions;
  /**
   * This is used to provide your own implementation of babel. This is
   * particularly useful if you want to use a different version of babel than
   * what's included in this package.
   *
   * @see https://npm.im/babel-plugin-tester#babel
   */
  babel?: {
    transform: BabelType['transform'];
    transformAsync?: BabelType['transformAsync'];
  };
  /**
   * This is used to configure babel. If provided, the object will be
   * `lodash.mergewith`'d with the defaults and each test's test object/fixture
   * options.
   *
   * Note that `babelOptions.babelrc` and `babelOptions.configFile` are set to
   * `false` by default, which disables automatic babel configuration loading.
   *
   * @see https://npm.im/babel-plugin-tester#babelOptions
   */
  babelOptions?: Omit<Babel.TransformOptions, 'plugins'> & {
    plugins?:
      | (
          | NonNullable<Babel.TransformOptions['plugins']>[number]
          | typeof runPluginUnderTestHere
        )[]
      | null;
  };
  /**
   * This is used to specify a custom title for the describe block (overriding
   * everything else).
   *
   * @see https://npm.im/babel-plugin-tester#title
   */
  title?: string;
  /**
   * This is used to resolve relative paths provided by the `fixtures` option
   * and the two test object properties `fixture` and `outputFixture`. If these
   * are not absolute paths, they will be `path.join`'d with the directory name
   * of `filepath`.
   *
   * `filepath` is also passed to `formatResult` (fixture option) and
   * `formatResult` (test object property).
   *
   * Defaults to the absolute path of the file that invoked the `pluginTester`
   * function.
   *
   * For backwards compatibility reasons, `filepath` is synonymous with
   * `filename`. They can be used interchangeably, though care must be taken not
   * to confuse `options.filename` with `babelOptions.filename`. They are NOT
   * the same!
   *
   * @see https://npm.im/babel-plugin-tester#filepath
   */
  filepath?: string;
  /**
   * @deprecated Use `filepath` instead.
   * @see https://npm.im/babel-plugin-tester#filepath
   */
  filename?: string;
  /**
   * This is used to control which line endings the output from babel should
   * have.
   *
   * | Options    | Description                        |
   * | ---------- | ---------------------------------- |
   * | `lf`       | Unix - default                     |
   * | `crlf`     | Windows                            |
   * | `auto`     | Use the system default             |
   * | `preserve` | Use the line ending from the input |
   *
   * @see https://npm.im/babel-plugin-tester#endOfLine
   */
  endOfLine?: 'lf' | 'crlf' | 'auto' | 'preserve';
  /**
   * There are two ways to create tests: using the `tests` option to provide one
   * or more test objects or using this `fixtures` option. Both can be used
   * simultaneously.
   *
   * @see https://npm.im/babel-plugin-tester#fixtures
   */
  fixtures?: string;
  /**
   * There are two ways to create tests: using the `fixtures` option that
   * leverages the filesystem or using this `tests` option. Both can be used
   * simultaneously.
   *
   * @see https://npm.im/babel-plugin-tester#tests
   */
  tests?: (TestObject | string)[] | Record<string, TestObject | string>;
}

/**
 * Options provided as properties of an `options.json` file, or returned by an
 * `options.js` file, for use with fixtures specified by the `fixtures` option.
 *
 * @see https://npm.im/babel-plugin-tester#fixtures
 */
export interface FixtureOptions {
  /**
   * This is used to configure babel, overriding the `babelOptions` provided as
   * an option to babel-plugin-tester.
   *
   * @see https://npm.im/babel-plugin-tester#babelOptions-1
   */
  babelOptions?: PluginTesterOptions['babelOptions'];
  /**
   * This is used to pass options into your plugin at transform time, overriding
   * the `pluginOptions` provided as an option to babel-plugin-tester.
   *
   * @see https://npm.im/babel-plugin-tester#pluginOptions-1
   */
  pluginOptions?: PluginTesterOptions['pluginOptions'];
  /**
   * Use this to provide your own fixture output file name. Defaults to
   * `output`.
   *
   * @see https://npm.im/babel-plugin-tester#fixtureOutputName
   */
  fixtureOutputName?: string;
  /**
   * Use this to provide your own fixture output file extension. This is
   * particularly useful if you are testing TypeScript input. If omitted, the
   * fixture's input file extension will be used instead. Defaults to `.js`.
   *
   * @see https://npm.im/babel-plugin-tester#fixtureOutputExt
   */
  fixtureOutputExt?: string;
  /**
   * Use this to run only the specified fixture. Useful while developing to help
   * focus on a small number of fixtures. Can be used in multiple `options.json`
   * files.
   *
   * @see https://npm.im/babel-plugin-tester#only
   */
  only?: boolean;
  /**
   * Use this to skip running the specified fixture. Useful for when you're
   * working on a feature that is not yet supported. Can be used in multiple
   * `options.json` files.
   *
   * @see https://npm.im/babel-plugin-tester#skip
   */
  skip?: boolean;
  /**
   * If provided, this will be used as the title of the test (overriding the
   * directory name).
   *
   * @see https://npm.im/babel-plugin-tester#title
   */
  title?: string;
  /**
   * Use this to assert that a particular `code.js` file should be throwing an
   * error during transformation. For example:
   *
   * ```JavaScript
   * {
   *   // ...
   *   throws: true,
   *   throws: 'should have this exact message',
   *   throws: /should pass this regex/,
   *   throws: SyntaxError, // Should be instance of this constructor
   *   throws: err => {
   *     if (err instanceof SyntaxError && /message/.test(err.message)) {
   *       return true; // Test will fail if this function doesn't return `true`
   *     }
   *   },
   * }
   * ```
   *
   * When using certain values, this option must be used in `options.js` instead
   * of `options.json`. Also, note that this property is ignored when using an
   * `exec.js` file.
   *
   * For backwards compatibility reasons, `error` is synonymous with `throws`.
   * They can be used interchangeably.
   *
   * @see https://npm.im/babel-plugin-tester#throws
   */
  throws?: ErrorExpectation;
  /**
   * Use this to assert that a particular `code.js` file should be throwing an
   * error during transformation. For example:
   *
   * ```JavaScript
   * {
   *   // ...
   *   throws: true,
   *   throws: 'should have this exact message',
   *   throws: /should pass this regex/,
   *   throws: SyntaxError, // Should be instance of this constructor
   *   throws: err => {
   *     if (err instanceof SyntaxError && /message/.test(err.message)) {
   *       return true; // Test will fail if this function doesn't return `true`
   *     }
   *   },
   * }
   * ```
   *
   * When using certain values, this option must be used in `options.js` instead
   * of `options.json`. Also, note that this property is ignored when using an
   * `exec.js` file.
   *
   * For backwards compatibility reasons, `error` is synonymous with `throws`.
   * They can be used interchangeably.
   *
   * @see https://npm.im/babel-plugin-tester#throws
   */
  error?: ErrorExpectation;
  /**
   * If you need something set up before a particular fixture's tests are run,
   * you can do this with `setup`. This function will be run before the fixture
   * runs. It can return a function which will be treated as a `teardown`
   * function. It can also return a promise. If that promise resolves to a
   * function, that will be treated as a `teardown` function.
   *
   * As it requires a function value, this option must be used in `options.js`
   * instead of `options.json`.
   *
   * @see https://npm.im/babel-plugin-tester#setup
   */
  setup?: SetupFunction;
  /**
   * If you set up some state, it's quite possible you want to tear it down. Use
   * this function to clean up after a fixture's tests finish running. You can
   * either define this as its own property, or you can return it from the
   * `setup` function. This can likewise return a promise if it's asynchronous.
   *
   * As it requires a function value, this option must be used in `options.js`
   * instead of `options.json`.
   *
   * @see https://npm.im/babel-plugin-tester#teardown
   */
  teardown?: TeardownFunction;
  /**
   * This defaults to a function which formats your code output with prettier.
   * If you have prettier configured, then it will use your configuration. If
   * you don't then it will use default configuration.
   *
   * If you'd like to specify your own, then feel free to do so.
   *
   * As it requires a function value, this option must be used in `options.js`
   * instead of `options.json`.
   *
   * @see https://npm.im/babel-plugin-tester#formatResult
   */
  formatResult?: ResultFormatter;
}

/**
 * Options provided as properties of a test object for use with the `tests`
 * option.
 *
 * @see https://npm.im/babel-plugin-tester#test-objects
 */
export interface TestObject {
  /**
   * This is used to configure babel, overriding the `babelOptions` provided as
   * an option to babel-plugin-tester.
   *
   * @see https://npm.im/babel-plugin-tester#babelOptions-2
   */
  babelOptions?: PluginTesterOptions['babelOptions'];
  /**
   * This is used to pass options into your plugin at transform time, overriding
   * the `pluginOptions` provided as an option to babel-plugin-tester.
   *
   * @see https://npm.im/babel-plugin-tester#pluginOptions-2
   */
  pluginOptions?: PluginTesterOptions['pluginOptions'];
  /**
   * Use this to run only the specified test. Useful while developing to help
   * focus on a small number of tests. Can be used on multiple tests.
   *
   * @see https://npm.im/babel-plugin-tester#only-1
   */
  only?: boolean;
  /**
   * Use this to skip running the specified test. Useful for when you're working
   * on a feature that is not yet supported. Can be used on multiple tests.
   *
   * @see https://npm.im/babel-plugin-tester#skip-1
   */
  skip?: boolean;
  /**
   * If provided, this will be used as the title of the test (overriding
   * everything else).
   *
   * @see https://npm.im/babel-plugin-tester#title-1
   */
  title?: string;
  /**
   * The code that you want to run through your plugin or preset. This must be
   * provided unless you're using the `fixture` or `exec` properties instead. If
   * you do not provide the `output` or `outputFixture` properties and
   * `snapshot` is not `true`, then the assertion is that this code is unchanged
   * by the transformation.
   *
   * @see https://npm.im/babel-plugin-tester#code
   */
  code?: string;
  /**
   * If provided, the result of the transformation will be compared with this
   * output for the assertion. It will have any indentation stripped and will be
   * trimmed as a convenience for template literals.
   *
   * @see https://npm.im/babel-plugin-tester#output
   */
  output?: string;
  /**
   * If you'd rather put your `code` in a separate file, you can specify a file
   * name here instead. If it's an absolute path, then that's the file that will
   * be loaded. Otherwise, `fixture` will be `path.join`'d with the directory
   * name of `filepath`.
   *
   * If you find you're using this option more than a couple of times, consider
   * using _`fixtures`_ instead.
   *
   * @see https://npm.im/babel-plugin-tester#fixture
   */
  fixture?: string;
  /**
   * If you'd rather put your `output` in a separate file, you can specify a
   * file name here instead. If it's an absolute path, then that's the file that
   * will be loaded. Otherwise, `outputFixture` will be `path.join`'d with the
   * directory name of `filepath`.
   *
   * If you find you're using this option more than a couple of times, consider
   * using _`fixtures`_ instead.
   *
   * @see https://npm.im/babel-plugin-tester#outputFixture
   */
  outputFixture?: string;
  /**
   * The provided source will be transformed just like the `code` property,
   * except the output will be _evaluated_ in the same context as the the test
   * runner itself, meaning it has access to `expect`, `require`, etc. Use this
   * to make advanced assertions on the output.
   *
   * @see https://npm.im/babel-plugin-tester#exec
   */
  exec?: string;
  /**
   * If you'd prefer to take a snapshot of your output rather than compare it to
   * something you hard-code, then specify `snapshot: true`. This will take a
   * snapshot with both the source code and the output, making the snapshot
   * easier to understand.
   *
   * @see https://npm.im/babel-plugin-tester#snapshot
   */
  snapshot?: boolean;
  /**
   * If a particular test case should be throwing an error, you can test that
   * using one of the following:
   *
   * ```JavaScript
   * {
   *   // ...
   *   throws: true,
   *   throws: 'should have this exact message',
   *   throws: /should pass this regex/,
   *   throws: SyntaxError, // Should be instance of this constructor
   *   throws: err => {
   *     if (err instanceof SyntaxError && /message/.test(err.message)) {
   *       return true; // Test will fail if this function doesn't return `true`
   *     }
   *   },
   * }
   * ```
   *
   * For backwards compatibility reasons, `error` is synonymous with `throws`.
   * They can be used interchangeably.
   *
   * Note that this property is ignored when using the `exec` property.
   *
   * @see https://npm.im/babel-plugin-tester#throws-1
   */
  throws?: ErrorExpectation;
  /**
   * If a particular test case should be throwing an error, you can test that
   * using one of the following:
   *
   * ```JavaScript
   * {
   *   // ...
   *   throws: true,
   *   throws: 'should have this exact message',
   *   throws: /should pass this regex/,
   *   throws: SyntaxError, // Should be instance of this constructor
   *   throws: err => {
   *     if (err instanceof SyntaxError && /message/.test(err.message)) {
   *       return true; // Test will fail if this function doesn't return `true`
   *     }
   *   },
   * }
   * ```
   *
   * For backwards compatibility reasons, `error` is synonymous with `throws`.
   * They can be used interchangeably.
   *
   * Note that this property is ignored when using the `exec` property.
   *
   * @see https://npm.im/babel-plugin-tester#throws-1
   */
  error?: ErrorExpectation;
  /**
   * If you need something set up before a particular test is run, you can do
   * this with `setup`. This function will be run before the test runs. It can
   * return a function which will be treated as a `teardown` function. It can
   * also return a promise. If that promise resolves to a function, that will be
   * treated as a `teardown` function.
   *
   * @see https://npm.im/babel-plugin-tester#setup-1
   */
  setup?: SetupFunction;
  /**
   * If you set up some state, it's quite possible you want to tear it down. Use
   * this function to clean up after a test finishes running. You can either
   * define this as its own property, or you can return it from the `setup`
   * function. This can likewise return a promise if it's asynchronous.
   *
   * @see https://npm.im/babel-plugin-tester#teardown-1
   */
  teardown?: TeardownFunction;
  /**
   * This defaults to a function which formats your code output with prettier.
   * If you have prettier configured, then it will use your configuration. If
   * you don't then it will use default configuration.
   *
   * If you'd like to specify your own, then feel free to do so.
   *
   * @see https://npm.im/babel-plugin-tester#formatResult-1
   */
  formatResult?: ResultFormatter;
}

/**
 * The shape of a code formatter used to normalize the results of a babel
 * transformation.
 *
 * @see https://npm.im/babel-plugin-tester#prettier-formatter
 */
export type ResultFormatter<
  AdditionalOptions extends Record<string, unknown> = Record<string, unknown>
> = (
  /**
   * The result of a babel transformation that should be formatted.
   */
  code: string,
  /**
   * Options expected by the ResultFormatter interface.
   */
  options?: {
    /**
     * A directory path used to generate a default value for `filepath`. There
     * is no need to provide a `cwd` if you provide a `filepath` explicitly.
     *
     * Note that this path may not actually exist.
     */
    cwd?: string;
    /**
     * A path representing the file containing the original source that was
     * transformed into `code` by babel.
     *
     * Note that this file may not actually exist and, even if it does, it may
     * not contain the original source of `code`.
     */
    filepath?: string;
    /**
     * @deprecated Use `filepath` instead.
     */
    filename?: string;
  } & Partial<AdditionalOptions>
) => string;

// * The transitive dependency "pretty-format" is a dependency of Jest
export type { Plugin as SnapshotSerializer } from 'pretty-format';
