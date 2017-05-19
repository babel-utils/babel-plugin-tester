import fs from 'fs'
import path from 'path'
import assert from 'assert'
// eslint-disable-next-line import/default
import pluginTester from './'

let errorSpy, describeSpy, itSpy, itOnlySpy, equalSpy

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
  itOnlySpy = global.it.only
})

afterEach(() => {
  equalSpy.mockRestore()
  errorSpy.mockRestore()
  describeSpy.mockRestore()
  itSpy.mockRestore()
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

test('applies modifier if one is specified', () => {
  const {plugin} = getOptions()
  pluginTester({plugin, tests: [{modifier: 'only', code: '"hey";'}]})
  expect(itOnlySpy).toHaveBeenCalledTimes(1)
  expect(itSpy).not.toHaveBeenCalled()
})

test('default will throw if output changes', () => {
  const tests = ['var hello = "hi";']
  expect(() =>
    pluginTester(getOptions({plugin: IdentifierReversePlugin, tests})),
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
    pluginTester(getOptions({plugin: IdentifierReversePlugin, tests})),
  ).toThrowErrorMatchingSnapshot()
})

test('can resolve a fixture with the fixtures option', () => {
  const fixtures = getFixturePath()
  const tests = [
    {
      fixture: 'fixture1.js',
      outputFixture: 'outure1.js',
    },
  ]
  try {
    pluginTester(getOptions({fixtures, tests}))
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
    getOptions({snapshot: true, tests, plugin: IdentifierReversePlugin}),
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

test('throws error when function doesnt return true', () => {
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
  expect(() => {
    pluginTester(getOptions({tests: [`][fkfhgo]fo{r`]}))
  }).toThrowErrorMatchingSnapshot()
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

function IdentifierReversePlugin() {
  return {
    visitor: {
      Identifier(idPath) {
        idPath.node.name = idPath.node.name.split('').reverse().join('')
      },
    },
  }
}
