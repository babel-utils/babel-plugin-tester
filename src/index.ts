import { prettierFormatter } from './formatters/prettier';
import { unstringSnapshotSerializer } from './serializers/unstring-snapshot';
import { pluginTester } from './plugin-tester';
import { ResultFormatter } from './formatters';

import type * as Babel from '@babel/core';
import type { Class, Promisable } from 'type-fest';

export type BabelType = typeof Babel;

/* istanbul ignore else (it's not worth testing) */
if (typeof expect !== 'undefined' && expect.addSnapshotSerializer) {
  expect.addSnapshotSerializer(unstringSnapshotSerializer);
}

export const runPluginUnderTestHere: unique symbol = Symbol('run-plugin-under-test-here');

export default function defaultPluginTester(options?: PluginTesterOptions) {
  return pluginTester({ formatResult: prettierFormatter, ...options });
}

export type ErrorExpectation =
  | boolean
  | string
  | RegExp
  | Error
  | Class<Error>
  | ((error: unknown) => boolean);

export type SetupFunction = () => Promisable<void | TeardownFunction>;
export type TeardownFunction = () => Promisable<void>;

export {
  prettierFormatter,
  unstringSnapshotSerializer,
  defaultPluginTester as pluginTester
};

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
