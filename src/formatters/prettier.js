import path from 'path'
import prettier from 'prettier'

const configByDir = {}
function getConfig(dir) {
  if (!configByDir.hasOwnProperty(dir)) {
    configByDir[dir] = prettier.resolveConfig.sync(dir)
  }
  return configByDir[dir]
}

function prettierFormatter(
  code,
  {
    cwd = process.cwd(),
    filename = path.join(cwd, 'macro-test.js'),
    config = getConfig(cwd),
  } = {},
) {
  return prettier.format(code, {
    filepath: filename,
    ...config,
  })
}

export default prettierFormatter
