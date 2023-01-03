import { prettierFormatter } from './formatters/prettier';
import { unstringSnapshotSerializer } from './serializers/unstring-snapshot';
import { pluginTester } from './plugin-tester';

import type * as Babel from '@babel/core';
import type { Class, Promisable } from 'type-fest';
import type { $type } from './symbols';

if ('expect' in globalThis && typeof expect?.addSnapshotSerializer == 'function') {
  // TODO: debug statement here
  expect.addSnapshotSerializer(unstringSnapshotSerializer);
} else {
  // TODO: debug statement here
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

/**
 * An abstraction around babel to help you write tests for your babel plugin or
 * preset. It was built to work with Jest, but most of the functionality should
 * work with Mocha, Jasmine, and any other framework that defines standard
 * `describe` and `it` globals with async support.
 */
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
export interface PluginTesterOptions {
  /**
   * This is a `pluginTester` option used to provide the babel plugin under
   * test.
   *
   * @see https://npm.im/babel-plugin-tester#plugin
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugin?: (...args: any[]) => Babel.PluginObj<any>;
  /**
   * This is a `pluginTester` option used as the describe block name and in your
   * tests' names. If `pluginName` can be inferred from the `plugin`'s name,
   * then it will be and you don't need to provide this option. If it cannot be
   * inferred for whatever reason, `pluginName` defaults to `"unknown plugin"`.
   *
   * @see https://npm.im/babel-plugin-tester#pluginName
   */
  pluginName?: string;
  /**
   * This is a `pluginTester` option used to pass options into your plugin at
   * transform time. This option can be overwritten in a test object or fixture
   * options.
   *
   * @see https://npm.im/babel-plugin-tester#pluginOptions
   */
  pluginOptions?: Babel.PluginOptions;
  /**
   * This is a `pluginTester` option used to provide the babel preset under
   * test.
   *
   * @see https://npm.im/babel-plugin-tester#preset
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  preset?: (...args: any[]) => Babel.TransformOptions;
  /**
   * This is a `pluginTester` option used as the describe block name and in your
   * tests' names. Defaults to `"unknown preset"`.
   *
   * @see https://npm.im/babel-plugin-tester#presetName
   * @default "unknown preset"
   */
  presetName?: string;
  /**
   * This is a `pluginTester` option used to pass options into your preset at
   * transform time. This option can be overwritten using test object properties
   * or fixture options.
   *
   * @see https://npm.im/babel-plugin-tester#presetOptions
   */
  presetOptions?: Babel.PluginOptions;
  /**
   * This is a `pluginTester` option used to provide your own implementation of
   * babel. This is particularly useful if you want to use a different version
   * of babel than what's included in this package.
   *
   * @see https://npm.im/babel-plugin-tester#babel
   */
  babel?: {
    transform: BabelType['transform'];
    transformAsync?: BabelType['transformAsync'];
  };
  /**
   * This is a `pluginTester` option used to configure babel.
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
   * This is a `pluginTester` option used to specify a custom title for the
   * describe block (overriding everything else). Set to `false` to prevent the
   * creation of such an enclosing describe block. Otherwise, the title defaults
   * to `pluginName`.
   *
   * @see https://npm.im/babel-plugin-tester#title
   */
  title?: string | false;
  /**
   * This is a `pluginTester` option used to resolve relative paths provided by
   * the `fixtures` option and the two test object properties `codeFixture` and
   * `outputFixture`. If these are not absolute paths, they will be
   * `path.join`'d with the directory name of `filepath`.
   *
   * `filepath` is also passed to `formatResult` (fixture option) and
   * `formatResult` (test object property).
   *
   * Defaults to the absolute path of the file that invoked the `pluginTester`
   * function.
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
   * This is a `pluginTester` option used to control which line endings both the
   * actual output from babel and the expected output will be converted to.
   * Defaults to `"lf"`.
   *
   * | Options      | Description                             |
   * | ------------ | --------------------------------------- |
   * | `"lf"`       | Unix                                    |
   * | `"crlf"`     | Windows                                 |
   * | `"auto"`     | Use the system default                  |
   * | `"preserve"` | Use the line ending from the input      |
   * | `false`      | Disable line ending conversion entirely |
   *
   * @default "lf"
   * @see https://npm.im/babel-plugin-tester#endOfLine
   */
  endOfLine?: 'lf' | 'crlf' | 'auto' | 'preserve' | false;
  /**
   * This is a `pluginTester` option to provide a setup function run before each
   * test runs. It can return a function which will be treated as a `teardown`
   * function. It can also return a promise. If that promise resolves to a
   * function, that will be treated as a `teardown` function.
   *
   * @see https://npm.im/babel-plugin-tester#setup
   */
  setup?: SetupFunction;
  /**
   * This is a `pluginTester` option to provide a teardown function run after
   * each test runs. Use this function to clean up after tests finish running.
   * You can either define this as its own property, or you can return it from
   * the `setup` function. This can likewise return a promise if it's
   * asynchronous.
   *
   * @see https://npm.im/babel-plugin-tester#teardown
   */
  teardown?: TeardownFunction;
  /**
   * This is a `pluginTester` option used to provide a function that formats
   * actual babel outputs before they are compared to expected outputs, and
   * defaults to a function using prettier. If you have prettier configured,
   * then it will use your configuration. If you don't, then it will use a
   * default prettier configuration.
   *
   * @see https://npm.im/babel-plugin-tester#formatResult
   */
  formatResult?: ResultFormatter;
  /**
   * This is a `pluginTester` option for when you prefer to take a snapshot of
   * all test object outputs rather than compare it to something you hard-code.
   * When `true`, a snapshot containing both the source code and the output will
   * be generated for all test object tests.
   *
   * @see https://npm.im/babel-plugin-tester#snapshot
   */
  snapshot?: TestObject['snapshot'];
  /**
   * This is a `pluginTester` option used to provide a new default output file
   * name for all fixtures. Defaults to `"output"`.
   *
   * @see https://npm.im/babel-plugin-tester#fixtureOutputName
   * @default "output"
   */
  fixtureOutputName?: FixtureOptions['fixtureOutputName'];
  /**
   * This is a `pluginTester` option used to provide a new default output file
   * extension for all fixtures. This is particularly useful if you are testing
   * TypeScript input. If omitted, the fixture's input file extension (e.g. the
   * `js` in `code.js`) will be used instead.
   *
   * @see https://npm.im/babel-plugin-tester#fixtureOutputExt
   */
  fixtureOutputExt?: FixtureOptions['fixtureOutputExt'];
  /**
   * This is a `pluginTester` option used to determines which test titles are
   * prefixed with a number when output. Defaults to `"all"`.
   *
   * | Options           | Description                                         |
   * | ----------------- | --------------------------------------------------- |
   * | `"all"`           | All test object and fixtures tests will be numbered |
   * | `"tests-only"`    | Only test object tests will be numbered             |
   * | `"fixtures-only"` | Only fixtures tests will be numbered                |
   * | `false`           | Disable automatic numbering in titles entirely      |
   *
   * @default "all"
   * @see https://npm.im/babel-plugin-tester#titleNumbering
   */
  titleNumbering?: 'all' | 'tests-only' | 'fixtures-only' | false;
  /**
   * Setting this option to `true` will restart test title numbering starting at 1.
   *
   * @default false
   * @see https://npm.im/babel-plugin-tester#restartTitleNumbering
   */
  restartTitleNumbering?: boolean;
  /**
   * This is a `pluginTester` option used to specify a path to a directory
   * containing tests.
   *
   * @see https://npm.im/babel-plugin-tester#fixtures
   */
  fixtures?: string;
  /**
   * This is a `pluginTester` option used to create tests.
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
   * This is a `fixtures` option used to configure babel, overriding the
   * `babelOptions` provided to babel-plugin-tester.
   *
   * @see https://npm.im/babel-plugin-tester#babelOptions-1
   */
  babelOptions?: PluginTesterOptions['babelOptions'];
  /**
   * This is a `fixtures` option used to pass options into your plugin at
   * transform time, overriding the `pluginOptions` provided to
   * babel-plugin-tester.
   *
   * @see https://npm.im/babel-plugin-tester#pluginOptions-1
   */
  pluginOptions?: PluginTesterOptions['pluginOptions'];
  /**
   * This is a `fixtures` option used to pass options into your preset at
   * transform time, overriding the `presetOptions` provided to
   * babel-plugin-tester.
   *
   * @see https://npm.im/babel-plugin-tester#presetOptions-1
   */
  presetOptions?: PluginTesterOptions['presetOptions'];
  /**
   * This is a `fixtures` option used as the title of the test (overriding the
   * directory name).
   *
   * @see https://npm.im/babel-plugin-tester#title-1
   */
  title?: string;
  /**
   * This is a `fixtures` option used to run only the specified fixture. Useful
   * while developing to help focus on a small number of fixtures. Can be used
   * in multiple `options.json` files.
   *
   * @see https://npm.im/babel-plugin-tester#only
   */
  only?: boolean;
  /**
   * This is a `fixtures` option used to skip running the specified fixture.
   * Useful for when you're working on a feature that is not yet supported. Can
   * be used in multiple `options.json` files.
   *
   * @see https://npm.im/babel-plugin-tester#skip
   */
  skip?: boolean;
  /**
   * This is a `fixtures` option used to assert that this fixture's test should
   * throw an error during transformation. For example:
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
   * This is a `fixtures` option used to assert that this fixture's test should
   * throw an error during transformation. For example:
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
   * This is a `fixtures` option to provide a setup function run before this
   * fixture's test. It can return a function which will be treated as a
   * `teardown` function. It can also return a promise. If that promise resolves
   * to a function, that will be treated as a `teardown` function.
   *
   * As it requires a function value, this option must be used in `options.js`
   * instead of `options.json`.
   *
   * @see https://npm.im/babel-plugin-tester#setup-1
   */
  setup?: SetupFunction;
  /**
   * This is a `fixtures` option to provide a teardown function run after this
   * fixture's test. You can either define this as its own property, or you can
   * return it from the `setup` function. This can likewise return a promise if
   * it's asynchronous.
   *
   * As it requires a function value, this option must be used in `options.js`
   * instead of `options.json`.
   *
   * @see https://npm.im/babel-plugin-tester#teardown-1
   */
  teardown?: TeardownFunction;
  /**
   * This is a `fixtures` option used to provide a function that formats the
   * babel output yielded from transforming `code.js` _before_ it is compared to
   * `output.js`. Defaults to a function that uses prettier. If you have
   * prettier configured, then it will use your configuration. If you don't,
   * then it will use a default prettier configuration.
   *
   * As it requires a function value, this option must be used in `options.js`
   * instead of `options.json`.
   *
   * @see https://npm.im/babel-plugin-tester#formatResult-1
   */
  formatResult?: ResultFormatter;
  /**
   * This is a `fixtures` option used to provide your own fixture output file
   * name. Defaults to `"output"`.
   *
   * @see https://npm.im/babel-plugin-tester#fixtureOutputName-1
   * @default "output"
   */
  fixtureOutputName?: string;
  /**
   * This is a `fixtures` option used to provide your own fixture output file
   * extension. This is particularly useful if you are testing TypeScript input.
   * If omitted, the fixture's input file extension (e.g. the `js` in `code.js`)
   * will be used instead.
   *
   * @see https://npm.im/babel-plugin-tester#fixtureOutputExt-1
   */
  fixtureOutputExt?: string;
}

/**
 * Options provided as properties of a test object for use with the `tests`
 * option.
 *
 * @see https://npm.im/babel-plugin-tester#test-objects
 */
export interface TestObject {
  /**
   * This is a `tests` object option used to configure babel, overriding the
   * `babelOptions` provided to babel-plugin-tester.
   *
   * @see https://npm.im/babel-plugin-tester#babelOptions-2
   */
  babelOptions?: PluginTesterOptions['babelOptions'];
  /**
   * This is a `tests` object option used to pass options into your plugin at
   * transform time, overriding the `pluginOptions` provided to
   * babel-plugin-tester.
   *
   * @see https://npm.im/babel-plugin-tester#pluginOptions-2
   */
  pluginOptions?: PluginTesterOptions['pluginOptions'];
  /**
   * This is a `tests` object option used to pass options into your preset at
   * transform time, overriding the `presetOptions` provided to
   * babel-plugin-tester.
   *
   * @see https://npm.im/babel-plugin-tester#presetOptions-1
   */
  presetOptions?: PluginTesterOptions['presetOptions'];
  /**
   * This is a `tests` object option used as the title of the test (overriding
   * everything else).
   *
   * @see https://npm.im/babel-plugin-tester#title-1
   */
  title?: string;
  /**
   * This is a `tests` object option used to run only the specified test. Useful
   * while developing to help focus on a small number of tests. Can be used on
   * multiple tests.
   *
   * @see https://npm.im/babel-plugin-tester#only-1
   */
  only?: boolean;
  /**
   * This is a `tests` object option used to skip running the specified test.
   * Useful for when you're working on a feature that is not yet supported. Can
   * be used on multiple tests.
   *
   * @see https://npm.im/babel-plugin-tester#skip-1
   */
  skip?: boolean;
  /**
   * This is a `tests` object option used to assert that this test should throw
   * an error during transformation. For example:
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
   * Note that this property is ignored when using the `exec` property.
   *
   * For backwards compatibility reasons, `error` is synonymous with `throws`.
   * They can be used interchangeably.
   *
   * @see https://npm.im/babel-plugin-tester#throws-1
   */
  throws?: ErrorExpectation;
  /**
   * This is a `tests` object option used to assert that this test should throw
   * an error during transformation. For example:
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
   * Note that this property is ignored when using the `exec` property.
   *
   * For backwards compatibility reasons, `error` is synonymous with `throws`.
   * They can be used interchangeably.
   *
   * @see https://npm.im/babel-plugin-tester#throws-1
   */
  error?: ErrorExpectation;
  /**
   * This is a `tests` object option to provide a setup function run before this
   * test. It can return a function which will be treated as a `teardown`
   * function. It can also return a promise. If that promise resolves to a
   * function, that will be treated as a `teardown` function.
   *
   * @see https://npm.im/babel-plugin-tester#setup-2
   */
  setup?: SetupFunction;
  /**
   * This is a `tests` object option to provide a teardown function run after
   * this test. You can either define this as its own property, or you can
   * return it from the `setup` function. This can likewise return a promise if
   * it's asynchronous.
   *
   * @see https://npm.im/babel-plugin-tester#teardown-2
   */
  teardown?: TeardownFunction;
  /**
   * This is a `tests` object option used to provide a function that formats the
   * babel output yielded from transforming `code` _before_ it is compared to
   * `output`. Defaults to a function that uses prettier. If you have prettier
   * configured, then it will use your configuration. If you don't, then it will
   * use a default prettier configuration.
   *
   * @see https://npm.im/babel-plugin-tester#formatResult-2
   */
  formatResult?: ResultFormatter;
  /**
   * This is a `tests` object option for when you prefer to take a snapshot of
   * your output rather than compare it to something you hard-code. When `true`,
   * a snapshot containing both the source code and the output will be generated
   * for this test.
   *
   * @see https://npm.im/babel-plugin-tester#snapshot-1
   */
  snapshot?: boolean;
  /**
   * This is a `tests` object option providing the code that you want babel to
   * transform using your plugin or preset. This must be provided unless you're
   * using the `codeFixture` or `exec` properties instead. If you do not provide
   * the `output` or `outputFixture` properties and `snapshot` is not `true`,
   * then the assertion is that this code is unchanged by the transformation.
   *
   * @see https://npm.im/babel-plugin-tester#code
   */
  code?: string;
  /**
   * This is a `tests` object option to which the result of the babel
   * transformation will be compared. `output` will have any indentation
   * stripped and will be trimmed as a convenience for template literals.
   *
   * @see https://npm.im/babel-plugin-tester#output
   */
  output?: string;
  /**
   * This is a `tests` object option that will be transformed just like the
   * `code` property, except the output will be _evaluated_ in the same context
   * as the the test runner itself, meaning it has access to `expect`,
   * `require`, etc. Use this to make advanced assertions on the output.
   *
   * @see https://npm.im/babel-plugin-tester#exec
   */
  exec?: string;
  /**
   * This is a `tests` object option for when you'd rather put your `code` in a
   * separate file. If an absolute file path is provided here, then that's the
   * file that will be loaded. Otherwise, `codeFixture` will be `path.join`'d
   * with the directory name of `filepath`.
   *
   * If you find you're using this option more than a couple of times, consider
   * using _`fixtures`_ instead.
   *
   * @see https://npm.im/babel-plugin-tester#codeFixture
   */
  codeFixture?: string;
  /**
   * @deprecated Use `codeFixture` instead.
   * @see https://npm.im/babel-plugin-tester#codeFixture
   */
  fixture?: string;
  /**
   * This is a `tests` object option for when you'd rather put your `output` in
   * a separate file. If an absolute file path is provided here, then that's the
   * file that will be loaded. Otherwise, `outputFixture` will be `path.join`'d
   * with the directory name of `filepath`.
   *
   * If you find you're using this option more than a couple of times, consider
   * using _`fixtures`_ instead.
   *
   * @see https://npm.im/babel-plugin-tester#outputFixture
   */
  outputFixture?: string;
  /**
   * This is a `tests` object option for when you'd rather put your `exec` in a
   * separate file. If an absolute file path is provided here, then that's the
   * file that will be loaded. Otherwise, `execFixture` will be `path.join`'d
   * with the directory name of `filepath`.
   *
   * If you find you're using this option more than a couple of times, consider
   * using _`fixtures`_ instead.
   *
   * @see https://npm.im/babel-plugin-tester#execFixture
   */
  execFixture?: string;
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
     * Note that this file might not actually exist and, even if it does, it
     * might not contain the original source of `code`.
     */
    filepath?: string;
    /**
     * If this deprecated parameter is given as an argument, treat it as the
     * value of `filepath`. Otherwise, it should not be used.
     *
     * @deprecated Use `filepath` instead.
     */
    filename?: string;
  } & Partial<AdditionalOptions>
) => string;

// * The transitive dependency "pretty-format" is a dependency of Jest
export type { Plugin as SnapshotSerializer } from 'pretty-format';

/**
 * An internal type describing a resolved base configuration.
 *
 * @internal
 */
export type PluginTesterBaseConfig = (
  | {
      plugin: NonNullable<PluginTesterOptions['plugin']>;
      pluginName: NonNullable<PluginTesterOptions['pluginName']>;
      basePluginOptions: NonNullable<PluginTesterOptions['pluginOptions']>;
      preset: undefined;
      presetName: undefined;
      basePresetOptions: undefined;
    }
  | {
      plugin: undefined;
      pluginName: undefined;
      basePluginOptions: undefined;
      preset: NonNullable<PluginTesterOptions['preset']>;
      presetName: PluginTesterOptions['presetName'];
      basePresetOptions: NonNullable<PluginTesterOptions['presetOptions']>;
    }
) & {
  babel: NonNullable<PluginTesterOptions['babel']>;
  baseBabelOptions: NonNullable<PluginTesterOptions['babelOptions']>;
  describeBlockTitle: NonNullable<PluginTesterOptions['title']>;
  filepath: PluginTesterOptions['filepath'];
  endOfLine: NonNullable<PluginTesterOptions['endOfLine']>;
  baseSetup: NonNullable<PluginTesterOptions['setup']>;
  baseTeardown: NonNullable<PluginTesterOptions['teardown']>;
  baseFormatResult: NonNullable<PluginTesterOptions['formatResult']>;
  baseSnapshot: NonNullable<PluginTesterOptions['snapshot']>;
  baseFixtureOutputName: NonNullable<PluginTesterOptions['fixtureOutputName']>;
  baseFixtureOutputExt: PluginTesterOptions['fixtureOutputExt'];
  fixtures: PluginTesterOptions['fixtures'];
  tests: NonNullable<PluginTesterOptions['tests']>;
};

type PluginTesterSharedTestConfigProperties = {
  babelOptions: Babel.TransformOptions;
  testBlockTitle: NonNullable<TestObject['title'] | FixtureOptions['title']>;
  only?: TestObject['only'] | FixtureOptions['only'];
  skip?: TestObject['skip'] | FixtureOptions['skip'];
  expectedError?: TestObject['throws'] | FixtureOptions['throws'];
  testSetup: NonNullable<PluginTesterOptions['setup']>;
  testTeardown: NonNullable<PluginTesterOptions['teardown']>;
  formatResult: NonNullable<PluginTesterOptions['formatResult']>;
};

/**
 * An internal type describing a resolved describe-block configuration.
 *
 * @internal
 */
export type PluginTesterTestDescribeConfig = {
  [$type]: 'describe-block';
  describeBlockTitle: NonNullable<TestObject['title'] | FixtureOptions['title']>;
  tests: PluginTesterTestConfig[];
};

/**
 * An internal type describing an unverified test-object configuration.
 *
 * @internal
 */
export type MaybePluginTesterTestObjectConfig = {
  [$type]: 'test-object';
  snapshot: NonNullable<TestObject['snapshot']>;
} & PluginTesterSharedTestConfigProperties & {
    code: TestObject['code'];
    codeFixture: TestObject['codeFixture'];
    output: TestObject['output'];
    outputFixture: TestObject['outputFixture'];
    exec: TestObject['exec'];
    execFixture: TestObject['execFixture'];
  };

/**
 * An internal type describing a resolved test-object configuration.
 *
 * @internal
 */
export type PluginTesterTestObjectConfig = {
  [$type]: 'test-object';
  snapshot: NonNullable<TestObject['snapshot']>;
} & PluginTesterSharedTestConfigProperties &
  (
    | {
        code: NonNullable<TestObject['code']>;
        codeFixture: TestObject['codeFixture'];
        output: TestObject['output'];
        outputFixture: TestObject['outputFixture'];
        exec: undefined;
        execFixture: undefined;
      }
    | {
        code: undefined;
        codeFixture: undefined;
        output: undefined;
        outputFixture: undefined;
        exec: NonNullable<TestObject['exec']>;
        execFixture: NonNullable<TestObject['execFixture']>;
      }
  );

/**
 * An internal type describing an unverified fixture-object configuration.
 *
 * @internal
 */
export type MaybePluginTesterTestFixtureConfig = {
  [$type]: 'fixture-object';
} & PluginTesterSharedTestConfigProperties & {
    fixtureOutputBasename: string | undefined;
    code: TestObject['code'];
    codeFixture: TestObject['codeFixture'];
    output: TestObject['output'];
    outputFixture: TestObject['outputFixture'];
    exec: TestObject['exec'];
    execFixture: TestObject['execFixture'];
  };

/**
 * An internal type describing a resolved fixture-object configuration.
 *
 * @internal
 */
export type PluginTesterTestFixtureConfig = {
  [$type]: 'fixture-object';
} & PluginTesterSharedTestConfigProperties &
  (
    | {
        fixtureOutputBasename: string;
        code: NonNullable<TestObject['code']>;
        codeFixture: NonNullable<TestObject['codeFixture']>;
        output: TestObject['output'];
        outputFixture: NonNullable<TestObject['outputFixture']>;
        exec: undefined;
        execFixture: undefined;
      }
    | {
        fixtureOutputBasename: undefined;
        code: undefined;
        codeFixture: undefined;
        output: undefined;
        outputFixture: undefined;
        exec: NonNullable<TestObject['exec']>;
        execFixture: NonNullable<TestObject['execFixture']>;
      }
  );

/**
 * An internal type describing a resolved configuration.
 *
 * @internal
 */
export type PluginTesterTestConfig =
  | PluginTesterTestDescribeConfig
  | PluginTesterTestObjectConfig
  | PluginTesterTestFixtureConfig;
