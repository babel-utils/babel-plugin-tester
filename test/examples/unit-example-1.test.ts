/* eslint jest/require-hook: ["error", { "allowedFunctionCalls": ["pluginTester"] }] */

import path from 'node:path';

import { pluginTester } from 'universe';

import { identifierReversePlugin } from 'testverse:helpers/plugins.ts';

// * babel-plugin-tester example from
// * https://github.com/jamiebuilds/babel-handbook/blob/master/translations/nl/plugin-handbook.md#babel-plugin-tester
pluginTester({
  filepath: path.join(__dirname, '../file.js'),
  plugin: identifierReversePlugin,
  fixtures: 'fixtures/simple-reversed',
  tests: {
    'does not change code with no identifiers': "'hello';",
    'changes this code': {
      code: "var hello = 'hi';",
      output: "var olleh = 'hi';"
    },
    'using fixtures files': {
      fixture: 'fixtures/codeFixture.js',
      outputFixture: 'fixtures/outputFixture.js'
    },
    'using jest snapshots': {
      code: `
        function sayHi(person) {
          return 'Hello ' + person + '!'
        }
      `,
      snapshot: true
    }
  }
});
