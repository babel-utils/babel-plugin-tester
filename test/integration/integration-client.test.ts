/* eslint-disable jest/require-hook */

// * These are tests that ensure babel-plugin-tester works (1) in ESM vs CJS
// * environments, (2) using modern import syntax, (3) using main vs pure import
// * specifiers, (4) across all maintained versions of NodeJS.

import { toAbsolutePath, toDirname, toPath, toRelativePath } from '@-xun/fs';
import { readXPackageJsonAtRoot } from '@-xun/project';

import {
  exports as packageExports,
  name as packageName,
  version as packageVersion
} from 'rootverse:package.json';

import { assets } from 'testverse:integration/assets.ts';
import { expectSuccessAndOutput } from 'testverse:integration/test-expectations.ts';

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
  IMPORT_SPECIFIERS_UNDER_TEST,
  IMPORT_STYLES_UNDER_TEST,
  NODE_VERSIONS_UNDER_TEST
} from 'testverse:integration/.config.ts';

reconfigureJestGlobalsToSkipTestsInThisFileIfRequested({ it: true });

const TEST_IDENTIFIER = 'node-interop';

const debug = testDebugger.extend(TEST_IDENTIFIER);
const packageRoot = toAbsolutePath(toDirname(require.resolve('rootverse:package.json')));

debug('BABEL_VERSIONS_UNDER_TEST: %O', BABEL_VERSIONS_UNDER_TEST);
debug('IMPORT_SPECIFIERS_UNDER_TEST: %O', IMPORT_SPECIFIERS_UNDER_TEST);
debug('IMPORT_STYLES_UNDER_TEST: %O', IMPORT_STYLES_UNDER_TEST);

beforeAll(async () => {
  await ensurePackageHasBeenBuilt(packageRoot, packageName, packageExports);
});

let counter = 1;

for (const esm of [true, false] as const) {
  for (const importSpecifierName of IMPORT_SPECIFIERS_UNDER_TEST) {
    for (const importStyleName of IMPORT_STYLES_UNDER_TEST) {
      for (const nodeVersion of NODE_VERSIONS_UNDER_TEST) {
        const count = counter++;
        const title = `${count}. Works as a ${importStyleName} ${importSpecifierName} ${
          esm ? 'ESM' : 'CJS'
        } import using ${nodeVersion}`;

        debug(`registered test: ${title}`);

        // eslint-disable-next-line jest/valid-title
        it(title, async () => {
          expect.hasAssertions();

          debug(`started running test: ${title}`);

          const indexPath = `src/index.test.${esm ? 'm' : ''}js`;
          const importSpecifier = `${packageName}${
            importSpecifierName === 'main' ? '' : '/pure'
          }`;

          const importStyle = {
            modern: '{ pluginTester }',
            'modern-default': '{ default: pluginTester }',
            default: 'pluginTester',
            'dot-default': 'pluginTester'
          }[importStyleName];

          const sourceInput = assets.invocation[importSpecifierName];
          const sourceCode =
            typeof sourceInput === 'string'
              ? sourceInput
              : sourceInput[esm ? 'esm' : 'cjs'];

          await withMockedFixtures(
            async (context) => {
              expectSuccessAndOutput(context);
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
                'jest.config.js':
                  'module.exports = {testMatch:["**/?(*.)+(spec|test).?(m)[jt]s?(x)"],transform:{}};',
                'fixtures/dummy-fixture-asset/code.js':
                  assets.dummyFixtureAssetCode[importSpecifierName],
                'fixtures/dummy-fixture-asset/options.js':
                  assets.dummyFixtureAssetOptions[importSpecifierName],
                'fixtures/dummy-fixture-asset/output.js':
                  assets.dummyFixtureAssetOutput[importSpecifierName],
                [indexPath]: esm
                  ? /*ts*/ `
import ${
                      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                      esm ? importStyle.replaceAll(':', ' as') : importStyle
                    } from '${importSpecifier}';
import identifierReversePlugin from '../plugin-identifier-reverse.js';

${sourceCode}
          `
                  : /*ts*/ `
const ${importStyle} = require('${importSpecifier}');
const identifierReversePlugin = require('../plugin-identifier-reverse.js');

${sourceCode}
          `
              },
              directoryPaths: [toRelativePath('fixtures/dummy-fixture-asset')],
              runInstallScripts: true,
              additionalPackagesToInstall: [
                '@babel/core@latest',
                'jest@latest',
                nodeVersion
              ],
              runWith: {
                binary: 'npx',
                args: [
                  'node',
                  '--no-warnings',
                  '--experimental-vm-modules',
                  toPath('node_modules', 'jest', 'bin', 'jest')
                ]
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
}

debug('finished registering tests');
debug(`registered a total of ${counter} tests!`);
