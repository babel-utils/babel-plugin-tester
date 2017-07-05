import assert from 'assert'
import path from 'path'
import fs from 'fs'
import pathExists from 'path-exists'
import merge from 'lodash.merge'
import invariant from 'invariant'
import * as babel from 'babel-core'
import stripIndent from 'strip-indent'
import {oneLine} from 'common-tags'

const noop = () => {}

module.exports = pluginTester

const fullDefaultConfig = {
  babelOptions: {
    parserOpts: {},
    generatorOpts: {},
    babelrc: false,
  },
}

function pluginTester(
  {
    plugin = requiredParam('plugin'),
    pluginName = getPluginName(plugin),
    title: describeBlockTitle = pluginName,
    pluginOptions,
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
      pluginOptions,
      title: describeBlockTitle,
      fixtures,
      filename,
      ...rest,
    })
  }
  const testAsArray = toTestArray(tests)
  if (!testAsArray.length) {
    return Promise.resolve()
  }
  const testerConfig = merge({}, fullDefaultConfig, rest)

  return describe(describeBlockTitle, () => {
    const promises = testAsArray.map((testConfig, index) => {
      if (!testConfig) {
        return Promise.resolve()
      }
      const {
        skip,
        only,
        title,
        code,
        babelOptions,
        output,
        snapshot,
        error,
        setup = noop,
        teardown,
      } = merge(
        {},
        testerConfig,
        toTestConfig({
          testConfig,
          index,
          plugin,
          pluginName,
          pluginOptions,
          filename,
        }),
      )
      assert(
        (!skip && !only) || skip !== only,
        'Cannot enable both skip and only on a test',
      )

      if (skip) {
        // eslint-disable-next-line jest/no-disabled-tests
        return it.skip(title, testerWrapper)
      } else if (only) {
        // eslint-disable-next-line jest/no-focused-tests
        return it.only(title, testerWrapper)
      } else {
        return it(title, testerWrapper)
      }

      async function testerWrapper() {
        const teardowns = teardown ? [teardown] : []
        let returnedTeardown
        try {
          returnedTeardown = await setup()
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('There was a problem during setup')
          throw e
        }
        if (typeof returnedTeardown === 'function') {
          teardowns.push(returnedTeardown)
        }
        try {
          tester()
        } finally {
          try {
            await Promise.all(teardowns.map(t => t()))
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('There was a problem during teardown')
            // eslint-disable-next-line no-unsafe-finally
            throw e
          }
        }
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
        invariant(
          !babelOptions.babelrc || babelOptions.filename,
          'babelrc set to true, but no filename specified in babelOptions',
        )
        invariant(
          !snapshot || !output,
          '`output` cannot be provided with `snapshot: true`',
        )

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
          assertError(result, error)
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

    return Promise.all(promises)
  })
}

function testFixtures({
  plugin,
  pluginOptions,
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
          {},
          fullDefaultConfig,
          {
            babelOptions: {
              plugins: [[plugin, pluginOptions]],
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

        assert.equal(actual, output, 'actual output does not match output.js')
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

function toTestConfig({
  testConfig,
  index,
  plugin,
  pluginName,
  pluginOptions,
  filename,
}) {
  if (typeof testConfig === 'string') {
    testConfig = {code: testConfig}
  }
  const {
    title,
    fixture,
    code = getCode(filename, fixture),
    fullTitle = `${index + 1}. ${title || pluginName}`,
    output = getCode(filename, testConfig.outputFixture),
    pluginOptions: testOptions = pluginOptions,
  } = testConfig
  return merge(
    {
      babelOptions: {filename: getPath(filename, fixture)},
    },
    testConfig,
    {
      babelOptions: {plugins: [[plugin, testOptions]]},
      title: fullTitle,
      code: stripIndent(code).trim(),
      output: stripIndent(output).trim(),
    },
  )
}

function getCode(filename, fixture) {
  if (!fixture) {
    return ''
  }
  return fs.readFileSync(getPath(filename, fixture), 'utf8')
}

function getPath(filename, basename) {
  if (!basename) {
    return undefined
  }
  if (path.isAbsolute(basename)) {
    return basename
  }
  return path.join(path.dirname(filename), basename)
}

// eslint-disable-next-line complexity
function assertError(result, error) {
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
  } else {
    invariant(
      typeof error === 'boolean',
      'The given `error` must be a function, string, boolean, or RegExp',
    )
  }
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
