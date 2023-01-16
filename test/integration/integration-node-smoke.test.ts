/* eslint-disable jest/require-hook */
/* eslint-disable jest/no-conditional-in-test, jest/no-conditional-expect */

// * These are tests that ensure babel-plugin-tester works (1) with the babel
// * versions we claim it does, (2) with the test frameworks we claim it does,
// * (3) with the feature set we claim and interoperability code given in the
// * documentation.

import { existsSync } from 'node:fs';
import debugFactory from 'debug';
import mergeWith from 'lodash.mergewith';

import { name as pkgName, exports as pkgExports } from '../../package.json';
import { withMockedFixture } from '../setup';
import { assets } from './assets';

import {
  defaultFixtureOptions,
  BABEL_VERSIONS_UNDER_TEST,
  FRAMEWORKS_UNDER_TEST,
  type IMPORT_SPECIFIERS_UNDER_TEST
} from './test-config';

const TEST_IDENTIFIER = 'node-smoke';
const TEST_TARGET: (typeof IMPORT_SPECIFIERS_UNDER_TEST)[number] = 'main'; // * Or: 'pure'
const debug = debugFactory(`${pkgName}:${TEST_IDENTIFIER}`);

const pkgMainPath = `${__dirname}/../../${pkgExports['.'].default}`;
const pkgPurePath = `${__dirname}/../../${pkgExports['./pure'].default}`;

debug('FRAMEWORKS_UNDER_TEST: %O', FRAMEWORKS_UNDER_TEST);
debug('BABEL_VERSIONS_UNDER_TEST: %O', BABEL_VERSIONS_UNDER_TEST);

beforeAll(async () => {
  if (!existsSync(pkgMainPath)) {
    debug(`unable to find main export: ${pkgMainPath}`);
    throw new Error('must build distributables first (try `npm run build-dist`)');
  }

  if (!existsSync(pkgPurePath)) {
    debug(`unable to find pure export: ${pkgPurePath}`);
    throw new Error('must build distributables first (try `npm run build-dist`)');
  }
});

let counter = 1;

for (const [babelPkg, ...otherBabelPkgs] of BABEL_VERSIONS_UNDER_TEST) {
  for (const {
    frameworkPkg,
    frameworkArgs,
    otherFrameworkPkgs,
    tests
  } of FRAMEWORKS_UNDER_TEST) {
    const otherPkgs = otherBabelPkgs.concat(otherFrameworkPkgs || []);
    const pkgsString = [babelPkg, frameworkPkg, ...otherPkgs].join(', ');

    for (const [index, { source, expectations }] of tests.entries()) {
      const count = counter++;
      const title = `${count}. works with ${pkgsString} [ subtest #${index + 1} ]`;

      debug(`registered test: ${title}`);

      // eslint-disable-next-line jest/valid-title
      it.concurrent(title, async () => {
        expect.hasAssertions();

        debug(`started running test: ${title}`);

        const indexPath = 'src/index.test.js';
        const importSpecifier = `${pkgName}${TEST_TARGET == 'main' ? '' : '/pure'}`;

        const fixtureOptions = mergeWith(
          {},
          defaultFixtureOptions,
          {
            npmInstall: [frameworkPkg, babelPkg, ...otherPkgs].filter(
              (p) => !p.startsWith('node:')
            ),
            runWith: {
              binary: 'npx',
              args: [...frameworkArgs]
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
          typeof sourceInput == 'string' ? sourceInput : sourceInput['cjs'];

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
