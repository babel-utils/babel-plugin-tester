import assert from 'assert'
import path from 'path'
import fs from 'fs'
import merge from 'lodash.merge'
import invariant from 'invariant'
import * as recast from 'recast'
import * as babel from 'babel-core'
import stripIndent from 'strip-indent'
import {oneLine} from 'common-tags'

module.exports = pluginTester

const fullDefaultConfig = {
  parserOpts: {parser: recast.parse},
  generatorOpts: {generator: recast.print, lineTerminator: '\n'},
  babelrc: false,
}

function pluginTester(
  {
    plugin = requiredParam('plugin'),
    pluginName = getPluginName(plugin),
    title: describeBlockTitle = pluginName,
    tests,
    fixtures,
    ...rest
  } = {},
) {
  const testAsArray = toTestArray(tests)
  if (!testAsArray.length) {
    return
  }
  const testerConfig = merge({}, fullDefaultConfig, rest)

  describe(describeBlockTitle, () => {
    testAsArray.forEach((testConfig, index) => {
      if (!testConfig) {
        return
      }
      const {modifier, title, code, babelOptions, output, snapshot} = merge(
        {},
        testerConfig,
        toTestConfig({testConfig, index, plugin, pluginName, fixtures}),
      )

      if (modifier) {
        it[modifier](title, tester)
      } else {
        it(title, tester)
      }

      function tester() {
        invariant(
          code,
          oneLine`
            A string or object with a \`code\` or
            \`fixture\` property must be provided
          `,
        )
        if (snapshot) {
          invariant(
            !output,
            '`output` cannot be provided with `snapshot: true`',
          )
        }
        const result = babel.transform(code, babelOptions).code.trim()
        if (snapshot) {
          invariant(
            result !== code,
            oneLine`
              Code was unmodified but attempted to take a snapshot.
              If the code should not be modified, set \`snapshot: false\`
            `,
          )
          const separator = '\n\n      ↓ ↓ ↓ ↓ ↓ ↓\n\n'
          const formattedOutput = [code, separator, result].join('')
          expect(`\n${formattedOutput}\n`).toMatchSnapshot(title)
        } else if (output) {
          assert.equal(result, output, 'Output is incorrect.')
        } else {
          assert.equal(
            result,
            code,
            'Expected output to not change, but it did',
          )
        }
      }
    })
  })
}

function toTestArray(tests) {
  tests = tests || [] // null/0/false are ok, so no default param
  if (Array.isArray(tests)) {
    return tests
  }
  return Object.keys(tests).reduce((testsArray, key) => {
    let value = tests[key]
    if (typeof value === 'string') {
      value = {code: value}
    }
    testsArray.push({
      title: key,
      ...value,
    })
    return testsArray
  }, [])
}

function toTestConfig({testConfig, index, plugin, pluginName, fixtures}) {
  if (typeof testConfig === 'string') {
    testConfig = {code: stripIndent(testConfig).trim()}
  }
  const {
    title,
    fixture,
    code = getCode(fixtures, fixture),
    fullTitle = `${index + 1}. ${title || pluginName}`,
    output = getCode(fixtures, testConfig.outputFixture),
  } = testConfig
  return merge({}, testConfig, {
    babelOptions: {plugins: [plugin]},
    title: fullTitle,
    code: code.trim(),
    output: output.trim(),
  })
}

function getCode(fixtures, fixture) {
  if (!fixture) {
    return ''
  }
  let fullPath = fixture
  if (!path.isAbsolute(fixture)) {
    fullPath = path.join(fixtures, fixture)
  }
  return fs.readFileSync(fullPath, 'utf8')
}

function requiredParam(name) {
  throw new Error(`${name} is a required parameter.`)
}

function getPluginName(plugin) {
  let name
  try {
    name = plugin(babel).name
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(
      oneLine`
        Attempting to infer the name of your plugin failed.
        Tried to invoke the plugin which threw the error.
      `,
    )
    throw error
  }
  invariant(name, 'The `pluginName` must be inferable or provided.')
  return name
}
