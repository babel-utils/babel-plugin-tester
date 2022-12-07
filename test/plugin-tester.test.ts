import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import { EOL } from 'node:os';
import { isNativeError } from 'node:util/types';
import { declare } from '@babel/helper-plugin-utils';
import { asMockedFunction, type AnyFunction } from '@xunnamius/jest-types';
import babel from '@babel/core';

import { runPluginUnderTestHere } from '../src/index';
import { prettierFormatter } from '../src/formatters/prettier';
import { unstringSnapshotSerializer } from '../src/serializers/unstring-snapshot';
import { identifierReversePlugin, makePluginWithOrderTracking } from './helpers/plugins';

import {
  simpleTest,
  addPendingJestTest,
  getDummyOptions,
  runPluginTester,
  runPluginTesterExpectException,
  runPluginTesterCaptureError,
  runPluginTesterCaptureErrorExpectException,
  getFixturePath,
  getFixtureContents
} from './helpers';

expect.addSnapshotSerializer(unstringSnapshotSerializer);

type MockedFunction<T extends AnyFunction> = jest.MockedFunction<T>;
type SpiedFunction<T extends AnyFunction> = jest.SpyInstance<
  ReturnType<T>,
  Parameters<T>
>;

let equalSpy: SpiedFunction<typeof assert.equal>;
let errorSpy: SpiedFunction<typeof console.error>;
let describeSpy: SpiedFunction<typeof global.describe>;
let writeFileSyncSpy: SpiedFunction<typeof fs.writeFileSync>;
let transformAsyncSpy: SpiedFunction<typeof babel.transformAsync>;
let itSpy: SpiedFunction<typeof global.it>;

let mockedItOnly: MockedFunction<typeof global.it.only>;
let mockedItSkip: MockedFunction<typeof global.it.skip>;

beforeEach(() => {
  equalSpy = jest.spyOn(assert, 'equal');
  errorSpy = jest.spyOn(console, 'error');
  describeSpy = jest.spyOn(global, 'describe');
  writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync');
  transformAsyncSpy = jest.spyOn(babel, 'transformAsync');
  itSpy = jest.spyOn(global, 'it');

  // TODO: no mock here? (change to spy)
  mockedItOnly = global.it.only = asMockedFunction<typeof it.only>();
  mockedItSkip = global.it.skip = asMockedFunction<typeof it.skip>();

  describeSpy.mockImplementation((_title, body) => {
    // * https://github.com/facebook/jest/issues/10271
    body();
  });

  itSpy.mockImplementation((_title, testFn) => {
    addPendingJestTest(testFn);
  });

  errorSpy.mockImplementation(() => undefined);
  writeFileSyncSpy.mockImplementation(() => undefined);
});

test('plugin is required', async () => {
  expect.hasAssertions();

  await expect(runPluginTester()).rejects.toThrowErrorMatchingSnapshot();
});

test('exits early if no tests are supplied', async () => {
  expect.hasAssertions();

  const { plugin } = getDummyOptions();
  await runPluginTester({ plugin });
  expect(describeSpy).not.toHaveBeenCalled();
  expect(itSpy).not.toHaveBeenCalled();
});

test('exits early if tests is an empty array', async () => {
  expect.hasAssertions();

  const { plugin } = getDummyOptions();
  await runPluginTester({ plugin, tests: [] });
  expect(describeSpy).not.toHaveBeenCalled();
  expect(itSpy).not.toHaveBeenCalled();
});

test('uses inferred plugin name as title if available otherwise uses default', async () => {
  expect.hasAssertions();

  await runPluginTester(
    getDummyOptions({
      pluginName: undefined,
      plugin: () => ({ name: 'captains-journal', visitor: {} })
    })
  );

  expect(describeSpy).toHaveBeenCalledTimes(1);
  expect(describeSpy).toHaveBeenCalledWith('captains-journal', expect.any(Function));
});

test('can infer plugin name from packages using @babel/helper-plugin-utils', async () => {
  expect.hasAssertions();

  await runPluginTester(
    getDummyOptions({
      pluginName: undefined,
      plugin: declare((api, options, dirname) => {
        api.assertVersion(7);
        // @ts-expect-error: this is supported starting from Babel 7.13
        api.targets();
        // @ts-expect-error: this is supported starting from Babel 7.13
        api.assumption('some-assumption');

        const { version } = options;
        assert(dirname, 'expected dirname to be polyfilled (defined)');
        assert(!version, 'expected version to be polyfilled (undefined)');

        return { name: 'captains-journal', visitor: {} };
      })
    })
  );

  expect(describeSpy).toHaveBeenCalledWith('captains-journal', expect.any(Function));
});

test('uses "unknown plugin" without crashing if plugin crashes while inferring name', async () => {
  expect.hasAssertions();

  let called = false;

  await runPluginTester(
    getDummyOptions({
      pluginName: undefined,
      plugin: () => {
        if (called) {
          return { visitor: {} };
        } else {
          called = true;
          throw new Error('plugin crashed was unhandled');
        }
      }
    })
  );

  expect(describeSpy).toHaveBeenCalledWith('unknown plugin', expect.any(Function));
});

test('uses "unknown plugin" if no custom title or plugin name is available', async () => {
  expect.hasAssertions();

  await runPluginTester(
    getDummyOptions({
      pluginName: undefined,
      plugin: () => ({ visitor: {} })
    })
  );
  expect(describeSpy).toHaveBeenCalledWith('unknown plugin', expect.any(Function));
});

test('accepts a custom title for the describe block', async () => {
  expect.hasAssertions();

  const title = 'describe block title';
  await runPluginTester(getDummyOptions({ title }));
  expect(describeSpy).toHaveBeenCalledWith(title, expect.any(Function));
});

test('calls describe and test for a group of tests', async () => {
  expect.hasAssertions();

  const pluginName = 'supergirl';
  const customTitle = 'some custom title';
  const options = getDummyOptions({
    pluginName,
    tests: [simpleTest, simpleTest, { code: simpleTest, title: customTitle }]
  });
  await runPluginTester(options);
  expect(describeSpy).toHaveBeenCalledTimes(1);
  expect(describeSpy).toHaveBeenCalledWith(options.pluginName, expect.any(Function));
  expect(itSpy).toHaveBeenCalledTimes(3);
  expect(itSpy.mock.calls).toMatchObject([
    [`1. ${pluginName}`, expect.any(Function)],
    [`2. ${pluginName}`, expect.any(Function)],
    [`${customTitle}`, expect.any(Function)]
  ]);
});

test('tests can be skipped', async () => {
  expect.hasAssertions();

  const { plugin } = getDummyOptions();
  await runPluginTester({ plugin, tests: [{ skip: true, code: '"hey";' }] });
  expect(mockedItSkip).toHaveBeenCalledTimes(1);
  expect(itSpy).not.toHaveBeenCalled();
});

test('tests can be only-ed', async () => {
  expect.hasAssertions();

  const { plugin } = getDummyOptions();
  await runPluginTester({ plugin, tests: [{ only: true, code: '"hey";' }] });
  expect(mockedItOnly).toHaveBeenCalledTimes(1);
  expect(itSpy).not.toHaveBeenCalled();
});

test('tests cannot be both only-ed and skipped', async () => {
  expect.hasAssertions();

  const { plugin } = getDummyOptions();
  await expect(
    runPluginTester({
      plugin,
      tests: [{ only: true, skip: true, code: '"hey";' }]
    })
  ).rejects.toThrowErrorMatchingSnapshot();
});

test('fixture tests can be skipped', async () => {
  expect.hasAssertions();

  await runPluginTester(
    getDummyOptions({
      fixtures: getFixturePath('skip-fixtures'),
      tests: undefined
    })
  );

  expect(mockedItSkip).toHaveBeenCalledTimes(1);
  expect(itSpy).not.toHaveBeenCalled();
});

test('fixture tests can be only-ed', async () => {
  expect.hasAssertions();

  await runPluginTester(
    getDummyOptions({
      fixtures: getFixturePath('only-fixtures'),
      tests: undefined
    })
  );

  expect(mockedItOnly).toHaveBeenCalledTimes(1);
  expect(itSpy).not.toHaveBeenCalled();
});

test('fixture tests cannot be both only-ed and skipped', async () => {
  expect.hasAssertions();

  await expect(
    runPluginTester(
      getDummyOptions({
        fixtures: getFixturePath('skip-only-fixtures'),
        tests: undefined
      })
    )
  ).rejects.toThrowErrorMatchingSnapshot();
});

test('fixture tests accept custom test title', async () => {
  expect.hasAssertions();

  await runPluginTester(
    getDummyOptions({
      fixtures: getFixturePath('custom-title-fixtures'),
      tests: undefined
    })
  );

  expect(itSpy).toHaveBeenCalledWith('custom fixture test title', expect.any(Function));
});

test('default will throw if output changes', async () => {
  expect.hasAssertions();

  const tests = ["var hello = 'hi';"];
  const options = getDummyOptions({ plugin: identifierReversePlugin, tests });
  await runPluginTesterExpectException(options);
});

test('skips falsy tests', async () => {
  expect.hasAssertions();

  const tests = [simpleTest, undefined, null, simpleTest];
  // @ts-expect-error: bad tests
  await runPluginTester(getDummyOptions({ tests }));
  expect(itSpy).toHaveBeenCalledTimes(2);
});

test('throws if output is incorrect', async () => {
  expect.hasAssertions();

  const tests = [{ code: '"hi";', output: '"hey";' }];
  await runPluginTesterExpectException(getDummyOptions({ tests }));
});

test(`assert throws if there's no code`, async () => {
  expect.hasAssertions();

  const tests = [{}];
  await runPluginTesterExpectException(getDummyOptions({ tests }));
});

test('trims and deindents code and output', async () => {
  expect.hasAssertions();

  const tests = [
    {
      code: `
        var someCode = 'cool';
      `,
      output: `
        var someCode = 'cool';
      `
    }
  ];
  await runPluginTester(getDummyOptions({ tests }));
  expect(equalSpy).toHaveBeenCalledWith(
    `var someCode = 'cool';`,
    `var someCode = 'cool';`,
    expect.any(String)
  );
});

test('accepts an empty output', async () => {
  expect.hasAssertions();

  const tests = [
    {
      code: `var eraseMe = 'junk'`,
      output: ''
    }
  ];

  let errorResponse;

  try {
    await runPluginTester(
      getDummyOptions({
        plugin: () => ({
          name: 'cleanup',
          visitor: {
            VariableDeclaration(p) {
              p.remove();
            }
          }
        }),
        tests
      })
    );
    errorResponse = false;
  } catch {
    errorResponse = true;
  }

  expect(errorResponse).toBeFalsy();
});

test('can get a code and output fixture that is an absolute path', async () => {
  expect.hasAssertions();

  const tests = [
    {
      fixture: getFixturePath('fixture1.js'),
      outputFixture: getFixturePath('outure1.js')
    }
  ];
  const error = await runPluginTester(getDummyOptions({ tests })).catch((error) => error);
  const actual = getFixtureContents('fixture1.js');
  const expected = getFixtureContents('outure1.js');
  expect(error).toMatchObject({
    name: expect.stringMatching(/AssertionError/),
    message: 'output is incorrect',
    actual,
    expected
  });
});

test('can pass with fixture and outputFixture', async () => {
  expect.hasAssertions();

  const tests = [
    {
      fixture: getFixturePath('fixture1.js'),
      outputFixture: getFixturePath('fixture1.js')
    }
  ];

  await expect(runPluginTester(getDummyOptions({ tests }))).resolves.toStrictEqual([
    undefined
  ]);
});

test('throws error if fixture provided and code changes', async () => {
  expect.hasAssertions();

  const tests = [{ fixture: getFixturePath('fixture1.js') }];
  await runPluginTesterExpectException(
    getDummyOptions({ plugin: identifierReversePlugin, tests })
  );
});

test('can resolve a fixture with the filename option', async () => {
  expect.hasAssertions();

  const tests = [
    {
      fixture: 'fixtures/fixture1.js',
      outputFixture: 'fixtures/outure1.js'
    }
  ];
  const error = await runPluginTester(
    getDummyOptions({ filename: __filename, tests })
  ).catch((error) => error);
  const actual = getFixtureContents('fixture1.js');
  const expected = getFixtureContents('outure1.js');
  expect(error).toMatchObject({
    name: expect.stringMatching(/AssertionError/),
    message: 'output is incorrect',
    actual,
    expected
  });
});

test('can pass tests in fixtures relative to the filename', async () => {
  expect.hasAssertions();

  await runPluginTester(
    getDummyOptions({
      filename: __filename,
      fixtures: 'fixtures/fixtures',
      tests: undefined
    })
  );
  expect(describeSpy).toHaveBeenCalledTimes(6);
  expect(itSpy).toHaveBeenCalledTimes(14);

  expect(itSpy.mock.calls).toMatchObject([
    [`cjs`, expect.any(Function)],
    [`js`, expect.any(Function)],
    [`normal`, expect.any(Function)],
    [`changed`, expect.any(Function)],
    [`fixtureOutputExt`, expect.any(Function)],
    [`jsx support`, expect.any(Function)],
    [`nested a`, expect.any(Function)],
    [`nested b`, expect.any(Function)],
    [`tsx support`, expect.any(Function)],
    [`typescript`, expect.any(Function)],
    [`unchanged`, expect.any(Function)],
    [`nested with option`, expect.any(Function)],
    [`nested without option`, expect.any(Function)],
    [`without output file`, expect.any(Function)]
  ]);
});

test('can fail tests in fixtures at an absolute path', async () => {
  expect.hasAssertions();

  const error = await runPluginTester(
    getDummyOptions({
      plugin: identifierReversePlugin,
      tests: undefined,
      fixtures: getFixturePath('failing-fixtures')
    })
  ).catch((error) => error);
  expect(error.message).toMatchSnapshot();
});

test('creates output file for new tests', async () => {
  expect.hasAssertions();

  await runPluginTester(
    getDummyOptions({
      filename: __filename,
      fixtures: 'fixtures/creates-output-file',
      tests: undefined
    })
  );

  expect(writeFileSyncSpy).toHaveBeenCalledWith(
    path.join(__dirname, './fixtures/creates-output-file/fixture/output.js'),
    `console.log('hello');`
  );
  expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
});

test('uses the fixture filename in babelOptions', async () => {
  expect.hasAssertions();

  const fixture = getFixturePath('fixture1.js');
  const tests = [
    {
      fixture,
      outputFixture: getFixturePath('fixture1.js')
    }
  ];
  await runPluginTester(getDummyOptions({ tests }));
  expect(transformAsyncSpy).toHaveBeenCalledTimes(1);
  expect(transformAsyncSpy).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      filename: fixture
    })
  );
});

test('allows for a test babelOptions can provide a filename', async () => {
  expect.hasAssertions();

  const filename = getFixturePath('outure1.js');
  const tests = [
    {
      babelOptions: { filename },
      fixture: getFixturePath('fixture1.js'),
      outputFixture: getFixturePath('fixture1.js')
    }
  ];
  await runPluginTester(getDummyOptions({ tests }));
  expect(transformAsyncSpy).toHaveBeenCalledTimes(1);
  expect(transformAsyncSpy).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      filename
    })
  );
});

test('can provide a test filename for code strings', async () => {
  expect.hasAssertions();

  const filename = getFixturePath('outure1.js');
  const tests = [{ babelOptions: { filename }, code: simpleTest }];
  await runPluginTester(getDummyOptions({ tests }));
  expect(transformAsyncSpy).toHaveBeenCalledTimes(1);
  expect(transformAsyncSpy).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      filename
    })
  );
});

test('works with versions of babel without `.transformSync` method', async () => {
  expect.hasAssertions();

  const tests = [simpleTest];
  const oldBabel = {
    transform: babel.transform
  };
  const transformSyncSpy = jest.spyOn(oldBabel, 'transform');
  await runPluginTester(
    getDummyOptions({
      babel: oldBabel,
      filename: __filename,
      fixtures: 'fixtures/fixtures',
      tests
    })
  );
  expect(transformAsyncSpy).not.toHaveBeenCalled();
  expect(transformSyncSpy).toHaveBeenCalledTimes(15);
});

test('can provide plugin options', async () => {
  expect.hasAssertions();

  const tests = [simpleTest];
  const pluginOptions = {
    optionA: true
  };
  await runPluginTester(getDummyOptions({ tests, pluginOptions }));
  expect(transformAsyncSpy).toHaveBeenCalledTimes(1);
  expect(transformAsyncSpy).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      plugins: expect.arrayContaining([
        [
          expect.any(Function),
          expect.objectContaining({
            optionA: true
          })
        ]
      ])
    })
  );
});

test('can overwrite plugin options at test level', async () => {
  expect.hasAssertions();

  const pluginOptions = {
    optionA: false
  };
  const tests = [{ code: simpleTest, pluginOptions }];
  await runPluginTester(
    getDummyOptions({
      tests,
      pluginOptions: {
        optionA: true
      }
    })
  );
  expect(transformAsyncSpy).toHaveBeenCalledTimes(1);
  expect(transformAsyncSpy).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      plugins: expect.arrayContaining([
        [
          expect.any(Function),
          expect.objectContaining({
            optionA: false
          })
        ]
      ])
    })
  );
});

test('assert throws if snapshot and output are both provided', async () => {
  expect.hasAssertions();

  const tests = [{ code: simpleTest, output: 'anything', snapshot: true }];
  await runPluginTesterExpectException(getDummyOptions({ tests }));
});

test('snapshot option can be derived from the root config', async () => {
  expect.hasAssertions();

  const tests = [{ code: simpleTest, output: 'anything' }];
  await runPluginTesterExpectException(getDummyOptions({ snapshot: true, tests }));
});

test('assert throws if code is unchanged + snapshot enabled', async () => {
  expect.hasAssertions();

  const tests = [simpleTest];
  await runPluginTesterExpectException(getDummyOptions({ snapshot: true, tests }));
});

test('takes a snapshot', async () => {
  expect.hasAssertions();

  // ? This one is kinda tricky... At first I thought I'd mock toMatchSnapshot
  // ? but then I realized that we can actually use it to our advantage in
  // ? this case. We actually _do_ take a snapshot and that makes our test
  // ? work pretty well soooooo... 😀
  const tests = [simpleTest];
  await runPluginTester(
    getDummyOptions({ snapshot: true, tests, plugin: identifierReversePlugin })
  );
});

test('can provide an object for tests', async () => {
  expect.hasAssertions();

  const firstTitle = 'first title';
  const secondTitle = 'second title';
  const tests = {
    [firstTitle]: simpleTest,
    [secondTitle]: {
      code: simpleTest
    }
  };
  await runPluginTester(getDummyOptions({ tests }));
  expect(equalSpy).toHaveBeenCalledTimes(2);
  expect(equalSpy.mock.calls).toMatchObject([
    [simpleTest, simpleTest, expect.any(String)],
    [simpleTest, simpleTest, expect.any(String)]
  ]);
  expect(itSpy.mock.calls).toMatchObject([
    [firstTitle, expect.any(Function)],
    [secondTitle, expect.any(Function)]
  ]);
});

test('can capture errors with true', async () => {
  expect.hasAssertions();

  await expect(runPluginTesterCaptureError(true)).resolves.toStrictEqual([undefined]);
});

test('can capture errors with Error constructor', async () => {
  expect.hasAssertions();

  await expect(runPluginTesterCaptureError(SyntaxError)).resolves.toStrictEqual([
    undefined
  ]);
});

test('can capture errors with string', async () => {
  expect.hasAssertions();

  await expect(runPluginTesterCaptureError('fake syntax error')).resolves.toStrictEqual([
    undefined
  ]);
});

test('can capture errors with regex', async () => {
  expect.hasAssertions();

  await expect(runPluginTesterCaptureError(/syntax/)).resolves.toStrictEqual([undefined]);
});

test('can capture errors with function', async () => {
  expect.hasAssertions();

  await expect(
    runPluginTesterCaptureError(
      (error) => error instanceof SyntaxError && /syntax/.test(error.message)
    )
  ).resolves.toStrictEqual([undefined]);
});

test(`throws error when function doesn't return true`, async () => {
  expect.hasAssertions();

  await runPluginTesterCaptureErrorExpectException(() => false);
});

test('throws error when error expected but no error thrown', async () => {
  expect.hasAssertions();

  await runPluginTesterCaptureErrorExpectException(true, {
    plugin: () => ({ visitor: {} })
  });
});

test('throws error if there is a problem parsing', async () => {
  expect.hasAssertions();

  try {
    await runPluginTester(
      getDummyOptions({
        tests: [`][fkfhgo]fo{r`],
        babelOptions: { filename: __filename }
      })
    );

    // ? Should never be encountered
    expect(true).toBe(false);
  } catch (error) {
    expect(isNativeError(error)).toBeTruthy();
    expect((error as Error).constructor).toBe(SyntaxError);
    expect((error as Error).message).toContain('Unexpected token (1:0)');
  }
});

test(`throws an error if babelrc is true with no filename`, async () => {
  expect.hasAssertions();

  const tests = ['"use strict";'];
  await runPluginTesterExpectException(
    getDummyOptions({ tests, babelOptions: { babelrc: true } })
  );
});

test('runs test setup function', async () => {
  expect.hasAssertions();

  const setupSpy = jest.fn();
  const tests = [{ code: simpleTest, setup: setupSpy }];
  await runPluginTester(getDummyOptions({ tests }));
  expect(setupSpy).toHaveBeenCalledTimes(1);
});

test('runs test teardown function', async () => {
  expect.hasAssertions();

  const teardownSpy = jest.fn();
  const tests = [{ code: simpleTest, teardown: teardownSpy }];
  await runPluginTester(getDummyOptions({ tests }));
  expect(teardownSpy).toHaveBeenCalledTimes(1);
});

test('setup can return a teardown function', async () => {
  expect.hasAssertions();

  const teardownSpy = jest.fn();
  const setupSpy = jest.fn(() => teardownSpy);
  const tests = [{ code: simpleTest, setup: setupSpy }];
  await runPluginTester(getDummyOptions({ tests }));
  expect(teardownSpy).toHaveBeenCalledTimes(1);
});

test('function resolved from setup promise used for teardown', async () => {
  expect.hasAssertions();

  const teardownSpy = jest.fn();
  const setupSpy = jest.fn(() => Promise.resolve(teardownSpy));
  const tests = [{ code: simpleTest, setup: setupSpy }];
  await runPluginTester(getDummyOptions({ tests }));
  expect(teardownSpy).toHaveBeenCalledTimes(1);
});

test('error logged and thrown if setup throws', async () => {
  expect.hasAssertions();

  const errorToThrow = new Error('blah');
  const setupSpy = jest.fn(() => {
    throw errorToThrow;
  });
  const tests = [{ code: simpleTest, setup: setupSpy }];
  const errorThrown = await runPluginTester(getDummyOptions({ tests })).catch(
    (error) => error
  );
  expect(errorThrown).toBe(errorToThrow);
  expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/problem.*setup/i));
});

test('error logged and thrown if teardown throws', async () => {
  expect.hasAssertions();

  const errorToThrow = new Error('blah');
  const teardownSpy = jest.fn(() => {
    throw errorToThrow;
  });
  const tests = [{ code: simpleTest, teardown: teardownSpy }];
  const errorThrown = await runPluginTester(getDummyOptions({ tests })).catch(
    (error) => error
  );
  expect(errorThrown).toBe(errorToThrow);
  expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/problem.*teardown/i));
});

test('allows formatting tests result', async () => {
  expect.hasAssertions();

  const formatResultSpy = jest.fn((r) => r);
  await runPluginTester(
    getDummyOptions({
      filename: __filename,
      tests: [{ code: simpleTest, formatResult: formatResultSpy }]
    })
  );
  expect(formatResultSpy).toHaveBeenCalledTimes(1);
  expect(formatResultSpy).toHaveBeenCalledWith(simpleTest, {
    filepath: __filename,
    filename: __filename
  });
});

test('allows formatting fixtures results', async () => {
  expect.hasAssertions();

  const fixtures = getFixturePath('fixtures');
  const formatResultSpy = jest.fn((r) => r);

  await runPluginTester(
    getDummyOptions({
      fixtures,
      formatResult: formatResultSpy
    })
  );

  expect(formatResultSpy).toHaveBeenCalledTimes(15);
  expect(formatResultSpy).toHaveBeenCalledWith(expect.any(String), {
    filepath: expect.stringMatching(new RegExp(`^${fixtures}`)),
    filename: expect.stringMatching(new RegExp(`^${fixtures}`))
  });
});

test('works with a formatter adding a empty line', async () => {
  expect.hasAssertions();

  // ? Simulate prettier adding an empty line at the end
  const formatResultSpy = jest.fn((r) => `${r.trim()}\n\n`);

  await runPluginTester(
    getDummyOptions({
      fixtures: getFixturePath('fixtures'),
      formatResult: formatResultSpy
    })
  );

  expect(formatResultSpy).toHaveBeenCalledTimes(15);
});

test('prettier formatter supported', async () => {
  expect.hasAssertions();

  await expect(
    runPluginTester(
      getDummyOptions({
        formatResult: prettierFormatter,
        tests: {
          formatted: {
            code: `
            console.log(  "hey"  )
          `,
            output: `
            console.log('hey');
          `
          }
        }
      })
    )
  ).resolves.toStrictEqual([undefined]);
});

test('gets options from local and root options.json files when using fixtures', async () => {
  expect.hasAssertions();

  const optionRootFoo = jest.fn();
  const optionFoo = jest.fn();
  const optionBar = jest.fn();

  const pluginWithOptions = jest.fn(() => {
    return {
      visitor: {
        Program(_: unknown, state: { opts: Record<string, string> }) {
          if (state.opts.rootFoo === 'rootBar') {
            optionRootFoo();
          }

          if (state.opts.foo === 'bar') {
            optionFoo();
          }

          if (state.opts.bar === 'baz') {
            optionBar();
          }
        }
      }
    };
  });

  await runPluginTester(
    getDummyOptions({
      plugin: pluginWithOptions,
      fixtures: getFixturePath('fixtures')
    })
  );

  expect(optionRootFoo).toHaveBeenCalledTimes(14);
  expect(optionFoo).toHaveBeenCalledTimes(2);
  expect(optionBar).toHaveBeenCalledTimes(1);
});

test('respects fixtureOutputExt from root options.json file when using fixtures', async () => {
  expect.hasAssertions();

  await runPluginTester(
    getDummyOptions({
      fixtures: getFixturePath('root-fixtureOutputExt'),
      tests: undefined
    })
  );

  expect(writeFileSyncSpy).toHaveBeenCalledTimes(0);

  expect(equalSpy).toHaveBeenCalledWith(
    getFixtureContents('root-fixtureOutputExt/root/fixture/code.ts'),
    getFixtureContents('root-fixtureOutputExt/root/fixture/output.js'),
    expect.any(String)
  );
});

test('respects fixtureOutputExt from local options.json file when using fixtures', async () => {
  expect.hasAssertions();

  await runPluginTester(
    getDummyOptions({
      fixtures: getFixturePath('fixtureOutputExt'),
      tests: undefined
    })
  );

  expect(writeFileSyncSpy).toHaveBeenCalledTimes(0);

  expect(equalSpy).toHaveBeenCalledWith(
    getFixtureContents('fixtureOutputExt/fixture/code.ts'),
    getFixtureContents('fixtureOutputExt/fixture/output.js'),
    expect.any(String)
  );
});

test('appends to root plugins array', async () => {
  expect.hasAssertions();

  const optionRootFoo = jest.fn();
  const optionFoo = jest.fn();
  const optionBar = jest.fn();
  const pluginWithOptions = jest.fn(() => {
    return {
      visitor: {
        Program(_: unknown, state: { opts: Record<string, string> }) {
          if (state.opts.rootFoo === 'rootBar') {
            optionRootFoo();
          }
          if (state.opts.foo === 'bar') {
            optionFoo();
          }
          if (state.opts.bar === 'baz') {
            optionBar();
          }
        }
      }
    };
  });
  const programVisitor = jest.fn();
  const otherPlugin = () => {
    return {
      visitor: {
        Program: programVisitor
      }
    };
  };

  await runPluginTester(
    getDummyOptions({
      plugin: pluginWithOptions,
      fixtures: getFixturePath('fixtures'),
      babelOptions: {
        plugins: [otherPlugin]
      }
    })
  );

  expect(optionRootFoo).toHaveBeenCalledTimes(14);
  expect(optionFoo).toHaveBeenCalledTimes(2);
  expect(optionBar).toHaveBeenCalledTimes(1);
  expect(programVisitor).toHaveBeenCalledTimes(15);
});

test('fixtures run plugins in the same order as tests', async () => {
  expect.hasAssertions();

  const runOrder1: number[] = [];
  const runOrder2: number[] = [];

  await runPluginTester(
    getDummyOptions({
      plugin: makePluginWithOrderTracking(runOrder1, 2),
      babelOptions: {
        plugins: [
          makePluginWithOrderTracking(runOrder1, 1),
          makePluginWithOrderTracking(runOrder1, 3)
        ]
      }
    })
  );

  await runPluginTester(
    getDummyOptions({
      plugin: makePluginWithOrderTracking(runOrder2, 2),
      tests: undefined,
      fixtures: getFixturePath('creates-output-file'),
      babelOptions: {
        plugins: [
          makePluginWithOrderTracking(runOrder2, 1),
          makePluginWithOrderTracking(runOrder2, 3)
        ]
      }
    })
  );

  expect(runOrder1).toStrictEqual([1, 3, 2]);
  expect(runOrder2).toStrictEqual(runOrder1);
});

test('can use runPluginUnderTestHere symbol to alter plugin run order in tests', async () => {
  expect.hasAssertions();

  const runOrder: number[] = [];

  await runPluginTester(
    getDummyOptions({
      plugin: makePluginWithOrderTracking(runOrder, 2),
      babelOptions: {
        plugins: [
          makePluginWithOrderTracking(runOrder, 1),
          runPluginUnderTestHere,
          makePluginWithOrderTracking(runOrder, 3)
        ]
      }
    })
  );

  expect(runOrder).toStrictEqual([1, 2, 3]);
});

test('can use runPluginUnderTestHere symbol to alter plugin run order in fixtures', async () => {
  expect.hasAssertions();

  const runOrder: number[] = [];

  await runPluginTester(
    getDummyOptions({
      plugin: makePluginWithOrderTracking(runOrder, 2),
      tests: undefined,
      fixtures: getFixturePath('creates-output-file'),
      babelOptions: {
        plugins: [
          makePluginWithOrderTracking(runOrder, 1),
          runPluginUnderTestHere,
          makePluginWithOrderTracking(runOrder, 3)
        ]
      }
    })
  );

  expect(runOrder).toStrictEqual([1, 2, 3]);
});

test('endOfLine - default', async () => {
  expect.hasAssertions();

  await expect(
    runPluginTester(
      getDummyOptions({
        tests: [
          {
            code: "var foo = '';\nvar bar = '';",
            output: "var foo = '';\nvar bar = '';"
          }
        ]
      })
    )
  ).resolves.toStrictEqual([undefined]);
});

test('endOfLine - unix', async () => {
  expect.hasAssertions();

  await expect(
    runPluginTester(
      getDummyOptions({
        endOfLine: 'lf',
        tests: [
          {
            code: "var foo = '';\nvar bar = '';",
            output: "var foo = '';\nvar bar = '';"
          }
        ]
      })
    )
  ).resolves.toStrictEqual([undefined]);
});

test('endOfLine - windows', async () => {
  expect.hasAssertions();

  await expect(
    runPluginTester(
      getDummyOptions({
        endOfLine: 'crlf',
        tests: [
          {
            code: "var foo = '';\nvar bar = '';",
            output: "var foo = '';\r\nvar bar = '';"
          }
        ]
      })
    )
  ).resolves.toStrictEqual([undefined]);
});

test('endOfLine - auto', async () => {
  expect.hasAssertions();

  await expect(
    runPluginTester(
      getDummyOptions({
        endOfLine: 'auto',
        tests: [
          {
            code: "var foo = '';\nvar bar = '';",
            output: `var foo = '';${EOL}var bar = '';`
          }
        ]
      })
    )
  ).resolves.toStrictEqual([undefined]);
});

test('endOfLine - preserve', async () => {
  expect.hasAssertions();

  await expect(
    runPluginTester(
      getDummyOptions({
        endOfLine: 'preserve',
        tests: [
          {
            code: "var foo = '';\r\nvar bar = '';",
            output: "var foo = '';\r\nvar bar = '';"
          }
        ]
      })
    )
  ).resolves.toStrictEqual([undefined]);
});

test('endOfLine - preserve - no linefeed', async () => {
  expect.hasAssertions();

  await expect(
    runPluginTester(
      getDummyOptions({
        endOfLine: 'preserve',
        tests: [
          {
            code: "var foo = '';",
            output: "var foo = '';"
          }
        ]
      })
    )
  ).resolves.toStrictEqual([undefined]);
});

test('endOfLine - invalid option', async () => {
  expect.hasAssertions();

  await expect(
    runPluginTester(
      getDummyOptions({
        // @ts-expect-error: testing bad value
        endOfLine: 'invalid',
        tests: [
          {
            code: "var foo = '';",
            output: "var foo = '';"
          }
        ]
      })
    )
  ).rejects.toMatchObject({
    message: "invalid 'endOfLine' value"
  });
});
