import assert from 'assert'
import path from 'path'
import fs from 'fs'
import {EOL} from 'os'
import mergeWith from 'lodash.mergewith'
import stripIndent from 'strip-indent'

export const runPluginUnderTestHere = Symbol('run-plugin-under-test-here')

const noop = () => {}

// thanks to node throwing an error if you try to use instanceof with an arrow
// function we have to have this function. I guess it's spec... SMH...
// NOTE: I tried doing the "proper thing" using Symbol.hasInstance
// but no matter what that did, I couldn't make that work with a SyntaxError
// because SyntaxError[Symbol.hasInstance]() returns false. What. The. Heck!?
// So I'm doing this .prototype stuff :-/
function instanceOf(inst, cls) {
  return cls.prototype !== undefined && inst instanceof cls
}

const fullDefaultConfig = {
  babelOptions: {
    parserOpts: {},
    generatorOpts: {},
    babelrc: false,
    configFile: false,
  },
}

function mergeCustomizer(objValue, srcValue) {
  if (Array.isArray(objValue)) {
    return objValue.concat(srcValue)
  }
  return undefined
}

function pluginTester({
  /* istanbul ignore next (TODO: write a test for this) */
  babel = require('@babel/core'),
  plugin = requiredParam('plugin'),
  pluginName,
  title: describeBlockTitle,
  pluginOptions,
  tests,
  fixtures,
  fixtureOutputName = 'output',
  filename,
  endOfLine = 'lf',
  ...rest
} = {}) {
  const tryInferPluginName = () => {
    try {
      // https://github.com/babel/babel/blob/abb26aaac2c0f6d7a8a8a1d03cde3ebc5c3c42ae/packages/babel-helper-plugin-utils/src/index.ts#L53-L70
      return plugin(
        {assertVersion: () => {}, targets: () => ({}), assumption: () => {}},
        {},
        process.cwd(),
      ).name
    } catch {
      return undefined
    }
  }

  pluginName = pluginName || tryInferPluginName() || 'unknown plugin'
  describeBlockTitle = describeBlockTitle || pluginName

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
      endOfLine,
      ...rest,
    })
  }
  const testAsArray = toTestArray(tests)
  if (!testAsArray.length) {
    return
  }
  const testerConfig = mergeWith({}, fullDefaultConfig, rest, mergeCustomizer)

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
        fixture,
        testFilepath: testFilename = fixture || filename,
      } = mergeWith({}, testerConfig, toTestConfig(testConfig), mergeCustomizer)

      assert(
        (!skip && !only) || skip !== only,
        'Cannot enable both skip and only on a test',
      )

      finalizePluginRunOrder(babelOptions)

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
          await tester()
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
      async function tester() {
        assert(
          code,
          'A string or object with a `code` or `fixture` property must be provided',
        )
        assert(
          !babelOptions.babelrc || babelOptions.filename,
          'babelrc set to true, but no filename specified in babelOptions',
        )
        assert(
          !snapshot || !output,
          '`output` cannot be provided with `snapshot: true`',
        )

        let result, transformed
        let errored = false

        try {
          if (babel.transformAsync) {
            transformed = await babel.transformAsync(code, babelOptions)
          } else {
            transformed = babel.transform(code, babelOptions)
          }
          result = formatResult(
            fixLineEndings(transformed.code, endOfLine, code),
            {filename: testFilename},
          )
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
          assert(
            result !== code,
            'Code was unmodified but attempted to take a snapshot. If the code should not be modified, set `snapshot: false`',
          )
          const separator = '\n\n      ↓ ↓ ↓ ↓ ↓ ↓\n\n'
          const formattedOutput = [code, separator, result].join('')
          expect(`\n${formattedOutput}\n`).toMatchSnapshot(title)
        } else if (error) {
          assertError(result, error)
        } else if (typeof output === 'string') {
          assert.equal(result.trim(), output.trim(), 'Output is incorrect.')
        } else {
          assert.equal(
            result.trim(),
            fixLineEndings(code, endOfLine),
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
    return mergeWith(
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
      mergeCustomizer,
    )
  }
}

function fixLineEndings(string, endOfLine, input = string) {
  return String(string).replace(/\r?\n/g, getReplacement()).trim()

  function getReplacement() {
    switch (endOfLine) {
      case 'lf': {
        return '\n'
      }
      case 'crlf': {
        return '\r\n'
      }
      case 'auto': {
        return EOL
      }
      case 'preserve': {
        const match = input.match(/\r?\n/)
        if (match === null) {
          return EOL
        }
        return match[0]
      }
      default: {
        throw new Error("Invalid 'endOfLine' value")
      }
    }
  }
}

const createFixtureTests = (fixturesDir, options) => {
  if (!fs.statSync(fixturesDir).isDirectory()) return

  const rootOptionsPath = path.join(fixturesDir, 'options.json')
  let rootFixtureOptions = {}
  if (fs.existsSync(rootOptionsPath)) {
    rootFixtureOptions = require(rootOptionsPath)
  }

  fs.readdirSync(fixturesDir).forEach(caseName => {
    const fixtureDir = path.join(fixturesDir, caseName)
    const optionsPath = path.join(fixtureDir, 'options.json')
    const jsCodePath = path.join(fixtureDir, 'code.js')
    const tsCodePath = path.join(fixtureDir, 'code.ts')
    const jsxCodePath = path.join(fixtureDir, 'code.jsx')
    const tsxCodePath = path.join(fixtureDir, 'code.tsx')
    const blockTitle = caseName.split('-').join(' ')
    const codePath =
      (fs.existsSync(jsCodePath) && jsCodePath) ||
      (fs.existsSync(tsCodePath) && tsCodePath) ||
      (fs.existsSync(jsxCodePath) && jsxCodePath) ||
      (fs.existsSync(tsxCodePath) && tsxCodePath)
    let localFixtureOptions = {}
    if (fs.existsSync(optionsPath)) {
      localFixtureOptions = require(optionsPath)
    }

    const mergedFixtureAndPluginOptions = {
      ...rootFixtureOptions,
      ...options.pluginOptions,
      ...localFixtureOptions,
    }

    if (!codePath) {
      describe(blockTitle, () => {
        createFixtureTests(fixtureDir, {
          ...options,
          pluginOptions: mergedFixtureAndPluginOptions,
        })
      })
      return
    }

    const {only, skip, title} = localFixtureOptions

    assert(
      (!skip && !only) || skip !== only,
      'Cannot enable both skip and only on a test',
    )
    ;(only ? it.only : skip ? it.skip : it)(title || blockTitle, async () => {
      const {
        plugin,
        pluginOptions,
        fixtureOutputName,
        babel,
        endOfLine,
        formatResult = r => r,
        ...rest
      } = options

      const hasBabelrc = [
        '.babelrc',
        '.babelrc.js',
        '.babelrc.cjs',
      ].some(babelrc => fs.existsSync(path.join(fixtureDir, babelrc)))

      const {babelOptions} = mergeWith(
        {},
        fullDefaultConfig,
        {
          babelOptions: {
            // if they have a babelrc, then we'll let them use that
            // otherwise, we'll just use our simple config
            babelrc: hasBabelrc,
          },
        },
        rest,
        {
          babelOptions: {
            // Ensure `rest` comes before `babelOptions.plugins` to preserve
            // default plugin run order
            plugins: [[plugin, mergedFixtureAndPluginOptions]],
          },
        },
        mergeCustomizer,
      )

      finalizePluginRunOrder(babelOptions)

      const input = fs.readFileSync(codePath).toString()
      let transformed, ext
      if (babel.transformAsync) {
        transformed = await babel.transformAsync(input, {
          ...babelOptions,
          filename: codePath,
        })
      } else {
        transformed = babel.transform(input, {
          ...babelOptions,
          filename: codePath,
        })
      }
      const actual = formatResult(
        fixLineEndings(transformed.code, endOfLine, input),
      )

      const {fixtureOutputExt} = mergedFixtureAndPluginOptions

      if (fixtureOutputExt) {
        ext = fixtureOutputExt
      } else {
        ext = `.${codePath.split('.').pop()}`
      }

      const outputPath = path.join(fixtureDir, `${fixtureOutputName}${ext}`)

      if (!fs.existsSync(outputPath)) {
        fs.writeFileSync(outputPath, actual)
        return
      }

      const output = fs.readFileSync(outputPath, 'utf8')

      assert.equal(
        actual.trim(),
        fixLineEndings(output, endOfLine),
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
    if (!(instanceOf(result, error) || error(result) === true)) {
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
    assert(
      typeof error === 'boolean',
      'The given `error` must be a function, string, boolean, or RegExp',
    )
  }
}

function requiredParam(name) {
  throw new Error(`${name} is a required parameter.`)
}

function finalizePluginRunOrder(babelOptions) {
  if (babelOptions.plugins.includes(runPluginUnderTestHere)) {
    babelOptions.plugins.splice(
      babelOptions.plugins.indexOf(runPluginUnderTestHere),
      1,
      babelOptions.plugins.pop(),
    )
  }
}

export default pluginTester

// unfortunately the ESLint plugin for Jest thinks this is a test file
// a better solution might be to adjust the eslint config so it doesn't
// but I don't have time to do that at the moment.
/*
eslint
  complexity: off,
  jest/valid-describe: off,
  jest/no-if: off,
  jest/valid-title: off,
  jest/no-export: off,
  jest/no-try-expect: off,
  jest/no-conditional-expect: off,
*/
