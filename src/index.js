import assert from 'assert'
import path from 'path'
import fs from 'fs'
import pathExists from 'path-exists'
import merge from 'lodash.merge'
import invariant from 'invariant'
import * as recast from 'recast'
import * as babel from 'babel-core'
import stripIndent from 'strip-indent'
import {oneLine} from 'common-tags'

module.exports = pluginTester

const fullDefaultConfig = {
  babelOptions: {
    parserOpts: {parser: recast.parse},
    generatorOpts: {generator: recast.print, lineTerminator: '\n'},
    babelrc: false,
  },
}

function pluginTester(
  {
    plugin = requiredParam('plugin'),
    pluginName = getPluginName(plugin),
    title: describeBlockTitle = pluginName,
    tests,
    fixtures,
    filename,
    ...rest
  } = {},
) {
  if (fixtures) {
    testFixtures({
      plugin,
      pluginName,
      title: describeBlockTitle,
      fixtures,
      filename,
      ...rest,
    })
  }
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
      const {
        modifier,
        title,
        code,
        babelOptions,
        output,
        snapshot,
        error,
      } = merge(
        {},
        testerConfig,
        toTestConfig({testConfig, index, plugin, pluginName, filename}),
      )

      if (modifier) {
        it[modifier](title, tester)
      } else {
        it(title, tester)
      }

      // eslint-disable-next-line complexity
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

        let result
        let errored = false

        try {
          result = babel.transform(code, babelOptions).code.trim()
        } catch (err) {
          if (error) {
            errored = true
            result = err
          } else {
            throw err
          }
        }

        const expectedToThrowButDidNot = error && !errored
        assert(
          !expectedToThrowButDidNot,
          'Expected to throw error, but it did not.',
        )

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
        } else if (error) {
          if (typeof error === 'function') {
            if (!(result instanceof error || error(result) === true)) {
              throw result
            }
          } else if (typeof error === 'string') {
            assert.equal(result.message, error, 'Error message is incorrect')
          } else if (error instanceof RegExp) {
            assert(
              error.test(result.message),
              `Expected ${result.message} to match ${error}`,
            )
          }
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

function testFixtures({
  plugin,
  title: describeBlockTitle,
  fixtures,
  filename,
  ...rest
}) {
  describe(`${describeBlockTitle} fixtures`, () => {
    const fixturesDir = getPath(filename, fixtures)
    fs.readdirSync(fixturesDir).forEach(caseName => {
      it(caseName.split('-').join(' '), () => {
        const fixtureDir = path.join(fixturesDir, caseName)
        const codePath = path.join(fixtureDir, 'code.js')
        const babelRcPath = path.join(fixtureDir, '.babelrc')

        const {babelOptions} = merge(
          fullDefaultConfig,
          {
            babelOptions: {
              plugins: [plugin],
              // if they have a babelrc, then we'll let them use that
              // otherwise, we'll just use our simple config
              babelrc: pathExists.sync(babelRcPath),
            },
          },
          rest,
        )
        const actual = babel
          .transformFileSync(codePath, babelOptions)
          .code.trim()

        const output = fs
          .readFileSync(path.join(fixtureDir, 'output.js'), 'utf8')
          .trim()

        assert.equal(output, actual, 'actual output does not match output.js')
      })
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

function toTestConfig({testConfig, index, plugin, pluginName, filename}) {
  if (typeof testConfig === 'string') {
    testConfig = {code: testConfig}
  }
  const {
    title,
    fixture,
    code = getCode(filename, fixture),
    fullTitle = `${index + 1}. ${title || pluginName}`,
    output = getCode(filename, testConfig.outputFixture),
  } = testConfig
  return merge({}, testConfig, {
    babelOptions: {plugins: [plugin]},
    title: fullTitle,
    code: stripIndent(code).trim(),
    output: stripIndent(output).trim(),
  })
}

function getCode(filename, fixture) {
  if (!fixture) {
    return ''
  }
  return fs.readFileSync(getPath(filename, fixture), 'utf8')
}

function getPath(filename, basename) {
  if (path.isAbsolute(basename)) {
    return basename
  }
  return path.join(path.dirname(filename), basename)
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
