/* eslint jest/require-hook: ["error", { "allowedFunctionCalls": ["pluginTester"] }] */

import { pluginTester } from '../src/index';

beforeAll(() => {
  process.env.BABEL_8_BREAKING = '1';
});

afterAll(() => {
  delete process.env.BABEL_8_BREAKING;
});

pluginTester({
  pluginName: 'captains-log',
  plugin: () => ({
    name: 'captains-log',
    visitor: {
      VariableDeclaration(path) {
        throw new Error('bad');
        console.log('hello world!');
      }
    }
  }),
  tests: [
    {
      code: `var output = paragraph + "one"+\n\n'paragraph' + \`\\two\``,
      output: "var output = paragraph + 'one' + 'paragraph' + `\\two`;\n"
    }
  ]
});
