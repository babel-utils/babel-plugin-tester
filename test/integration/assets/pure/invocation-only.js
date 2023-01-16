pluginTester({
  filepath: `${__dirname}/../fixtures/fake.js`,
  plugin: identifierReversePlugin,
  tests: {
    'does not change code with no identifiers': "'hello';",
    'changes this code': {
      only: true,
      code: "var hello = 'hi';",
      output: "var olleh = 'hi';"
    },
    'using fixtures files': {
      fixture: 'dummy-fixture-asset/code.js',
      outputFixture: 'dummy-fixture-asset/output.js'
    }
  }
});
