import pluginTesterAsDefault, { pluginTester, runPluginUnderTestHere } from '../src';

test('runPluginUnderTestHere is exported', () => {
  expect.hasAssertions();

  expect(typeof runPluginUnderTestHere).toBe('symbol');
});

pluginTesterAsDefault({
  pluginName: 'captains-log',
  plugin: () => ({ name: 'captains-log', visitor: {} }),
  tests: [{ code: 'var a = 1', output: 'var a = 1;' }]
});

pluginTester({
  pluginName: 'captains-log',
  plugin: () => ({ name: 'captains-log', visitor: {} }),
  tests: [{ code: 'var a = 1', output: 'var a = 1;' }]
});
