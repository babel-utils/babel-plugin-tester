import pluginTester from './plugin-tester'
import prettierFormatter from './formatters/prettier'
import unstringSnapshotSerializer from './unstring-snapshot-serializer'

// istanbul ignore else (it's not worth testing)
if (typeof expect !== 'undefined' && expect.addSnapshotSerializer) {
  expect.addSnapshotSerializer(unstringSnapshotSerializer)
}

export {unstringSnapshotSerializer, prettierFormatter}

function defaultPluginTester(options) {
  return pluginTester({formatResult: prettierFormatter, ...options})
}
export default defaultPluginTester
