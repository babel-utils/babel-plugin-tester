// * Comment out elements of the below X_UNDER_TEST arrays to limit the tests
// * that get run. Use test titles to determine how to manipulate these knobs.
// *
// * You can also use something like
// * https://jestjs.io/docs/cli#--testnamepatternregex to match against test
// * titles via the number prefixed to each title. Numeric prefixes are stable
// * with respect to the settings configured below. That is: the numbers will
// * only change when the configuration below changes. You can also match
// * against test framework names (like `node:test`) and other settings.

import assert from 'node:assert';

import { coerce } from 'semver';

import {
  engines as packageEngines,
  name as packageName,
  peerDependencies as packagePeerDependencies,
  version as packageVersion
} from 'rootverse:package.json';

import { assets } from 'testverse:integration/assets.ts';

import {
  expectErrorNoDescribe,
  expectErrorNoOnly,
  expectErrorNoSkip,
  expectErrorNoSnapshot,
  expectSuccess,
  expectSuccessAndOutput
} from 'testverse:integration/test-expectations.ts';

import {
  withJasmineInterop,
  withNodeTestInterop
} from 'testverse:integration/test-interop.ts';

import {
  dummyDirectoriesFixture,
  dummyFilesFixture,
  dummyNpmPackageFixture,
  nodeImportTestFixture,
  npmCopySelfFixture,
  type FixtureContext,
  type FixtureOptions
} from 'testverse:setup.ts';

import type { ReadonlyDeep } from 'type-fest';

export const defaultFixtureOptions = {
  performCleanup: true,
  initialFileContents: {
    'package.json': `{"name":"dummy-pkg","dependencies":{"${packageName}":"${packageVersion}"}}`,
    'plugin-identifier-reverse.js': assets.pluginIdentifierReverse
  },
  directoryPaths: ['fixtures/dummy-fixture-asset'],
  use: [
    dummyNpmPackageFixture(),
    npmCopySelfFixture(),
    dummyDirectoriesFixture(),
    dummyFilesFixture(),
    nodeImportTestFixture()
  ]
} as Partial<FixtureOptions> & {
  initialFileContents: FixtureOptions['initialFileContents'];
};

/* prettier-ignore */
export const IMPORT_SPECIFIERS_UNDER_TEST = ([
  'main', // ? import ... from 'babel-plugin-tester'      (and CJS version)
  'pure'  // ? import ... from 'babel-plugin-tester/pure' (and CJS version)
] as const);

/* prettier-ignore */
export const IMPORT_STYLES_UNDER_TEST = ([
  'modern',           // ? import { pluginTester } from '...'          (and CJS version)
  //'modern-default', // ? import { default: pluginTester } from '...' (and CJS version)
  //'default',        // ? import pluginTester from '...'              (and CJS version)
  //'dot-default'     // ? const pluginTester = require('...').default
] as const);

const babelCoreMinimumVersion = coerce(packagePeerDependencies['@babel/core']);
assert(babelCoreMinimumVersion);

/* prettier-ignore */
export const BABEL_VERSIONS_UNDER_TEST = ([
  // * [babel@version, ...otherPackages]
  [`@babel/core@${babelCoreMinimumVersion.version}`], // ? Current minimum version
  ['@babel/core@latest'], // ? Latest version
  ['@babel/core@next'],   // ? Next version
]);

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
assert(packageEngines?.node);

// * [node@version, ...]
export const NODE_VERSIONS_UNDER_TEST = packageEngines.node
  .split('||')
  .map((version) => {
    const semverVersion = coerce(version);
    assert(semverVersion);
    return `node@${semverVersion.version}`;
  });

export const FRAMEWORKS_UNDER_TEST: FrameworksUnderTest = [
  {
    frameworkPkg: 'jest@>=30 || >=30.0.0-alpha.2',
    frameworkArgs: ['jest'],
    tests: [
      { source: assets.invocation, expectations: expectSuccessAndOutput },
      { source: assets.invocationOnly, expectations: expectSuccess },
      { source: assets.invocationSkip, expectations: expectSuccess },
      { source: assets.invocationSnapshot, expectations: expectSuccess }
    ]
  },
  {
    frameworkPkg: 'vitest@latest',
    frameworkArgs: ['vitest', 'run', '--globals'],
    tests: [
      {
        source: assets.invocation,
        expectations: expectSuccessAndOutput
      },
      { source: assets.invocationOnly, expectations: expectSuccess },
      { source: assets.invocationSkip, expectations: expectSuccess },
      {
        source: assets.invocationSnapshot,
        expectations: expectSuccess
      }
    ]
  },
  {
    frameworkPkg: 'mocha@latest',
    frameworkArgs: ['mocha'],
    tests: [
      { source: assets.invocation, expectations: expectSuccessAndOutput },
      { source: assets.invocationOnly, expectations: expectSuccess },
      { source: assets.invocationSkip, expectations: expectSuccess },
      { source: assets.invocationSnapshot, expectations: expectErrorNoSnapshot }
    ]
  },
  {
    frameworkPkg: 'jasmine@latest',
    frameworkArgs: ['jasmine'],
    tests: [
      { source: assets.invocation, expectations: expectSuccessAndOutput },
      {
        source: withJasmineInterop(assets.invocation),
        expectations: expectSuccessAndOutput
      },
      { source: assets.invocationOnly, expectations: expectErrorNoOnly },
      {
        source: withJasmineInterop(assets.invocationOnly),
        expectations: expectSuccess
      },
      { source: assets.invocationSkip, expectations: expectErrorNoSkip },
      {
        source: withJasmineInterop(assets.invocationSkip),
        expectations: expectSuccess
      },
      { source: assets.invocationSnapshot, expectations: expectErrorNoSnapshot },
      {
        source: withJasmineInterop(assets.invocationSnapshot),
        expectations: expectErrorNoSnapshot
      }
    ]
  },
  {
    frameworkPkg: 'node:test',
    frameworkArgs: ['node'],
    tests: [
      { source: assets.invocation, expectations: expectErrorNoDescribe },
      {
        source: withNodeTestInterop(assets.invocation),
        expectations: expectSuccessAndOutput
      },
      { source: assets.invocationOnly, expectations: expectErrorNoDescribe },
      {
        source: withNodeTestInterop(assets.invocationOnly),
        expectations: expectSuccess
      },
      { source: assets.invocationSkip, expectations: expectErrorNoDescribe },
      {
        source: withNodeTestInterop(assets.invocationSkip),
        expectations: expectSuccess
      },
      { source: assets.invocationSnapshot, expectations: expectErrorNoDescribe },
      {
        source: withNodeTestInterop(assets.invocationSnapshot),
        expectations: expectErrorNoSnapshot
      }
    ]
  }
];

export type FrameworksUnderTest = ReadonlyDeep<
  {
    frameworkPkg: string;
    frameworkArgs: string[];
    otherFrameworkPkgs?: string[];
    tests: {
      source: Record<
        (typeof IMPORT_SPECIFIERS_UNDER_TEST)[number],
        string | { esm: string; cjs: string }
      >;
      expectations: (context: FixtureContext) => unknown;
    }[];
  }[]
>;
