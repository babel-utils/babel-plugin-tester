import pluginTester from '..'

pluginTester({
  pluginName: 'captains-log',
  plugin: () => ({name: 'captains-log', visitor: {}}),
  tests: [{code: 'var a = 1', output: 'var a = 1'}],
})
