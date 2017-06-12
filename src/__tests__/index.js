import fs from 'fs'
import path from 'path'
import assert from 'assert'
import * as babel from 'babel-core'
// eslint-disable-next-line import/default
import pluginTester from '../'
import identifierReversePlugin from './__helpers__/identifier-reverse-plugin'

let errorSpy, describeSpy, itSpy, itOnlySpy, itSkipSpy, equalSpy, transformSpy

const noop = () => {}
const titleTesterMock = (title, testFn) => testFn()
const simpleTest = 'var hi = "hey";'

beforeEach(() => {
  equalSpy = jest.spyOn(assert, 'equal')
  errorSpy = jest.spyOn(console, 'error').mockImplementation(noop)
  describeSpy = jest
    .spyOn(global, 'describe')
    .mockImplementation(titleTesterMock)
  itSpy = jest.spyOn(global, 'it').mockImplementation(titleTesterMock)
  global.it.only = jest.fn(titleTesterMock)
  global.it.skip = jest.fn(titleTesterMock)
  itOnlySpy = global.it.only
  itSkipSpy = global.it.skip
  transformSpy = jest.spyOn(babel, 'transform')
})

afterEach(() => {
  equalSpy.mockRestore()
  errorSpy.mockRestore()
  describeSpy.mockRestore()
  itSpy.mockRestore()
  itSkipSpy.mockRestore()
  transformSpy.mockRestore()
})

test('plugin is required', () => {
  expect(() => pluginTester()).toThrowErrorMatchingSnapshot()
})

test('logs when plugin name is not inferable and rethrows errors', () => {
  const error = new Error('hey there')
  expect(() =>
    pluginTester({
      plugin: () => {
        throw error
      },
    }),
  ).toThrow(error)
  expect(errorSpy).toHaveBeenCalledTimes(1)
  expect(errorSpy).toHaveBeenCalledWith(
    expect.stringMatching(/infer.*name.*plugin/),
  )
})

test('throws an invariant if the plugin name is not inferable', () => {
  expect(() =>
    pluginTester({
      plugin: () => ({}),
    }),
  ).toThrowErrorMatchingSnapshot()
})

test('exists early if no tests are supplied', () => {
  const {plugin} = getOptions()
  pluginTester({plugin})
  expect(describeSpy).not.toHaveBeenCalled()
  expect(itSpy).not.toHaveBeenCalled()
})

test('exits early if tests is an empty array', () => {
  const {plugin} = getOptions()
  pluginTester({plugin, tests: []})
  expect(describeSpy).not.toHaveBeenCalled()
  expect(itSpy).not.toHaveBeenCalled()
})

test('accepts a title for the describe block', () => {
  const title = 'describe block title'
  pluginTester(getOptions({title}))
  expect(describeSpy).toHaveBeenCalledWith(title, expect.any(Function))
})

test('can infer the plugin name for the describe block', () => {
  const name = 'super-great'
  const {plugin, tests} = getOptions({
    plugin: () => ({name, visitor: {}}),
  })
  pluginTester({plugin, tests})
  expect(describeSpy).toHaveBeenCalledTimes(1)
  expect(describeSpy).toHaveBeenCalledWith(name, expect.any(Function))
})

test('calls describe and test for a group of tests', () => {
  const pluginName = 'supergirl'
  const customTitle = 'some custom title'
  const options = getOptions({
    pluginName,
    tests: [simpleTest, simpleTest, {code: simpleTest, title: customTitle}],
  })
  pluginTester(options)
  expect(describeSpy).toHaveBeenCalledTimes(1)
  expect(describeSpy).toHaveBeenCalledWith(
    options.pluginName,
    expect.any(Function),
  )
  expect(itSpy).toHaveBeenCalledTimes(3)
  expect(itSpy.mock.calls).toEqual([
    [`1. ${pluginName}`, expect.any(Function)],
    [`2. ${pluginName}`, expect.any(Function)],
    [`3. ${customTitle}`, expect.any(Function)],
  ])
})

test('tests can be skipped', () => {
  const {plugin} = getOptions()
  pluginTester({plugin, tests: [{skip: true, code: '"hey";'}]})
  expect(itSkipSpy).toHaveBeenCalledTimes(1)
  expect(itSpy).not.toHaveBeenCalled()
})

test('tests can be only-ed', () => {
  const {plugin} = getOptions()
  pluginTester({plugin, tests: [{only: true, code: '"hey";'}]})
  expect(itOnlySpy).toHaveBeenCalledTimes(1)
  expect(itSpy).not.toHaveBeenCalled()
})

test('tests cannot be both only-ed and skipped', () => {
  const {plugin} = getOptions()
  expect(() =>
    pluginTester({
      plugin,
      tests: [{only: true, skip: true, code: '"hey";'}],
    }),
  ).toThrowErrorMatchingSnapshot()
})

test('default will throw if output changes', () => {
  const tests = ['var hello = "hi";']
  expect(() =>
    pluginTester(getOptions({plugin: identifierReversePlugin, tests})),
  ).toThrowErrorMatchingSnapshot()
})

test('skips falsy tests', () => {
  const tests = [simpleTest, undefined, null, simpleTest]
  pluginTester(getOptions({tests}))
  expect(itSpy).toHaveBeenCalledTimes(2)
})

test('throws if output is incorrect', () => {
  const tests = [{code: '"hi";', output: '"hey";'}]
  expect(() =>
    pluginTester(getOptions({tests})),
  ).toThrowErrorMatchingSnapshot()
})

test(`throws invariant if there's no code`, () => {
  const tests = [{}]
  expect(() =>
    pluginTester(getOptions({tests})),
  ).toThrowErrorMatchingSnapshot()
})

test('trims and deindents code and output', () => {
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
  pluginTester(getOptions({tests}))
  expect(equalSpy).toHaveBeenCalledWith(
    `var someCode = 'cool';`,
    `var someCode = 'cool';`,
    expect.any(String),
  )
})

test('can get a code and output fixture that is an absolute path', () => {
  const tests = [
    {
      fixture: getFixturePath('fixture1.js'),
      outputFixture: getFixturePath('outure1.js'),
    },
  ]
  try {
    pluginTester(getOptions({tests}))
  } catch (error) {
    const actual = getFixtureContents('fixture1.js')
    const expected = getFixtureContents('outure1.js')
    expect(error).toMatchObject({
      name: 'AssertionError',
      message: 'Output is incorrect.',
      actual,
      expected,
    })
  }
})

test('can pass with fixture and outputFixture', () => {
  const tests = [
    {
      fixture: getFixturePath('fixture1.js'),
      outputFixture: getFixturePath('fixture1.js'),
    },
  ]
  expect(() => pluginTester(getOptions({tests}))).not.toThrow()
})

test('throws error if fixture provided and code changes', () => {
  const tests = [{fixture: getFixturePath('fixture1.js')}]
  expect(() =>
    pluginTester(getOptions({plugin: identifierReversePlugin, tests})),
  ).toThrowErrorMatchingSnapshot()
})

test('can resolve a fixture with the filename option', () => {
  const tests = [
    {
      fixture: '__fixtures__/fixture1.js',
      outputFixture: '__fixtures__/outure1.js',
    },
  ]
  try {
    pluginTester(getOptions({filename: __filename, tests}))
  } catch (error) {
    const actual = getFixtureContents('fixture1.js')
    const expected = getFixtureContents('outure1.js')
    expect(error).toMatchObject({
      name: 'AssertionError',
      message: 'Output is incorrect.',
      actual,
      expected,
    })
  }
})

test('can pass tests in fixtures relative to the filename', () => {
  pluginTester(
    getOptions({
      filename: __filename,
      fixtures: '__fixtures__/fixtures',
      tests: null,
    }),
  )
  expect(describeSpy).toHaveBeenCalledTimes(1)
  expect(itSpy).toHaveBeenCalledTimes(2)
  expect(itSpy.mock.calls).toEqual([
    [`changed`, expect.any(Function)],
    [`unchanged`, expect.any(Function)],
  ])
})

test('can fail tests in fixtures at an absolute path', () => {
  expect(() =>
    pluginTester(
      getOptions({
        plugin: identifierReversePlugin,
        tests: null,
        fixtures: getFixturePath('failing-fixtures'),
      }),
    ),
  ).toThrowErrorMatchingSnapshot()
})

test('uses the fixture filename in babelOptions', () => {
  const fixture = getFixturePath('fixture1.js')
  const tests = [
    {
      fixture,
      outputFixture: getFixturePath('fixture1.js'),
    },
  ]
  pluginTester(getOptions({tests}))
  expect(transformSpy).toHaveBeenCalledTimes(1)
  expect(transformSpy).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      filename: fixture,
    }),
  )
})

test('allows for a test babelOptions can provide a filename', () => {
  const filename = getFixturePath('outure1.js')
  const tests = [
    {
      babelOptions: {filename},
      fixture: getFixturePath('fixture1.js'),
      outputFixture: getFixturePath('fixture1.js'),
    },
  ]
  pluginTester(getOptions({tests}))
  expect(transformSpy).toHaveBeenCalledTimes(1)
  expect(transformSpy).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      filename,
    }),
  )
})

test('can provide a test filename for code strings', () => {
  const filename = getFixturePath('outure1.js')
  const tests = [{babelOptions: {filename}, code: simpleTest}]
  pluginTester(getOptions({tests}))
  expect(transformSpy).toHaveBeenCalledTimes(1)
  expect(transformSpy).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      filename,
    }),
  )
})

test('can provide plugin options', () => {
  const tests = [simpleTest]
  const pluginOptions = {
    optionA: true,
  }
  pluginTester(getOptions({tests, pluginOptions}))
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

test('can overwrite plugin options at test level', () => {
  const pluginOptions = {
    optionA: false,
  }
  const tests = [{code: simpleTest, pluginOptions}]
  pluginTester(
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

test('throws invariant if snapshot and output are both provided', () => {
  const tests = [{code: simpleTest, output: 'anything', snapshot: true}]
  expect(() =>
    pluginTester(getOptions({tests})),
  ).toThrowErrorMatchingSnapshot()
})

test('snapshot option can be derived from the root config', () => {
  const tests = [{code: simpleTest, output: 'anything'}]
  expect(() =>
    pluginTester(getOptions({snapshot: true, tests})),
  ).toThrowErrorMatchingSnapshot()
})

test('throws invariant if code is unchanged and snapshot is enabled', () => {
  const tests = [simpleTest]
  expect(() =>
    pluginTester(getOptions({snapshot: true, tests})),
  ).toThrowErrorMatchingSnapshot()
})

test('takes a snapshot', () => {
  // this one is kinda tricky... At first I thought I'd mock toMatchSnapshot
  // but then I realized that we can actually use it to our advantage in
  // this case. We actually _do_ take a snapshot and that makes our test
  // work pretty well soooooo... 😀
  const tests = [simpleTest]
  pluginTester(
    getOptions({snapshot: true, tests, plugin: identifierReversePlugin}),
  )
})

test('can provide an object for tests', () => {
  const firstTitle = 'first title'
  const secondTitle = 'second title'
  const tests = {
    [firstTitle]: simpleTest,
    [secondTitle]: {
      code: simpleTest,
    },
  }
  pluginTester(getOptions({tests}))
  expect(equalSpy).toHaveBeenCalledTimes(2)
  expect(equalSpy.mock.calls).toEqual([
    [simpleTest, simpleTest, expect.any(String)],
    [simpleTest, simpleTest, expect.any(String)],
  ])
  expect(itSpy.mock.calls).toEqual([
    [`1. ${firstTitle}`, expect.any(Function)],
    [`2. ${secondTitle}`, expect.any(Function)],
  ])
})

function testError(error, overrides) {
  pluginTester(
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

test('can capture errors with true', () => {
  testError(true)
})

test('can capture errors with Error constructor', () => {
  testError(SyntaxError)
})

test('can capture errors with string', () => {
  testError('test message')
})

test('can capture errors with regex', () => {
  testError(/mess/)
})

test('can capture errors with function', () => {
  testError(err => /mess/.test(err.message) && err instanceof SyntaxError)
})

test(`throws error when function doesn't return true`, () => {
  expect(() => testError(() => false)).toThrowErrorMatchingSnapshot()
})

test('throws error when error expected but no error thrown', () => {
  expect(() =>
    testError(true, {
      plugin: () => null,
    }),
  ).toThrowErrorMatchingSnapshot()
})

test('throws error if there is a problem parsing', () => {
  try {
    pluginTester(
      getOptions({
        tests: [`][fkfhgo]fo{r`],
        babelOptions: {filename: __filename},
      }),
    )
  } catch (error) {
    expect(error.constructor).toBe(SyntaxError)
    expect(error.message.endsWith('Unexpected token (1:0)'))
  }
})

test(`throws an error if babelrc is true with no filename`, () => {
  const tests = ['"use strict";']
  expect(() =>
    pluginTester(getOptions({tests, babelOptions: {babelrc: true}})),
  ).toThrowErrorMatchingSnapshot()
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
  return path.join(__dirname, '__fixtures__', fixture)
}
