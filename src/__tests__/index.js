import fs from 'fs'
import path from 'path'
import assert from 'assert'
// eslint-disable-next-line import/default
import pluginTester from '../'
import identifierReversePlugin from './helpers/identifier-reverse-plugin'

const babel = require('@babel/core')

let errorSpy,
  describeSpy,
  itSpy,
  itOnlySpy,
  itSkipSpy,
  equalSpy,
  transformSpy,
  writeFileSyncSpy,
  pendingTests

const noop = () => {}
// eslint-disable-next-line require-await
const promiseWrap = async fn => fn()
const describeMock = (title, body) => {
  body()
}
const titleTesterMock = (title, testFn) => {
  pendingTests.push(promiseWrap(testFn))
}

const simpleTest = 'var hi = "hey";'

const runPluginTester = async (...args) => {
  pendingTests = []
  try {
    pluginTester(...args)
    return await Promise.all(pendingTests)
  } finally {
    pendingTests = []
  }
}

beforeEach(() => {
  equalSpy = jest.spyOn(assert, 'equal')
  errorSpy = jest.spyOn(console, 'error').mockImplementation(noop)
  describeSpy = jest.spyOn(global, 'describe').mockImplementation(describeMock)
  itSpy = jest.spyOn(global, 'it').mockImplementation(titleTesterMock)
  global.it.only = jest.fn(titleTesterMock)
  global.it.skip = jest.fn(titleTesterMock)
  itOnlySpy = global.it.only
  itSkipSpy = global.it.skip
  transformSpy = jest.spyOn(babel, 'transform')
  writeFileSyncSpy = jest
    .spyOn(fs, 'writeFileSync')
    .mockImplementation(() => {})
})

afterEach(() => {
  equalSpy.mockRestore()
  errorSpy.mockRestore()
  describeSpy.mockRestore()
  itSpy.mockRestore()
  itSkipSpy.mockRestore()
  transformSpy.mockRestore()
  writeFileSyncSpy.mockRestore()
})

test('plugin is required', async () => {
  await expect(runPluginTester()).rejects.toThrowErrorMatchingSnapshot()
})

test('logs when plugin name is not inferable and rethrows errors', async () => {
  const error = new Error('hey there')
  await expect(
    runPluginTester({
      plugin: () => {
        throw error
      },
    }),
  ).rejects.toThrow(error)
  expect(errorSpy).toHaveBeenCalledTimes(1)
  expect(errorSpy).toHaveBeenCalledWith(
    expect.stringMatching(/infer.*name.*plugin/),
  )
})

test('throws an invariant if the plugin name is not inferable', async () => {
  await expect(
    runPluginTester({
      plugin: () => ({}),
    }),
  ).rejects.toThrowErrorMatchingSnapshot()
})

test('exists early if no tests are supplied', async () => {
  const {plugin} = getOptions()
  await runPluginTester({plugin})
  expect(describeSpy).not.toHaveBeenCalled()
  expect(itSpy).not.toHaveBeenCalled()
})

test('exits early if tests is an empty array', async () => {
  const {plugin} = getOptions()
  await runPluginTester({plugin, tests: []})
  expect(describeSpy).not.toHaveBeenCalled()
  expect(itSpy).not.toHaveBeenCalled()
})

test('accepts a title for the describe block', async () => {
  const title = 'describe block title'
  await runPluginTester(getOptions({title}))
  expect(describeSpy).toHaveBeenCalledWith(title, expect.any(Function))
})

test('can infer the plugin name for the describe block', async () => {
  const name = 'super-great'
  const {plugin, tests} = getOptions({
    plugin: () => ({name, visitor: {}}),
  })
  await runPluginTester({plugin, tests})
  expect(describeSpy).toHaveBeenCalledTimes(1)
  expect(describeSpy).toHaveBeenCalledWith(name, expect.any(Function))
})

test('calls describe and test for a group of tests', async () => {
  const pluginName = 'supergirl'
  const customTitle = 'some custom title'
  const options = getOptions({
    pluginName,
    tests: [simpleTest, simpleTest, {code: simpleTest, title: customTitle}],
  })
  await runPluginTester(options)
  expect(describeSpy).toHaveBeenCalledTimes(1)
  expect(describeSpy).toHaveBeenCalledWith(
    options.pluginName,
    expect.any(Function),
  )
  expect(itSpy).toHaveBeenCalledTimes(3)
  expect(itSpy.mock.calls).toEqual([
    [`1. ${pluginName}`, expect.any(Function)],
    [`2. ${pluginName}`, expect.any(Function)],
    [`${customTitle}`, expect.any(Function)],
  ])
})

test('tests can be skipped', async () => {
  const {plugin} = getOptions()
  await runPluginTester({plugin, tests: [{skip: true, code: '"hey";'}]})
  expect(itSkipSpy).toHaveBeenCalledTimes(1)
  expect(itSpy).not.toHaveBeenCalled()
})

test('tests can be only-ed', async () => {
  const {plugin} = getOptions()
  await runPluginTester({plugin, tests: [{only: true, code: '"hey";'}]})
  expect(itOnlySpy).toHaveBeenCalledTimes(1)
  expect(itSpy).not.toHaveBeenCalled()
})

test('tests cannot be both only-ed and skipped', async () => {
  const {plugin} = getOptions()
  await expect(
    runPluginTester({
      plugin,
      tests: [{only: true, skip: true, code: '"hey";'}],
    }),
  ).rejects.toThrowErrorMatchingSnapshot()
})

test('default will throw if output changes', async () => {
  const tests = ['var hello = "hi";']
  const options = getOptions({plugin: identifierReversePlugin, tests})
  await snapshotOptionsError(options)
})

test('skips falsy tests', async () => {
  const tests = [simpleTest, undefined, null, simpleTest]
  await runPluginTester(getOptions({tests}))
  expect(itSpy).toHaveBeenCalledTimes(2)
})

test('throws if output is incorrect', async () => {
  const tests = [{code: '"hi";', output: '"hey";'}]
  await snapshotOptionsError(getOptions({tests}))
})

test(`throws invariant if there's no code`, async () => {
  const tests = [{}]
  await snapshotOptionsError(getOptions({tests}))
})

test('trims and deindents code and output', async () => {
  const tests = [
    {
      code: `
        var someCode = 'cool';
      `,
      output: `
        var someCode = 'cool';
      `,
    },
  ]
  await runPluginTester(getOptions({tests}))
  expect(equalSpy).toHaveBeenCalledWith(
    `var someCode = 'cool';`,
    `var someCode = 'cool';`,
    expect.any(String),
  )
})

test('accepts an empty output', async () => {
  const tests = [
    {
      code: `var eraseMe = 'junk'`,
      output: '',
    },
  ]
  let errorResponse
  try {
    await runPluginTester(
      getOptions({
        plugin: () => ({
          name: 'cleanup',
          visitor: {
            VariableDeclaration(p) {
              p.remove()
            },
          },
        }),
        tests,
      }),
    )
    errorResponse = false
  } catch (error) {
    errorResponse = true
  }

  expect(errorResponse).toEqual(false)
})

test('can get a code and output fixture that is an absolute path', async () => {
  const tests = [
    {
      fixture: getFixturePath('fixture1.js'),
      outputFixture: getFixturePath('outure1.js'),
    },
  ]
  try {
    await runPluginTester(getOptions({tests}))
  } catch (error) {
    const actual = getFixtureContents('fixture1.js')
    const expected = getFixtureContents('outure1.js')
    expect(error).toMatchObject({
      name: expect.stringMatching(/AssertionError/),
      message: 'Output is incorrect.',
      actual,
      expected,
    })
  }
})

test('can pass with fixture and outputFixture', async () => {
  const tests = [
    {
      fixture: getFixturePath('fixture1.js'),
      outputFixture: getFixturePath('fixture1.js'),
    },
  ]
  await runPluginTester(getOptions({tests}))
})

test('throws error if fixture provided and code changes', async () => {
  const tests = [{fixture: getFixturePath('fixture1.js')}]
  await snapshotOptionsError(
    getOptions({plugin: identifierReversePlugin, tests}),
  )
})

test('can resolve a fixture with the filename option', async () => {
  const tests = [
    {
      fixture: 'fixtures/fixture1.js',
      outputFixture: 'fixtures/outure1.js',
    },
  ]
  try {
    await runPluginTester(getOptions({filename: __filename, tests}))
  } catch (error) {
    const actual = getFixtureContents('fixture1.js')
    const expected = getFixtureContents('outure1.js')
    expect(error).toMatchObject({
      name: expect.stringMatching(/AssertionError/),
      message: 'Output is incorrect.',
      actual,
      expected,
    })
  }
})

test('can pass tests in fixtures relative to the filename', async () => {
  await runPluginTester(
    getOptions({
      filename: __filename,
      fixtures: 'fixtures/fixtures',
      tests: null,
    }),
  )
  expect(describeSpy).toHaveBeenCalledTimes(5)
  expect(itSpy).toHaveBeenCalledTimes(8)
  expect(itSpy.mock.calls).toEqual([
    [`changed`, expect.any(Function)],
    [`nested a`, expect.any(Function)],
    [`nested b`, expect.any(Function)],
    [`typescript`, expect.any(Function)],
    [`unchanged`, expect.any(Function)],
    [`nested with option`, expect.any(Function)],
    [`nested without option`, expect.any(Function)],
    [`without output file`, expect.any(Function)],
  ])
})

test('can fail tests in fixtures at an absolute path', async () => {
  try {
    await runPluginTester(
      getOptions({
        plugin: identifierReversePlugin,
        tests: null,
        fixtures: getFixturePath('failing-fixtures'),
      }),
    )
  } catch (error) {
    expect(error.message).toMatchSnapshot()
  }
})

test('creates output file for new tests', async () => {
  await runPluginTester(
    getOptions({
      filename: __filename,
      fixtures: 'fixtures/fixtures',
      tests: null,
    }),
  )

  expect(writeFileSyncSpy.mock.calls[0]).toEqual([
    expect.stringMatching(/(\/|\\)output\.(j|t)s$/),
    "'use strict';",
  ])
})

test('uses the fixture filename in babelOptions', async () => {
  const fixture = getFixturePath('fixture1.js')
  const tests = [
    {
      fixture,
      outputFixture: getFixturePath('fixture1.js'),
    },
  ]
  await runPluginTester(getOptions({tests}))
  expect(transformSpy).toHaveBeenCalledTimes(1)
  expect(transformSpy).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      filename: fixture,
    }),
  )
})

test('allows for a test babelOptions can provide a filename', async () => {
  const filename = getFixturePath('outure1.js')
  const tests = [
    {
      babelOptions: {filename},
      fixture: getFixturePath('fixture1.js'),
      outputFixture: getFixturePath('fixture1.js'),
    },
  ]
  await runPluginTester(getOptions({tests}))
  expect(transformSpy).toHaveBeenCalledTimes(1)
  expect(transformSpy).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      filename,
    }),
  )
})

test('can provide a test filename for code strings', async () => {
  const filename = getFixturePath('outure1.js')
  const tests = [{babelOptions: {filename}, code: simpleTest}]
  await runPluginTester(getOptions({tests}))
  expect(transformSpy).toHaveBeenCalledTimes(1)
  expect(transformSpy).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      filename,
    }),
  )
})

test('can provide plugin options', async () => {
  const tests = [simpleTest]
  const pluginOptions = {
    optionA: true,
  }
  await runPluginTester(getOptions({tests, pluginOptions}))
  expect(transformSpy).toHaveBeenCalledTimes(1)
  expect(transformSpy).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      plugins: expect.arrayContaining([
        [
          expect.any(Function),
          expect.objectContaining({
            optionA: true,
          }),
        ],
      ]),
    }),
  )
})

test('can overwrite plugin options at test level', async () => {
  const pluginOptions = {
    optionA: false,
  }
  const tests = [{code: simpleTest, pluginOptions}]
  await runPluginTester(
    getOptions({
      tests,
      pluginOptions: {
        optionA: true,
      },
    }),
  )
  expect(transformSpy).toHaveBeenCalledTimes(1)
  expect(transformSpy).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      plugins: expect.arrayContaining([
        [
          expect.any(Function),
          expect.objectContaining({
            optionA: false,
          }),
        ],
      ]),
    }),
  )
})

test('throws invariant if snapshot and output are both provided', async () => {
  const tests = [{code: simpleTest, output: 'anything', snapshot: true}]
  await snapshotOptionsError(getOptions({tests}))
})

test('snapshot option can be derived from the root config', async () => {
  const tests = [{code: simpleTest, output: 'anything'}]
  await snapshotOptionsError(getOptions({snapshot: true, tests}))
})

test('throws invariant if code is unchanged + snapshot enabled', async () => {
  const tests = [simpleTest]
  await snapshotOptionsError(getOptions({snapshot: true, tests}))
})

test('takes a snapshot', async () => {
  // this one is kinda tricky... At first I thought I'd mock toMatchSnapshot
  // but then I realized that we can actually use it to our advantage in
  // this case. We actually _do_ take a snapshot and that makes our test
  // work pretty well soooooo... 😀
  const tests = [simpleTest]
  await runPluginTester(
    getOptions({snapshot: true, tests, plugin: identifierReversePlugin}),
  )
})

test('can provide an object for tests', async () => {
  const firstTitle = 'first title'
  const secondTitle = 'second title'
  const tests = {
    [firstTitle]: simpleTest,
    [secondTitle]: {
      code: simpleTest,
    },
  }
  await runPluginTester(getOptions({tests}))
  expect(equalSpy).toHaveBeenCalledTimes(2)
  expect(equalSpy.mock.calls).toEqual([
    [simpleTest, simpleTest, expect.any(String)],
    [simpleTest, simpleTest, expect.any(String)],
  ])
  expect(itSpy.mock.calls).toEqual([
    [firstTitle, expect.any(Function)],
    [secondTitle, expect.any(Function)],
  ])
})

test('can capture errors with true', () => testPluginError(true))

test('can capture errors with Error constructor', () =>
  testPluginError(SyntaxError))

test('can capture errors with string', () => testPluginError('test message'))

test('can capture errors with regex', () => testPluginError(/mess/))

test('can capture errors with function', () =>
  testPluginError(
    err => /mess/.test(err.message) && err instanceof SyntaxError,
  ))

test(`throws error when function doesn't return true`, () =>
  snapshotPluginError(() => false))

test('throws error when error expected but no error thrown', () =>
  snapshotPluginError(true, {
    plugin: () => ({}),
  }))

test('throws error if there is a problem parsing', async () => {
  let error
  try {
    await runPluginTester(
      getOptions({
        tests: [`][fkfhgo]fo{r`],
        babelOptions: {filename: __filename},
      }),
    )
  } catch (e) {
    error = e
  }
  expect(error.constructor).toBe(SyntaxError)
  expect(error.message).toContain('Unexpected token (1:0)')
})

test(`throws an error if babelrc is true with no filename`, () => {
  const tests = ['"use strict";']
  snapshotOptionsError(getOptions({tests, babelOptions: {babelrc: true}}))
})

test('runs test setup function', async () => {
  const setupSpy = jest.fn()
  const tests = [{code: simpleTest, setup: setupSpy}]
  await runPluginTester(getOptions({tests}))
  expect(setupSpy).toHaveBeenCalledTimes(1)
})

test('runs test teardown function', async () => {
  const teardownSpy = jest.fn()
  const tests = [{code: simpleTest, teardown: teardownSpy}]
  await runPluginTester(getOptions({tests}))
  expect(teardownSpy).toHaveBeenCalledTimes(1)
})

test('setup can return a teardown function', async () => {
  const teardownSpy = jest.fn()
  const setupSpy = jest.fn(() => teardownSpy)
  const tests = [{code: simpleTest, setup: setupSpy}]
  await runPluginTester(getOptions({tests}))
  expect(teardownSpy).toHaveBeenCalledTimes(1)
})

test('function resolved from setup promise used for teardown', async () => {
  const teardownSpy = jest.fn()
  const setupSpy = jest.fn(() => Promise.resolve(teardownSpy))
  const tests = [{code: simpleTest, setup: setupSpy}]
  await runPluginTester(getOptions({tests}))
  expect(teardownSpy).toHaveBeenCalledTimes(1)
})

test('error logged and thrown if setup throws', async () => {
  const errorToThrow = new Error('blah')
  const setupSpy = jest.fn(() => {
    throw errorToThrow
  })
  const tests = [{code: simpleTest, setup: setupSpy}]
  const errorThrown = await runPluginTester(getOptions({tests})).catch(e => e)
  expect(errorThrown).toBe(errorToThrow)
  expect(errorSpy).toHaveBeenCalledWith(
    expect.stringMatching(/problem.*setup/i),
  )
})

test('error logged and thrown if teardown throws', async () => {
  const errorToThrow = new Error('blah')
  const teardownSpy = jest.fn(() => {
    throw errorToThrow
  })
  const tests = [{code: simpleTest, teardown: teardownSpy}]
  const errorThrown = await runPluginTester(getOptions({tests})).catch(e => e)
  expect(errorThrown).toBe(errorToThrow)
  expect(errorSpy).toHaveBeenCalledWith(
    expect.stringMatching(/problem.*teardown/i),
  )
})

test('allows formatting the result', async () => {
  const formatResultSpy = jest.fn(r => r)
  await runPluginTester(
    getOptions({
      tests: [{code: simpleTest, formatResult: formatResultSpy}],
    }),
  )
  expect(formatResultSpy).toHaveBeenCalledTimes(1)
  expect(formatResultSpy).toHaveBeenCalledWith(simpleTest)
})

test('allows formatting fixtures results', async () => {
  const formatResultSpy = jest.fn(r => r)
  await runPluginTester(
    getOptions({
      fixtures: getFixturePath('fixtures'),
      formatResult: formatResultSpy,
    }),
  )
  expect(formatResultSpy).toHaveBeenCalledTimes(9)
})

test('works with a formatter adding a empty line', async () => {
  // Simulate prettier adding an empty line at the end
  const formatResultSpy = jest.fn(r => `${r.trim()}\n\n`)
  await runPluginTester(
    getOptions({
      fixtures: getFixturePath('fixtures'),
      formatResult: formatResultSpy,
    }),
  )
  expect(formatResultSpy).toHaveBeenCalledTimes(9)
})

test('gets options from options.json files when using fixtures', async () => {
  const optionRootFoo = jest.fn()
  const optionFoo = jest.fn()
  const optionBar = jest.fn()
  const pluginWithOptions = jest.fn(() => {
    return {
      visitor: {
        Program(programPath, state) {
          if (state.opts.rootFoo === 'rootBar') {
            optionRootFoo()
          }
          if (state.opts.foo === 'bar') {
            optionFoo()
          }
          if (state.opts.bar === 'baz') {
            optionBar()
          }
        },
      },
    }
  })

  await runPluginTester(
    getOptions({
      plugin: pluginWithOptions,
      fixtures: getFixturePath('fixtures'),
    }),
  )

  expect(optionRootFoo).toHaveBeenCalledTimes(8)
  expect(optionFoo).toHaveBeenCalledTimes(2)
  expect(optionBar).toHaveBeenCalledTimes(1)
})

test('appends to root plugins array', async () => {
  const optionRootFoo = jest.fn()
  const optionFoo = jest.fn()
  const optionBar = jest.fn()
  const pluginWithOptions = jest.fn(() => {
    return {
      visitor: {
        Program(programPath, state) {
          if (state.opts.rootFoo === 'rootBar') {
            optionRootFoo()
          }
          if (state.opts.foo === 'bar') {
            optionFoo()
          }
          if (state.opts.bar === 'baz') {
            optionBar()
          }
        },
      },
    }
  })
  const programVisitor = jest.fn()
  const otherPlugin = () => {
    return {
      visitor: {
        Program: programVisitor,
      },
    }
  }

  await runPluginTester(
    getOptions({
      plugin: pluginWithOptions,
      fixtures: getFixturePath('fixtures'),
      babelOptions: {
        plugins: [otherPlugin],
      },
    }),
  )

  expect(optionRootFoo).toHaveBeenCalledTimes(8)
  expect(optionFoo).toHaveBeenCalledTimes(2)
  expect(optionBar).toHaveBeenCalledTimes(1)
  expect(programVisitor).toHaveBeenCalledTimes(9)
})

function getOptions(overrides) {
  return {
    pluginName: 'captains-log',
    plugin: () => ({name: 'captains-log', visitor: {}}),
    tests: [simpleTest],
    ...overrides,
  }
}

function getFixtureContents(fixture) {
  const fullPath = getFixturePath(fixture)
  return fs.readFileSync(fullPath, 'utf8').trim()
}

function getFixturePath(fixture = '') {
  return path.join(__dirname, 'fixtures', fixture)
}

async function snapshotOptionsError(options) {
  let error
  try {
    await runPluginTester(options)
  } catch (e) {
    error = e
  }
  expect(error.message).toMatchSnapshot()
}

async function snapshotPluginError(error, overrides) {
  let errorThrown
  try {
    await testPluginError(error, overrides)
  } catch (e) {
    errorThrown = e
  }
  expect(errorThrown.message).toMatchSnapshot()
}

function testPluginError(error, overrides) {
  return runPluginTester(
    getOptions({
      plugin: () => {
        throw new SyntaxError('test message')
      },
      tests: [
        {
          code: simpleTest,
          error,
        },
      ],
      ...overrides,
    }),
  )
}
