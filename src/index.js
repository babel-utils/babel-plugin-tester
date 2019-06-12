/* eslint-disable jest/valid-describe */

import assert from 'assert'
import path from 'path'
import fs from 'fs'
import pathExists from 'path-exists'
import merge from 'lodash.merge'
import invariant from 'invariant'
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

function pluginTester({
  /* istanbul ignore next (TODO: write a test for this) */
  babel = require('@babel/core'),
  plugin = requiredParam('plugin'),
  pluginName = getPluginName(plugin, babel),
  title: describeBlockTitle = pluginName,
  pluginOptions,
  tests,
  fixtures,
  fixtureOutputName = 'output',
  filename,
  ...rest
} = {}) {
  let testNumber = 1
  if (fixtures) {
    testFixtures({
      plugin,
      pluginName,
      pluginOptions,
      title: describeBlockTitle,
      fixtures,
      fixtureOutputName,
      filename,
      babel,
      ...rest,
    })
  }
  const testAsArray = toTestArray(tests)
  if (!testAsArray.length) {
    return
  }
  const testerConfig = merge({}, fullDefaultConfig, rest)

  describe(describeBlockTitle, () => {
    testAsArray.forEach(testConfig => {
      if (!testConfig) {
        return
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
        formatResult = r => r,
      } = merge({}, testerConfig, toTestConfig(testConfig))
      assert(
        (!skip && !only) || skip !== only,
        'Cannot enable both skip and only on a test',
      )

      if (skip) {
        // eslint-disable-next-line jest/no-disabled-tests
        it.skip(title, testerWrapper)
      } else if (only) {
        // eslint-disable-next-line jest/no-focused-tests
        it.only(title, testerWrapper)
      } else {
        it(title, testerWrapper)
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
          result = formatResult(babel.transform(code, babelOptions).code)
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
        } else if (typeof output === 'string') {
          assert.equal(result, output, 'Output is incorrect.')
        } else {
          assert.equal(
            result.trim(),
            code.trim(),
            'Expected output to not change, but it did',
          )
        }
      }
    })
  })

  function toTestConfig(testConfig) {
    if (typeof testConfig === 'string') {
      testConfig = {code: testConfig}
    }
    const {
      title,
      fixture,
      code = getCode(filename, fixture),
      fullTitle = title || `${testNumber++}. ${pluginName}`,
      output = getCode(filename, testConfig.outputFixture) || undefined,
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
        ...(output ? {output: stripIndent(output).trim()} : {}),
      },
    )
  }
}

const createFixtureTests = (fixturesDir, options) => {
  if (!fs.statSync(fixturesDir).isDirectory()) return

  const rootOptionsPath = path.join(fixturesDir, 'options.json')
  let rootFixtureOptions = {}
  if (pathExists.sync(rootOptionsPath)) {
    rootFixtureOptions = require(rootOptionsPath)
  }

  fs.readdirSync(fixturesDir).forEach(caseName => {
    const fixtureDir = path.join(fixturesDir, caseName)
    const optionsPath = path.join(fixtureDir, 'options.json')
    const jsCodePath = path.join(fixtureDir, 'code.js')
    const tsCodePath = path.join(fixtureDir, 'code.ts')
    const blockTitle = caseName.split('-').join(' ')
    const codePath =
      (pathExists.sync(jsCodePath) && jsCodePath) ||
      (pathExists.sync(tsCodePath) && tsCodePath)

    let fixturePluginOptions = {}
    if (pathExists.sync(optionsPath)) {
      fixturePluginOptions = require(optionsPath)
    }

    if (!codePath) {
      describe(blockTitle, () => {
        createFixtureTests(fixtureDir, {
          ...options,
          pluginOptions: {
            ...rootFixtureOptions,
            ...options.pluginOptions,
            ...fixturePluginOptions,
          },
        })
      })
      return
    }

    const ext = /\.ts$/.test(codePath) ? '.ts' : '.js'
    it(blockTitle, () => {
      const {
        plugin,
        pluginOptions,
        fixtureOutputName,
        babel,
        formatResult = r => r,
        ...rest
      } = options

      const babelRcPath = path.join(fixtureDir, '.babelrc')

      const {babelOptions} = merge(
        {},
        fullDefaultConfig,
        {
          babelOptions: {
            plugins: [
              [
                plugin,
                {
                  ...rootFixtureOptions,
                  ...pluginOptions,
                  ...fixturePluginOptions,
                },
              ],
            ],
            // if they have a babelrc, then we'll let them use that
            // otherwise, we'll just use our simple config
            babelrc: pathExists.sync(babelRcPath),
          },
        },
        rest,
      )
      const actual = formatResult(
        babel.transformFileSync(codePath, babelOptions).code,
      )

      const outputPath = path.join(fixtureDir, `${fixtureOutputName}${ext}`)

      if (!fs.existsSync(outputPath)) {
        fs.writeFileSync(outputPath, actual)
        return
      }

      const output = fs.readFileSync(outputPath, 'utf8')

      assert.equal(
        actual.trim(),
        output.trim(),
        `actual output does not match ${fixtureOutputName}${ext}`,
      )
    })
  })
}

function testFixtures({
  title: describeBlockTitle,
  fixtures,
  filename,
  ...rest
}) {
  describe(`${describeBlockTitle} fixtures`, () => {
    const fixturesDir = getPath(filename, fixtures)
    createFixtureTests(fixturesDir, rest)
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
    assert(result.message.includes(error), 'Error message is incorrect')
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

function getPluginName(plugin, babel) {
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

/*
eslint
  complexity: "off"
*/
