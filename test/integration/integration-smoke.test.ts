/* eslint-disable jest/require-hook */

// * These are tests that ensure babel-plugin-tester works (1) with the babel
// * versions we claim it does, (2) with the test frameworks we claim it does,
// * (3) with the feature set we claim and interoperability code given in the
// * documentation.

import { toAbsolutePath, toDirname, toRelativePath } from '@-xun/fs';
import { readXPackageJsonAtRoot } from '@-xun/project';

import {
  exports as packageExports,
  name as packageName,
  version as packageVersion
} from 'rootverse:package.json';

import { assets } from 'testverse:integration/assets.ts';

import {
  dummyDirectoriesFixture,
  dummyFilesFixture,
  dummyNpmPackageFixture,
  ensurePackageHasBeenBuilt,
  nodeImportAndRunTestFixture,
  npmCopyPackageFixture,
  reconfigureJestGlobalsToSkipTestsInThisFileIfRequested,
  testDebugger,
  withMockedFixtures
} from 'testverse:util.ts';

import {
  BABEL_VERSIONS_UNDER_TEST,
  FRAMEWORKS_UNDER_TEST
} from 'testverse:integration/.config.ts';

import type { IMPORT_SPECIFIERS_UNDER_TEST } from 'testverse:integration/.config.ts';

reconfigureJestGlobalsToSkipTestsInThisFileIfRequested({ it: true });

const TEST_IDENTIFIER = 'node-smoke';
const TEST_TARGET: (typeof IMPORT_SPECIFIERS_UNDER_TEST)[number] = 'main'; // * Or: 'pure'

const debug = testDebugger.extend(TEST_IDENTIFIER);
const packageRoot = toAbsolutePath(toDirname(require.resolve('rootverse:package.json')));

debug('FRAMEWORKS_UNDER_TEST: %O', FRAMEWORKS_UNDER_TEST);
debug('BABEL_VERSIONS_UNDER_TEST: %O', BABEL_VERSIONS_UNDER_TEST);

beforeAll(async () => {
  await ensurePackageHasBeenBuilt(packageRoot, packageName, packageExports);
});

let counter = 1;

for (const [
  index,
  [babelPackage, ...otherBabelPkgs]
] of BABEL_VERSIONS_UNDER_TEST.entries()) {
  for (const {
    frameworkPkg,
    frameworkArgs,
    otherFrameworkPkgs,
    skipLastBabelVersionUnderTest = false,
    tests
  } of FRAMEWORKS_UNDER_TEST) {
    if (skipLastBabelVersionUnderTest && index >= BABEL_VERSIONS_UNDER_TEST.length - 1) {
      debug.warn(
        'saw skipLastBabelVersionUnderTest=true in FRAMEWORKS_UNDER_TEST entry; skipped testing %O with %O',
        babelPackage,
        frameworkPkg
      );

      continue;
    }

    const otherPkgs = otherBabelPkgs.concat(otherFrameworkPkgs || []);
    const pkgsString = [babelPackage, frameworkPkg, ...otherPkgs].join(', ');

    for (const [index, { source, expectations }] of tests.entries()) {
      const count = counter++;
      const title = `${count}. Works with ${pkgsString} [ subtest #${index + 1} ]`;

      debug(`registered test: ${title}`);

      // eslint-disable-next-line jest/valid-title
      it(title, async () => {
        expect.hasAssertions();

        debug(`started running test: ${title}`);

        const indexPath = 'src/index.test.js';
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        const importSpecifier = `${packageName}${TEST_TARGET === 'main' ? '' : '/pure'}`;

        const sourceInput = source[TEST_TARGET];
        const sourceCode =
          typeof sourceInput === 'string' ? sourceInput : sourceInput.cjs;

        await withMockedFixtures(
          async (context) => {
            expectations(context);
          },
          [
            dummyNpmPackageFixture,
            npmCopyPackageFixture,
            dummyDirectoriesFixture,
            dummyFilesFixture,
            nodeImportAndRunTestFixture
          ],
          {
            performCleanup: true,
            identifier: TEST_IDENTIFIER,
            initialVirtualFiles: {
              'package.json': `{"name":"dummy-pkg","dependencies":{"${packageName}":"${packageVersion}"}}`,
              'plugin-identifier-reverse.js': assets.pluginIdentifierReverse,
              'fixtures/dummy-fixture-asset/code.js':
                assets.dummyFixtureAssetCode[TEST_TARGET],
              'fixtures/dummy-fixture-asset/options.js':
                assets.dummyFixtureAssetOptions[TEST_TARGET],
              'fixtures/dummy-fixture-asset/output.js':
                assets.dummyFixtureAssetOutput[TEST_TARGET],
              [indexPath]: /*ts*/ `
const { pluginTester } = require('${importSpecifier}');
const identifierReversePlugin = require('../plugin-identifier-reverse.js');

${sourceCode}
        `
            },
            directoryPaths: [toRelativePath('fixtures/dummy-fixture-asset')],
            additionalPackagesToInstall: [
              frameworkPkg,
              babelPackage,
              ...otherPkgs
            ].filter(
              (p): p is string => typeof p === 'string' && !p.startsWith('node:')
            ),
            runWith: {
              binary: 'npx',
              args: [...frameworkArgs],
              runnerOptions: {
                env: { NODE_OPTIONS: '--no-warnings --experimental-vm-modules' }
              }
            },
            packageUnderTest: {
              root: packageRoot,
              json: readXPackageJsonAtRoot.sync(packageRoot, { useCached: true }),
              attributes: { cjs: true }
            }
          }
        );
      });
    }
  }
}

debug('finished registering tests');
debug(`registered a total of ${counter} tests!`);
