pluginTester({
  plugin: identifierReversePlugin,
  tests: {
    'using snapshots': {
      code: `
        function sayHi(person) {
          return 'Hello ' + person + '!'
        }
      `,
      snapshot: true
    }
  }
});
