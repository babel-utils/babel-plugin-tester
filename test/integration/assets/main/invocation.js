pluginTester({
  plugin: identifierReversePlugin,
  fixtures: '../fixtures',
  tests: {
    'does not change code with no identifiers': '"hello";',
    'changes this code': {
      code: "var hello = 'hi';",
      output: 'var olleh = "hi";'
    },
    'using fixtures files': {
      fixture: '../fixtures/dummy-fixture-asset/code.js',
      outputFixture: '../fixtures/dummy-fixture-asset/output.js'
    }
  }
});
