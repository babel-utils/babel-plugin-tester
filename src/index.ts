import { prettierFormatter } from './formatters/prettier';
import { unstringSnapshotSerializer } from './serializers/unstring-snapshot';
import { pluginTester } from './plugin-tester';

import type * as Babel from '@babel/core';
import type { Class, Promisable } from 'type-fest';

/* istanbul ignore else (it's not worth testing) */
if (typeof expect !== 'undefined' && expect.addSnapshotSerializer) {
  expect.addSnapshotSerializer(unstringSnapshotSerializer);
}

export const runPluginUnderTestHere: unique symbol = Symbol('run-plugin-under-test-here');

export {
  prettierFormatter,
  unstringSnapshotSerializer,
  defaultPluginTester as pluginTester
};

export default function defaultPluginTester(options?: PluginTesterOptions) {
  return pluginTester({ formatResult: prettierFormatter, ...options });
}

export type BabelType = typeof Babel;

export type ErrorExpectation =
  | boolean
  | string
  | RegExp
  | Error
  | Class<Error>
  | ((error: unknown) => boolean);

export type SetupFunction = () => Promisable<void | TeardownFunction>;
export type TeardownFunction = () => Promisable<void>;

export interface PluginTesterOptions extends TestObject, FixtureOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugin?: (...args: any[]) => Babel.PluginObj<any>;
  pluginName?: string;
  pluginOptions?: Babel.PluginOptions;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  preset?: (...args: any[]) => Babel.TransformOptions;
  presetName?: string;
  presetOptions?: Babel.PluginOptions;
  babel?: {
    transform: BabelType['transform'];
    transformAsync?: BabelType['transformAsync'];
  };
  babelOptions?: Omit<Babel.TransformOptions, 'plugins'> & {
    plugins?:
      | (
          | NonNullable<Babel.TransformOptions['plugins']>[number]
          | typeof runPluginUnderTestHere
        )[]
      | null;
  };
  title?: string;
  filepath?: string;
  /**
   * @deprecated Use `filepath` instead.
   */
  filename?: string;
  endOfLine?: 'lf' | 'crlf' | 'auto' | 'preserve';
  fixtures?: string;
  tests?: (TestObject | string)[] | Record<string, TestObject | string>;
}

type CommonOptions = {
  title?: string;
  only?: boolean;
  skip?: boolean;
  throws?: ErrorExpectation;
  error?: ErrorExpectation;
  setup?: SetupFunction;
  teardown?: TeardownFunction;
  formatResult?: ResultFormatter;
  babelOptions?: PluginTesterOptions['babelOptions'];
  pluginOptions?: PluginTesterOptions['pluginOptions'];
};

export interface TestObject extends CommonOptions {
  code?: string;
  output?: string;
  fixture?: string;
  outputFixture?: string;
  exec?: string;
  snapshot?: boolean;
}

export interface FixtureOptions extends CommonOptions {
  fixtureOutputName?: string;
  fixtureOutputExt?: string;
}

/**
 * A code formatter used to normalize the results of a babel transformation.
 */
export type ResultFormatter<
  AdditionalOptions extends Record<string, unknown> = Record<string, unknown>
> = (
  /**
   * The result of a babel transformation that should be formatted.
   */
  code: string,
  options: {
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
