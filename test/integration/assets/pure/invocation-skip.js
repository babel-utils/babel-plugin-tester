pluginTester({
  plugin: identifierReversePlugin,
  tests: {
    'does not change code with no identifiers': "'hello';",
    'changes this code': {
      skip: true,
      code: "var hello = 'hi';",
      output: "var olleh = 'hi';"
    },
    'using fixtures files': {
      skip: true,
      fixture: '../fixtures/dummy-fixture-asset/code.js',
      outputFixture: '../fixtures/dummy-fixture-asset/output.js'
    }
  }
});
