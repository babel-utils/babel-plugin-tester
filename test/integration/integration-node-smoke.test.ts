/* eslint-disable jest/require-hook */

// * These are tests that ensure babel-plugin-tester works (1) with the babel
// * versions we claim it does, (2) with the test frameworks we claim it does,
// * (3) with the feature set we claim and interoperability code given in the
// * documentation.

import { existsSync } from 'node:fs';

import debugFactory from 'debug';
import mergeWith from 'lodash.mergewith';

import { exports as packageExports, name as packageName } from 'rootverse:package.json';

import { assets } from 'testverse:integration/assets.ts';
import { withMockedFixture } from 'testverse:setup.ts';

import {
  BABEL_VERSIONS_UNDER_TEST,
  defaultFixtureOptions,
  FRAMEWORKS_UNDER_TEST,
  type IMPORT_SPECIFIERS_UNDER_TEST
} from 'testverse:integration/.config.ts';

const TEST_IDENTIFIER = 'node-smoke';
const TEST_TARGET: (typeof IMPORT_SPECIFIERS_UNDER_TEST)[number] = 'main'; // * Or: 'pure'
const debug = debugFactory(`${packageName}:${TEST_IDENTIFIER}`);

const packageMainPath = `${__dirname}/../../${packageExports['.'].default}`;
const packagePurePath = `${__dirname}/../../${packageExports['./pure'].default}`;

debug('FRAMEWORKS_UNDER_TEST: %O', FRAMEWORKS_UNDER_TEST);
debug('BABEL_VERSIONS_UNDER_TEST: %O', BABEL_VERSIONS_UNDER_TEST);

beforeAll(async () => {
  if (!existsSync(packageMainPath)) {
    debug(`unable to find main export: ${packageMainPath}`);
    throw new Error('must build distributables first (try `npm run build-dist`)');
  }

  if (!existsSync(packagePurePath)) {
    debug(`unable to find pure export: ${packagePurePath}`);
    throw new Error('must build distributables first (try `npm run build-dist`)');
  }
});

let counter = 1;

for (const [babelPackage, ...otherBabelPkgs] of BABEL_VERSIONS_UNDER_TEST) {
  for (const {
    frameworkPkg,
    frameworkArgs,
    otherFrameworkPkgs,
    tests
  } of FRAMEWORKS_UNDER_TEST) {
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

        const fixtureOptions = mergeWith(
          {},
          defaultFixtureOptions,
          {
            npmInstall: [frameworkPkg, babelPackage, ...otherPkgs].filter(
              (p) => !p.startsWith('node:')
            ),
            runWith: {
              binary: 'npx',
              args: [...frameworkArgs],
              options: {
                env: { NODE_OPTIONS: '--no-warnings --experimental-vm-modules' }
              }
            }
          },
          {
            initialFileContents: {
              'fixtures/dummy-fixture-asset/code.js':
                assets.dummyFixtureAssetCode[TEST_TARGET],
              'fixtures/dummy-fixture-asset/options.js':
                assets.dummyFixtureAssetOptions[TEST_TARGET],
              'fixtures/dummy-fixture-asset/output.js':
                assets.dummyFixtureAssetOutput[TEST_TARGET]
            }
          }
        );

        const sourceInput = source[TEST_TARGET];
        const sourceCode =
          typeof sourceInput === 'string' ? sourceInput : sourceInput.cjs;

        fixtureOptions.initialFileContents[indexPath] = `
          const { pluginTester } = require('${importSpecifier}');
          const identifierReversePlugin = require('../plugin-identifier-reverse.js');

          ${sourceCode}
        `;

        await withMockedFixture({
          testIdentifier: TEST_IDENTIFIER,
          options: fixtureOptions,
          fn: async (context) => {
            if (!context.testResult) {
              throw new Error('must use node-import-test fixture');
            }

            expectations(context);
          }
        });
      });
    }
  }
}

debug('finished registering tests');
debug(`registered a total of ${counter} tests!`);
