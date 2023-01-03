/* eslint jest/require-hook: ["error", { "allowedFunctionCalls": ["pluginTester"] }] */

import path from 'node:path';

import { pluginTester } from '../src/index';
import { identifierReversePlugin } from './helpers/plugins';

const customFormatFunction = (r: string) => r;

// * babel-plugin-tester example from
// * https://github.com/jamiebuilds/babel-handbook/blob/master/translations/nl/plugin-handbook.md#babel-plugin-tester
pluginTester({
  plugin: identifierReversePlugin,
  fixtures: path.join(__dirname, 'fixtures/multiple'),
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

// * Simple example from README.md
pluginTester({
  plugin: identifierReversePlugin,
  snapshot: true,
  tests: [
    {
      code: '"hello";'
      // Snapshot should show that code has not changed.
    },
    {
      snapshot: false,
      code: 'var hello = "hi";',
      output: 'var olleh = "hi";'
    },
    `
      function sayHi(person) {
        return 'Hello ' + person + '!'
      }
      console.log(sayHi('Jenny'))
    `
  ]
});

// * Full example from README.md
pluginTester({
  // One (and ONLY ONE) of the two following lines MUST be included.
  plugin: identifierReversePlugin,
  //preset: coolNewBabelPreset,

  // Usually unnecessary if it is returned by the plugin. This will default to
  // 'unknown plugin' if a name cannot otherwise be inferred.
  pluginName: 'identifier reverse',
  // Unlike with pluginName, there is no presetName inference. This will default
  // to 'unknown preset' if a name is not provided.
  //presetName: 'cool-new-babel-preset',

  // Used to test specific plugin options.
  pluginOptions: {
    optionA: true
  },
  //presetOptions: {
  //  optionB: false,
  //}

  // Defaults to the plugin name.
  title: 'describe block title',

  // Only useful if you are using fixtures, codeFixture, outputFixture, or
  // execFixture options. Defaults to the absolute path of the file the
  // pluginTester function was invoked from, which in this case  is equivalent
  // to the following line:
  filepath: __filename,

  // These are the defaults that will be lodash.mergeWith'd with the provided
  // babelOptions option.
  babelOptions: {
    parserOpts: {},
    generatorOpts: {},
    babelrc: false,
    configFile: false
  },

  // Do not use snapshots across all tests, which is the default anyway. Note
  // that snapshots are only guaranteed to work with Jest
  snapshot: false,

  // Defaults to a function that formats with prettier
  formatResult: customFormatFunction,

  // You can provide tests as an object
  tests: {
    // The key is the title. The value is the code that is unchanged (because
    // snapshot == false across all tests). Test title will be: "1. does not
    // change code with no identifiers"
    'does not change code with no identifiers': '"hello";',

    // Test title will be: "2. changes this code"
    'changes this code': {
      // Input to the plugin
      code: 'var hello = "hi";',
      // Expected output
      output: 'var olleh = "hi";'
    }
  }
});

pluginTester({
  // One (and ONLY ONE) of the two following lines MUST be included.
  plugin: identifierReversePlugin,
  //preset: coolNewBabelPreset,

  // Usually unnecessary if it is returned by the plugin. This will default to
  // 'unknown plugin' if a name cannot otherwise be inferred.
  pluginName: 'identifier reverse',
  // Unlike with pluginName, there is no presetName inference. This will default
  // to 'unknown preset' if a name is not provided.
  //presetName: 'cool-new-babel-preset',

  // Used to test specific plugin options.
  pluginOptions: {
    optionA: true
  },
  //presetOptions: {
  //  optionB: false,
  //}

  // Defaults to the plugin name.
  title: 'describe block title',

  // Only useful if you are using fixtures, codeFixture, outputFixture, or
  // execFixture options. Defaults to the absolute path of the file the
  // pluginTester function was invoked from, which in this case  is equivalent
  // to the following line:
  filepath: __filename,

  // These are the defaults that will be lodash.mergeWith'd with the provided
  // babelOptions option.
  babelOptions: {
    parserOpts: {},
    generatorOpts: {},
    babelrc: false,
    configFile: false
  },

  // Do not use snapshots across all tests, which is the default anyway. Note
  // that snapshots are only guaranteed to work with Jest
  snapshot: false,

  // Defaults to a function that formats with prettier
  formatResult: customFormatFunction,

  // Alternatively, you can provide tests as an array
  tests: [
    // Should be unchanged by the plugin (because snapshot == false across all
    // tests). Test title will be: "1. identifier reverse"
    '"hello";',
    {
      // Test title will be: "2. identifier reverse"
      code: 'var hello = "hi";',
      output: 'var olleh = "hi";'
    },
    {
      // Test title will be: "3. unchanged code"
      title: 'unchanged code',
      // Because this is an absolute path, the filepath option above will not
      // be used to resolve this path
      codeFixture: path.join(__dirname, 'some-path', 'unchanged.js')
      // No output, outputFixture, or snapshot, so the assertion will be that
      // the plugin does not change this code
    },
    {
      // Because these are not absolute paths, they will be joined with the
      // directory of the filepath option provided above
      codeFixture: '__fixtures__/changed.js',
      // Because outputFixture is provided, the assertion will be that the
      // plugin will change the contents of "changed.js" to the contents of
      // "changed-output.js"
      outputFixture: '__fixtures__/changed-output.js'
    },
    {
      // As a convenience, this will have the indentation striped and it will
      // be trimmed
      code: `
        function sayHi(person) {
          return 'Hello ' + person + '!';
        }
      `,
      // This will take a Jest snapshot, overwriting the default/global
      // settings (set above). The snapshot will contain both source code and
      // the transformed output, making the snapshot file easier to understand
      snapshot: true
    },
    {
      code: 'var hello = "hi";',
      output: 'var olleh = "hi";',
      // This can be used to overwrite pluginOptions (set above)
      pluginOptions: {
        optionA: false
      }
      // This can be used to overwrite presetOptions (set above)
      //presetOptions: {
      //  optionB: true
      //}
    },
    {
      title: 'unchanged code',
      code: "'no change';",
      setup() {
        // Runs before this test
        return function teardown() {
          // Runs after this tests
        };
        // Can also return a promise
      },
      teardown() {
        // Runs after this test
        // Can return a promise
      }
    },
    {
      // This source will be transformed just like the code property, except the
      // produced code will be evaluated in the same CJS context as the the test
      // runner. This lets us make more advanced assertions on the output.
      exec: `
        const hello = "hi";
        // The plugin will reverse ALL identifiers, even globals like "expect"!
        tcepxe(hello)['toBe']("hi");
      `
    }
  ]
});