/* eslint-disable jest/require-hook */

// * These are tests that ensure babel-plugin-tester works (1) in ESM vs CJS
// * environments, (2) using modern import syntax, (3) using main vs pure import
// * specifiers, (4) across all maintained versions of NodeJS.

import { existsSync } from 'node:fs';
import path from 'node:path';

import debugFactory from 'debug';
import mergeWith from 'lodash.mergewith';

import { exports as packageExports, name as packageName } from 'rootverse:package.json';

import { assets } from 'testverse:integration/assets.ts';
import { expectSuccessAndOutput } from 'testverse:integration/test-expectations.ts';
import { withMockedFixture } from 'testverse:setup.ts';

import {
  BABEL_VERSIONS_UNDER_TEST,
  defaultFixtureOptions,
  IMPORT_SPECIFIERS_UNDER_TEST,
  IMPORT_STYLES_UNDER_TEST,
  NODE_VERSIONS_UNDER_TEST
} from 'testverse:integration/.config.ts';

const TEST_IDENTIFIER = 'node-interop';
const debug = debugFactory(`${packageName}:${TEST_IDENTIFIER}`);

const packageMainPath = `${__dirname}/../../${packageExports['.'].default}`;
const packagePurePath = `${__dirname}/../../${packageExports['./pure'].default}`;

debug('BABEL_VERSIONS_UNDER_TEST: %O', BABEL_VERSIONS_UNDER_TEST);
debug('IMPORT_SPECIFIERS_UNDER_TEST: %O', IMPORT_SPECIFIERS_UNDER_TEST);
debug('IMPORT_STYLES_UNDER_TEST: %O', IMPORT_STYLES_UNDER_TEST);

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

          const fixtureOptions = mergeWith(
            {},
            defaultFixtureOptions,
            {
              runInstallScripts: true,
              npmInstall: ['@babel/core@latest', 'jest@latest', nodeVersion],
              runWith: {
                binary: 'npx',
                args: [
                  'node',
                  '--no-warnings',
                  '--experimental-vm-modules',
                  path.join('node_modules', 'jest', 'bin', 'jest')
                ]
              }
            },
            {
              initialFileContents: {
                'jest.config.js':
                  'module.exports = {testMatch:["**/?(*.)+(spec|test).?(m)[jt]s?(x)"],transform:{}};',
                'fixtures/dummy-fixture-asset/code.js':
                  assets.dummyFixtureAssetCode[importSpecifierName],
                'fixtures/dummy-fixture-asset/options.js':
                  assets.dummyFixtureAssetOptions[importSpecifierName],
                'fixtures/dummy-fixture-asset/output.js':
                  assets.dummyFixtureAssetOutput[importSpecifierName]
              }
            }
          );

          const sourceInput = assets.invocation[importSpecifierName];
          const sourceCode =
            typeof sourceInput === 'string'
              ? sourceInput
              : sourceInput[esm ? 'esm' : 'cjs'];

          fixtureOptions.initialFileContents[indexPath] = esm
            ? `
            import ${
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              esm ? importStyle.replaceAll(':', ' as') : importStyle
            } from '${importSpecifier}';
            import identifierReversePlugin from '../plugin-identifier-reverse.js';

            ${sourceCode}
          `
            : `
            const ${importStyle} = require('${importSpecifier}');
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
}

debug('finished registering tests');
debug(`registered a total of ${counter} tests!`);
