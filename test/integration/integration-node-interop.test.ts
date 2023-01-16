/* eslint-disable jest/require-hook */
/* eslint-disable jest/no-conditional-in-test, jest/no-conditional-expect */

// * These are tests that ensure babel-plugin-tester works (1) in ESM vs CJS
// * environments, (2) using modern vs modern-default vs default vs dot-default
// * import syntax, (3) using main vs pure import specifiers.

import { existsSync } from 'node:fs';
import debugFactory from 'debug';
import mergeWith from 'lodash.mergewith';

import { name as pkgName, exports as pkgExports } from '../../package.json';
import { withMockedFixture } from '../setup';
import { assets } from './assets';

import {
  defaultFixtureOptions,
  BABEL_VERSIONS_UNDER_TEST,
  IMPORT_SPECIFIERS_UNDER_TEST,
  IMPORT_STYLES_UNDER_TEST
} from './test-config';
import { expectSuccessAndOutput } from './test-expectations';
import { withNodeTestInterop } from './test-interop';

const TEST_IDENTIFIER = 'node-interop';
const debug = debugFactory(`${pkgName}:${TEST_IDENTIFIER}`);

const pkgMainPath = `${__dirname}/../../${pkgExports['.'].default}`;
const pkgPurePath = `${__dirname}/../../${pkgExports['./pure'].default}`;

debug('BABEL_VERSIONS_UNDER_TEST: %O', BABEL_VERSIONS_UNDER_TEST);
debug('IMPORT_SPECIFIERS_UNDER_TEST: %O', IMPORT_SPECIFIERS_UNDER_TEST);
debug('IMPORT_STYLES_UNDER_TEST: %O', IMPORT_STYLES_UNDER_TEST);

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

for (const esm of [true, false] as const) {
  for (const importSpecifierName of IMPORT_SPECIFIERS_UNDER_TEST) {
    for (const importStyleName of IMPORT_STYLES_UNDER_TEST) {
      const count = counter++;
      const title = `${count}. works as a ${importStyleName} ${importSpecifierName} ${
        esm ? 'ESM' : 'CJS'
      } import`;

      if (esm && importStyleName == 'dot-default') {
        debug(`skipped test due to incompatible options: ${title}`);
        continue;
      }

      debug(`registered test: ${title}`);

      // eslint-disable-next-line jest/valid-title
      (process.env.NO_CONCURRENT ? it : it.concurrent)(title, async () => {
        // eslint-disable-next-line jest/no-standalone-expect
        expect.hasAssertions();

        debug(`started running test: ${title}`);

        const indexPath = `src/index.test.${esm ? 'm' : ''}js`;
        const importSpecifier = `${pkgName}${
          importSpecifierName == 'main' ? '' : '/pure'
        }`;

        const importStyle = {
          modern: '{ pluginTester }',
          'modern-default': '{ default: pluginTester }',
          default: 'pluginTester',
          'dot-default': 'pluginTester'
        }[importStyleName];

        const fixtureOptions = mergeWith(
          {},
          defaultFixtureOptions,
          {
            npmInstall: ['@babel/core@latest'],
            runWith: {
              binary: 'npx',
              args: ['node']
            }
          },
          {
            initialFileContents: {
              'fixtures/dummy-fixture-asset/code.js':
                assets.dummyFixtureAssetCode[importSpecifierName],
              'fixtures/dummy-fixture-asset/options.js':
                assets.dummyFixtureAssetOptions[importSpecifierName],
              'fixtures/dummy-fixture-asset/output.js':
                assets.dummyFixtureAssetOutput[importSpecifierName]
            }
          }
        );

        const sourceInput = withNodeTestInterop(assets.invocation)[importSpecifierName];
        const sourceCode =
          typeof sourceInput == 'string' ? sourceInput : sourceInput[esm ? 'esm' : 'cjs'];

        fixtureOptions.initialFileContents[indexPath] = esm
          ? `
            import ${
              esm ? importStyle.replaceAll(':', ' as') : importStyle
            } from '${importSpecifier}';
            import identifierReversePlugin from '../plugin-identifier-reverse.js';

            ${sourceCode}
          `
          : `
            const ${importStyle} = require('${importSpecifier}')${
              importStyleName == 'dot-default' ? '.default' : ''
            };
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

            expectSuccessAndOutput(context);
          }
        });
      });
    }
  }
}

debug('finished registering tests');
debug(`registered a total of ${counter} tests!`);
