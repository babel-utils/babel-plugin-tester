/* eslint-disable jest/prefer-lowercase-title */
import fs from 'node:fs';
import path from 'node:path';
import assert, { AssertionError } from 'node:assert';
import babel from '@babel/core';
import { EOL } from 'node:os';
import { toss } from 'toss-expression';
import stripIndent from 'strip-indent';
import { declare } from '@babel/helper-plugin-utils';
import { asMockedFunction } from '@xunnamius/jest-types';

import { withMockedEnv, withMockedOutput } from './setup';
import { prettierFormatter } from '../src/formatters/prettier';
import { unstringSnapshotSerializer } from '../src/serializers/unstring-snapshot';

import {
  type PluginTesterOptions,
  runPluginUnderTestHere,
  runPresetUnderTestHere,
  pluginTester
} from '../src/index';

import { restartTestTitleNumbering } from '../src/plugin-tester';

import {
  deleteVariablesPlugin,
  identifierReversePlugin,
  makePluginThatAppendsToIdentifier,
  makePluginWithOrderTracking,
  makePresetWithPluginThatAppendsToIdentifier,
  makePresetWithPluginWithOrderTracking
} from './helpers/plugins';

import {
  simpleTest,
  simpleFixture,
  shouldNotBeSeen,
  dummyProjectRootFilepath,
  dummyExplicitPluginName,
  dummyInferredPluginName,
  dummyPresetName,
  addPendingJestTest,
  getDummyPluginOptions,
  getDummyPresetOptions,
  runPluginTester,
  runPluginTesterExpectThrownException,
  runPluginTesterExpectCapturedError,
  runPluginTesterExpectThrownExceptionWhenCapturingError,
  getFixturePath,
  getFixtureContents,
  requireFixtureOptions,
  getPendingJestTests
} from './helpers';

import type { AnyFunction } from '@xunnamius/jest-types';

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

  mockedItOnly = global.it.only = asMockedFunction<typeof it.only>();
  mockedItSkip = global.it.skip = asMockedFunction<typeof it.skip>();

  describeSpy.mockImplementation((_title, body) => {
    // * https://github.com/facebook/jest/issues/10271
    body();
  });

  itSpy.mockImplementation((name, testFn) => {
    addPendingJestTest(name, testFn);
  });

  errorSpy.mockImplementation(() => undefined);
  writeFileSyncSpy.mockImplementation(() => undefined);

  restartTestTitleNumbering();
});

describe('tests targeting the PluginTesterOptions interface', () => {
  it('throws if `describe` or `it` functions are not available in the global scope', async () => {
    expect.hasAssertions();

    const oldDescribe = globalThis.describe;
    const oldIt = globalThis.it;

    // @ts-expect-error: I'll put it back, I pwomise!
    delete globalThis.describe;

    try {
      await runPluginTesterExpectThrownException();
    } finally {
      globalThis.describe = oldDescribe;
    }

    // @ts-expect-error: I'll put it back, I pwomise!
    delete globalThis.it;

    try {
      await runPluginTesterExpectThrownException();
    } finally {
      globalThis.it = oldIt;
    }
  });

  it('passes `plugin` to babel', async () => {
    expect.hasAssertions();

    const options = getDummyPluginOptions({
      tests: [simpleTest],
      fixtures: simpleFixture
    });

    const plugin = options.plugin;

    await runPluginTester(options);

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([expect.arrayContaining([plugin])])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([expect.arrayContaining([plugin])])
        })
      ]
    ]);
  });

  it('uses inferred `pluginName`, if available and no `pluginName` provided, for `describe` block', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        pluginName: undefined,
        tests: [simpleTest],
        fixtures: simpleFixture
      })
    );

    expect(describeSpy.mock.calls).toMatchObject([
      [`${dummyInferredPluginName} fixtures`, expect.any(Function)],
      [dummyInferredPluginName, expect.any(Function)]
    ]);
  });

  it('can infer `pluginName` from packages using @babel/helper-plugin-utils', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
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
        }),
        tests: [simpleTest],
        fixtures: simpleFixture
      })
    );

    expect(describeSpy.mock.calls).toMatchObject([
      ['captains-journal fixtures', expect.any(Function)],
      ['captains-journal', expect.any(Function)]
    ]);
  });

  it('uses "unknown plugin" without crashing if `plugin` crashes while inferring name', async () => {
    expect.hasAssertions();

    let called = false;

    await runPluginTester(
      getDummyPluginOptions({
        pluginName: undefined,
        plugin: () => {
          if (called) {
            return { visitor: {} };
          } else {
            called = true;
            throw new Error('plugin crashed was unhandled');
          }
        },
        tests: [simpleTest],
        fixtures: simpleFixture
      })
    );

    expect(describeSpy.mock.calls).toMatchObject([
      ['unknown plugin fixtures', expect.any(Function)],
      ['unknown plugin', expect.any(Function)]
    ]);
  });

  it('uses `pluginName`, if provided, instead of inference for `describe` block', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        pluginName: 'plugin name',
        tests: [simpleTest],
        fixtures: simpleFixture
      })
    );

    expect(describeSpy.mock.calls).toMatchObject([
      ['plugin name fixtures', expect.any(Function)],
      ['plugin name', expect.any(Function)]
    ]);
  });

  it('uses "unknown plugin" for `describe` block if no `title` is provided nor `pluginName` available', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        title: undefined,
        pluginName: undefined,
        plugin: () => ({ visitor: {} }),
        tests: [simpleTest],
        fixtures: simpleFixture
      })
    );

    expect(describeSpy.mock.calls).toMatchObject([
      ['unknown plugin fixtures', expect.any(Function)],
      ['unknown plugin', expect.any(Function)]
    ]);
  });

  it('applies `pluginOptions` globally', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        pluginOptions: { optionA: true },
        tests: [simpleTest],
        fixtures: simpleFixture
      })
    );

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [
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
      ],
      [
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
      ]
    ]);
  });

  it('passes `preset` to babel', async () => {
    expect.hasAssertions();

    const options = getDummyPresetOptions({
      tests: [simpleTest],
      fixtures: simpleFixture
    });

    const preset = options.preset;

    await runPluginTester(options);

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [
        expect.any(String),
        expect.objectContaining({
          presets: expect.arrayContaining([expect.arrayContaining([preset])])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          presets: expect.arrayContaining([expect.arrayContaining([preset])])
        })
      ]
    ]);
  });

  it('uses `presetName`, if provided, for `describe` block', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPresetOptions({
        presetName: 'preset name',
        tests: [simpleTest],
        fixtures: simpleFixture
      })
    );

    expect(describeSpy.mock.calls).toMatchObject([
      ['preset name fixtures', expect.any(Function)],
      ['preset name', expect.any(Function)]
    ]);
  });

  it('uses "unknown preset" for `describe` block if no `title` nor `presetName` provided', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPresetOptions({
        title: undefined,
        presetName: undefined,
        tests: [simpleTest],
        fixtures: simpleFixture
      })
    );

    expect(describeSpy.mock.calls).toMatchObject([
      ['unknown preset fixtures', expect.any(Function)],
      ['unknown preset', expect.any(Function)]
    ]);
  });

  it('applies `presetOptions` globally', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPresetOptions({
        presetOptions: { optionA: true },
        tests: [simpleTest],
        fixtures: simpleFixture
      })
    );

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [
        expect.any(String),
        expect.objectContaining({
          presets: expect.arrayContaining([
            [
              expect.any(Function),
              expect.objectContaining({
                optionA: true
              })
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          presets: expect.arrayContaining([
            [
              expect.any(Function),
              expect.objectContaining({
                optionA: true
              })
            ]
          ])
        })
      ]
    ]);
  });

  it('throws if neither `plugin` nor `preset` are provided', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException();

    await runPluginTester({ plugin: getDummyPluginOptions().plugin });
    await runPluginTester({ preset: getDummyPresetOptions().preset });

    await runPluginTesterExpectThrownException({
      pluginName: getDummyPluginOptions().pluginName,
      pluginOptions: {}
    });

    await runPluginTesterExpectThrownException({
      presetName: getDummyPresetOptions().presetName,
      presetOptions: {}
    });
  });

  it('throws if both plugin- and preset-specific options are provided', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException({
      plugin: getDummyPluginOptions().plugin,
      preset: getDummyPresetOptions().preset,
      tests: [simpleTest]
    });

    await runPluginTesterExpectThrownException({
      plugin: getDummyPluginOptions().plugin,
      presetName: getDummyPresetOptions().presetName,
      tests: [simpleTest]
    });

    await runPluginTesterExpectThrownException({
      plugin: getDummyPluginOptions().plugin,
      presetOptions: {},
      tests: [simpleTest]
    });

    await runPluginTesterExpectThrownException({
      preset: getDummyPresetOptions().preset,
      pluginName: getDummyPluginOptions().pluginName,
      tests: [simpleTest]
    });

    await runPluginTesterExpectThrownException({
      preset: getDummyPresetOptions().preset,
      pluginOptions: {},
      tests: [simpleTest]
    });
  });

  it('can use a custom babel implementation via `babel`', async () => {
    expect.hasAssertions();

    const transformFn = jest.fn((code: string) => ({ code }));

    await runPluginTester(
      getDummyPluginOptions({
        babel: { transform: transformFn } as NonNullable<PluginTesterOptions['babel']>,
        fixtures: '../fixtures/simple',
        tests: [simpleTest]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        babel: { transform: transformFn } as NonNullable<PluginTesterOptions['babel']>,
        fixtures: '../fixtures/simple',
        tests: [simpleTest]
      })
    );

    const simpleFixtureCode = getFixtureContents('simple/fixture/code.js');

    expect(transformFn.mock.calls).toMatchObject([
      [simpleTest, expect.objectContaining({ plugins: expect.any(Array) })],
      [simpleFixtureCode, expect.objectContaining({ plugins: expect.any(Array) })],
      [simpleTest, expect.objectContaining({ presets: expect.any(Array) })],
      [simpleFixtureCode, expect.objectContaining({ presets: expect.any(Array) })]
    ]);
  });

  it('works with versions of babel without `transformAsync` method', async () => {
    expect.hasAssertions();

    const outdatedBabel = { transform: babel.transformSync } as NonNullable<
      PluginTesterOptions['babel']
    >;

    const transformSyncSpy = jest.spyOn(outdatedBabel, 'transform');

    await runPluginTester(
      getDummyPluginOptions({
        babel: outdatedBabel,
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        babel: outdatedBabel,
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    expect(transformAsyncSpy).toHaveBeenCalledTimes(0);
    expect(transformSyncSpy).toHaveBeenCalledTimes(4);
  });

  it('applies `babelOptions` globally', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        babelOptions: { assumptions: {} },
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        babelOptions: { assumptions: {} },
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [expect.any(String), expect.objectContaining({ assumptions: {} })],
      [expect.any(String), expect.objectContaining({ assumptions: {} })],
      [expect.any(String), expect.objectContaining({ assumptions: {} })],
      [expect.any(String), expect.objectContaining({ assumptions: {} })]
    ]);
  });

  it('sets `babelOptions.filename` to `filepath` globally by default', async () => {
    expect.hasAssertions();

    const filepath = `${__dirname}/super-fake-file.fake`;

    await runPluginTester(
      getDummyPluginOptions({
        filepath,
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        filepath,
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [
        expect.any(String),
        expect.objectContaining({
          filename: expect.stringMatching(new RegExp(`^${simpleFixture}`))
        })
      ],
      [expect.any(String), expect.objectContaining({ filename: filepath })],
      [
        expect.any(String),
        expect.objectContaining({
          filename: expect.stringMatching(new RegExp(`^${simpleFixture}`))
        })
      ],
      [expect.any(String), expect.objectContaining({ filename: filepath })]
    ]);
  });

  it('plugins and presets are collated in the proper order given complex `babelOptions` customization', async () => {
    expect.hasAssertions();

    const secondPlugin = makePluginThatAppendsToIdentifier('plugin2');
    const thirdPlugin = makePluginThatAppendsToIdentifier('plugin3');
    const secondPreset = makePresetWithPluginThatAppendsToIdentifier('preset2');
    const thirdPreset = makePresetWithPluginThatAppendsToIdentifier('preset3');

    await runPluginTester(
      getDummyPluginOptions({
        plugin: thirdPlugin,
        babelOptions: {
          plugins: [secondPlugin],
          presets: [thirdPreset, secondPreset]
        },
        fixtures: getFixturePath('collate-order-1'),
        tests: [
          {
            code: "var boo = '';",
            output: "var boo_plugin2_plugin3_preset2_preset3 = '';"
          }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        preset: thirdPreset,
        babelOptions: {
          plugins: [thirdPlugin, secondPlugin],
          presets: [secondPreset]
        },
        fixtures: getFixturePath('collate-order-2'),
        tests: [
          {
            code: "var zoo = '';",
            output: "var zoo_plugin3_plugin2_preset2_preset3 = '';"
          }
        ]
      })
    );

    expect(itSpy).toBeCalledTimes(4);
  });

  it('runs plugins for `fixtures` and `tests` in the same order', async () => {
    expect.hasAssertions();

    const runOrder1: number[] = [];
    const runOrder2: number[] = [];

    await runPluginTester(
      getDummyPluginOptions({
        plugin: makePluginWithOrderTracking(runOrder1, 2),
        babelOptions: {
          plugins: [
            makePluginWithOrderTracking(runOrder1, 1),
            makePluginWithOrderTracking(runOrder1, 3)
          ]
        },
        tests: [simpleTest]
      })
    );

    await runPluginTester(
      getDummyPluginOptions({
        plugin: makePluginWithOrderTracking(runOrder2, 2),
        babelOptions: {
          plugins: [
            makePluginWithOrderTracking(runOrder2, 1),
            makePluginWithOrderTracking(runOrder2, 3)
          ]
        },
        fixtures: simpleFixture
      })
    );

    expect(runOrder1).toStrictEqual([1, 3, 2]);
    expect(runOrder2).toStrictEqual(runOrder1);
  });

  it('runs presets for `fixtures` and `tests` in the same order', async () => {
    expect.hasAssertions();

    const runOrder1: number[] = [];
    const runOrder2: number[] = [];

    await runPluginTester(
      getDummyPresetOptions({
        preset: makePresetWithPluginWithOrderTracking(runOrder1, 2),
        babelOptions: {
          presets: [
            makePresetWithPluginWithOrderTracking(runOrder1, 1),
            makePresetWithPluginWithOrderTracking(runOrder1, 3)
          ]
        },
        tests: [simpleTest]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        preset: makePresetWithPluginWithOrderTracking(runOrder2, 2),
        babelOptions: {
          presets: [
            makePresetWithPluginWithOrderTracking(runOrder2, 1),
            makePresetWithPluginWithOrderTracking(runOrder2, 3)
          ]
        },
        fixtures: simpleFixture
      })
    );

    expect(runOrder1).toStrictEqual([3, 1, 2]);
    expect(runOrder2).toStrictEqual(runOrder1);
  });

  it('alters plugin run order given the presence of the runPluginUnderTestHere symbol', async () => {
    expect.hasAssertions();

    const runOrder: number[] = [];

    await runPluginTester(
      getDummyPluginOptions({
        plugin: makePluginWithOrderTracking(runOrder, 2),
        babelOptions: {
          plugins: [
            makePluginWithOrderTracking(runOrder, 1),
            runPluginUnderTestHere,
            makePluginWithOrderTracking(runOrder, 3)
          ]
        },
        tests: [simpleTest],
        fixtures: simpleFixture
      })
    );

    expect(runOrder).toStrictEqual([1, 2, 3, 1, 2, 3]);
  });

  it('alters preset run order given the presence of the runPresetUnderTestHere symbol', async () => {
    expect.hasAssertions();

    const runOrder: number[] = [];

    await runPluginTester(
      getDummyPresetOptions({
        preset: makePresetWithPluginWithOrderTracking(runOrder, 2),
        babelOptions: {
          presets: [
            makePresetWithPluginWithOrderTracking(runOrder, 1),
            runPresetUnderTestHere,
            makePresetWithPluginWithOrderTracking(runOrder, 3)
          ]
        },
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    expect(runOrder).toStrictEqual([3, 2, 1, 3, 2, 1]);
  });

  it('replaces run order symbols properly when collating complex `babelOptions` customization', async () => {
    expect.hasAssertions();

    const secondPlugin = makePluginThatAppendsToIdentifier('plugin2');
    const thirdPlugin = makePluginThatAppendsToIdentifier('plugin3');
    const secondPreset = makePresetWithPluginThatAppendsToIdentifier('preset2');
    const thirdPreset = makePresetWithPluginThatAppendsToIdentifier('preset3');

    await runPluginTester(
      getDummyPluginOptions({
        plugin: thirdPlugin,
        babelOptions: {
          plugins: [runPluginUnderTestHere, secondPlugin],
          presets: [thirdPreset, secondPreset]
        },
        fixtures: getFixturePath('collate-order-2'),
        tests: [
          {
            code: "var foo = '';",
            output: "var foo_plugin3_plugin2_preset2_preset3 = '';"
          }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        preset: secondPreset,
        babelOptions: {
          plugins: [thirdPlugin, secondPlugin],
          presets: [thirdPreset, runPresetUnderTestHere]
        },
        fixtures: getFixturePath('collate-order-2'),
        tests: [
          {
            code: "var foo = '';",
            output: "var foo_plugin3_plugin2_preset2_preset3 = '';"
          }
        ]
      })
    );

    expect(itSpy).toBeCalledTimes(4);
  });

  it('throws if `babelOptions.babelrc: true` and `babelOptions.filename` is unset', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        // ? babelOptions babelrc and filename are set implicitly for fixtures
        fixtures: getFixturePath('options-bad-babelOptions-babelrc-filename')
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        filepath: undefined,
        babelOptions: { babelrc: true },
        tests: [simpleTest]
      })
    );
  });

  it('uses `title` for the `describe` block over any defaults', async () => {
    expect.hasAssertions();

    const title = '`describe` block title';

    await runPluginTester(
      getDummyPluginOptions({
        title,
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        title,
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    expect(describeSpy.mock.calls).toMatchObject([
      [`${title} fixtures`, expect.any(Function)],
      [title, expect.any(Function)],
      [`${title} fixtures`, expect.any(Function)],
      [title, expect.any(Function)]
    ]);
  });

  it('setting `title` to `false` always prevents creation of `describe` block', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        title: false,
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    await runPluginTester(
      getDummyPluginOptions({
        title: false,
        pluginName: undefined,
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        title: false,
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    expect(describeSpy).toBeCalledTimes(0);
  });

  it('setting `title` to an empty string is equivalent to setting `title` to `undefined`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        title: '',
        pluginName: undefined,
        tests: [simpleTest],
        fixtures: simpleFixture
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        title: '',
        presetName: undefined,
        tests: [simpleTest],
        fixtures: simpleFixture
      })
    );

    expect(describeSpy.mock.calls).toMatchObject([
      [`${dummyInferredPluginName} fixtures`, expect.any(Function)],
      [dummyInferredPluginName, expect.any(Function)],
      ['unknown preset fixtures', expect.any(Function)],
      ['unknown preset', expect.any(Function)]
    ]);
  });

  it('sets `filepath` to the absolute path of the invoking file by default', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        tests: [simpleTest],
        fixtures: '../fixtures/simple'
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        tests: [simpleTest],
        fixtures: '../fixtures/simple'
      })
    );

    const fixtureFilename = getFixturePath('simple/fixture/code.js');
    const testObjectFilename = path.resolve(__dirname, './helpers/index.ts');

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [expect.any(String), expect.objectContaining({ filename: fixtureFilename })],
      [expect.any(String), expect.objectContaining({ filename: testObjectFilename })],
      [expect.any(String), expect.objectContaining({ filename: fixtureFilename })],
      [expect.any(String), expect.objectContaining({ filename: testObjectFilename })]
    ]);

    jest.clearAllMocks();

    pluginTester({
      plugin: () => ({ visitor: {} }),
      tests: [simpleTest],
      fixtures: 'fixtures/simple'
    });

    await Promise.all(getPendingJestTests());

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [expect.any(String), expect.objectContaining({ filename: fixtureFilename })],
      [expect.any(String), expect.objectContaining({ filename: __filename })]
    ]);
  });

  it('considers deprecated `filename` as synonymous with `filepath`', async () => {
    expect.hasAssertions();

    const testFilename = `${__dirname}/super-fake-file.fake`;
    const fixtureFilename = getFixturePath('simple/fixture/code.js');

    await runPluginTester(
      getDummyPluginOptions({
        filename: testFilename,
        fixtures: 'fixtures/simple',
        tests: [simpleTest]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        filename: testFilename,
        fixtures: 'fixtures/simple',
        tests: [simpleTest]
      })
    );

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [expect.any(String), expect.objectContaining({ filename: fixtureFilename })],
      [expect.any(String), expect.objectContaining({ filename: testFilename })],
      [expect.any(String), expect.objectContaining({ filename: fixtureFilename })],
      [expect.any(String), expect.objectContaining({ filename: testFilename })]
    ]);
  });

  it('converts line endings with respect to the default `endOfLine`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('option-endOfLine-default'),
        tests: [
          {
            code: "var foo = '';\nvar bar = '';\r\nvar baz = '';",
            output: "var foo = '';\nvar bar = '';\nvar baz = '';"
          }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('option-endOfLine-default'),
        tests: [
          {
            code: "var foo = '';\nvar bar = '';\r\nvar baz = '';",
            output: "var foo = '';\nvar bar = '';\nvar baz = '';"
          }
        ]
      })
    );

    expect(itSpy).toBeCalledTimes(6);
  });

  it('converts line endings with respect to `endOfLine: lf`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        endOfLine: 'lf',
        fixtures: getFixturePath('option-endOfLine-lf'),
        tests: [
          {
            code: "var foo = '';\nvar bar = '';\r\nvar baz = '';",
            output: "var foo = '';\nvar bar = '';\nvar baz = '';"
          }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        endOfLine: 'lf',
        fixtures: getFixturePath('option-endOfLine-lf'),
        tests: [
          {
            code: "var foo = '';\nvar bar = '';\r\nvar baz = '';",
            output: "var foo = '';\nvar bar = '';\nvar baz = '';"
          }
        ]
      })
    );

    expect(itSpy).toBeCalledTimes(6);
  });

  it('converts line endings with respect to `endOfLine: crlf`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        endOfLine: 'crlf',
        fixtures: getFixturePath('option-endOfLine-crlf'),
        tests: [
          {
            code: "var foo = '';\nvar bar = '';\r\nvar baz = '';",
            output: "var foo = '';\r\nvar bar = '';\r\nvar baz = '';"
          }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        endOfLine: 'crlf',
        fixtures: getFixturePath('option-endOfLine-crlf'),
        tests: [
          {
            code: "var foo = '';\nvar bar = '';\r\nvar baz = '';",
            output: "var foo = '';\r\nvar bar = '';\r\nvar baz = '';"
          }
        ]
      })
    );

    expect(itSpy).toBeCalledTimes(6);
  });

  it('converts line endings with respect to `endOfLine: auto`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        endOfLine: 'auto',
        fixtures: getFixturePath('option-endOfLine-auto'),
        tests: [
          {
            code: "var foo = '';\nvar bar = '';\r\nvar baz = '';",
            output: `var foo = '';${EOL}var bar = '';${EOL}var baz = '';`
          }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        endOfLine: 'auto',
        fixtures: getFixturePath('option-endOfLine-auto'),
        tests: [
          {
            code: "var foo = '';\nvar bar = '';\r\nvar baz = '';",
            output: `var foo = '';${EOL}var bar = '';${EOL}var baz = '';`
          }
        ]
      })
    );

    expect(itSpy).toBeCalledTimes(6);
  });

  it('converts line endings with respect to `endOfLine: preserve`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        endOfLine: 'preserve',
        fixtures: getFixturePath('option-endOfLine-preserve'),
        tests: [
          {
            code: "var foo = '';\nvar bar = '';\r\nvar baz = '';",
            // ? Should preserve the first matching line ending found
            output: "var foo = '';\nvar bar = '';\nvar baz = '';"
          }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        endOfLine: 'preserve',
        fixtures: getFixturePath('option-endOfLine-preserve'),
        tests: [
          {
            code: "var foo = '';\nvar bar = '';\r\nvar baz = '';",
            // ? Should preserve the first matching line ending found
            output: "var foo = '';\nvar bar = '';\nvar baz = '';"
          }
        ]
      })
    );

    expect(itSpy).toBeCalledTimes(6);
  });

  it('handles `endOfLine: preserve` when line does not end with linefeed', async () => {
    expect.hasAssertions();

    // ? These tests ensure that nobody's IDE messed with our fixture files by
    // ? adding newlines, which would normally be the right thing to do. If any
    // ? of these fail, ensure the failing file has no extraneous characters.
    // ***
    expect(
      getFixtureContents('option-endOfLine-preserve-no-eol/empty/code.js')
    ).not.toMatch(/\r?\n/);

    expect(
      getFixtureContents('option-endOfLine-preserve-no-eol/empty/output.js')
    ).not.toMatch(/\r?\n/);

    expect(
      getFixtureContents('option-endOfLine-preserve-no-eol/no-eol/code.js')
    ).not.toMatch(/\r?\n/);

    expect(
      getFixtureContents('option-endOfLine-preserve-no-eol/no-eol/output.js')
    ).not.toMatch(/\r?\n/);
    // ***

    await runPluginTester(
      getDummyPluginOptions({
        endOfLine: 'preserve',
        fixtures: getFixturePath('option-endOfLine-preserve-no-eol'),
        tests: [
          {
            code: "var foo = '';",
            output: "var foo = '';"
          },
          {
            code: '',
            output: ''
          }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        endOfLine: 'preserve',
        fixtures: getFixturePath('option-endOfLine-preserve-no-eol'),
        tests: [
          {
            code: "var foo = '';",
            output: "var foo = '';"
          },
          {
            code: '',
            output: ''
          }
        ]
      })
    );

    expect(itSpy).toBeCalledTimes(8);
  });

  it('does not convert line endings when `endOfLine: false`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        endOfLine: false,
        fixtures: getFixturePath('option-endOfLine-false'),
        tests: [
          {
            code: "var foo = '';\nvar bar = '';\r\nvar baz = '';",
            // ? Babel always outputs \n instead of \r\n
            output: "var foo = '';\nvar bar = '';\nvar baz = '';"
          }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        endOfLine: false,
        fixtures: getFixturePath('option-endOfLine-false'),
        tests: [
          {
            code: "var foo = '';\nvar bar = '';\r\nvar baz = '';",
            // ? Babel always outputs \n instead of \r\n
            output: "var foo = '';\nvar bar = '';\nvar baz = '';"
          }
        ]
      })
    );

    expect(itSpy).toBeCalledTimes(6);
  });

  it('throws if `endOfLine` is invalid', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        // @ts-expect-error: testing bad value
        endOfLine: 'invalid',
        fixtures: simpleFixture
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        // @ts-expect-error: testing bad value
        endOfLine: 'invalid',
        tests: [simpleTest]
      })
    );
  });

  it('throws if `endOfLine` is invalid even if `throws` is not `false`', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        // @ts-expect-error: testing bad value
        endOfLine: 'invalid',
        fixtures: getFixturePath('option-throws-true')
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        // @ts-expect-error: testing bad value
        endOfLine: 'invalid',
        tests: [{ code: simpleTest, throws: true }]
      })
    );
  });

  it('runs global setup, teardown, and their returned teardown functions/promises in the proper order', async () => {
    expect.hasAssertions();

    const runOrder: number[] = [];

    const globalSetupSpy = () => void runOrder.push(1);
    const globalTeardownSpy = () => void runOrder.push(4);

    const globalSetupReturnTeardownFnSpy = () => {
      runOrder.push(1);
      return () => void runOrder.push(2);
    };

    const globalSetupReturnTeardownPromiseSpy = () => {
      runOrder.push(1);
      return Promise.resolve(() => void runOrder.push(3));
    };

    await runPluginTester(
      getDummyPluginOptions({
        setup: globalSetupSpy,
        teardown: globalTeardownSpy,
        fixtures: simpleFixture
      })
    );

    await runPluginTester(
      getDummyPluginOptions({
        setup: globalSetupSpy,
        teardown: globalTeardownSpy,
        tests: [simpleTest]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        setup: globalSetupSpy,
        teardown: globalTeardownSpy,
        fixtures: simpleFixture
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        setup: globalSetupSpy,
        teardown: globalTeardownSpy,
        tests: [simpleTest]
      })
    );

    expect(runOrder).toStrictEqual([1, 4, 1, 4, 1, 4, 1, 4]);
    runOrder.splice(0, runOrder.length);

    await runPluginTester(
      getDummyPluginOptions({
        setup: globalSetupReturnTeardownFnSpy,
        teardown: globalTeardownSpy,
        fixtures: simpleFixture
      })
    );

    await runPluginTester(
      getDummyPluginOptions({
        setup: globalSetupReturnTeardownFnSpy,
        teardown: globalTeardownSpy,
        tests: [simpleTest]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        setup: globalSetupReturnTeardownPromiseSpy,
        teardown: globalTeardownSpy,
        fixtures: simpleFixture
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        setup: globalSetupReturnTeardownPromiseSpy,
        teardown: globalTeardownSpy,
        tests: [simpleTest]
      })
    );

    expect(runOrder).toStrictEqual([1, 2, 4, 1, 2, 4, 1, 3, 4, 1, 3, 4]);
  });

  it('throws if setup throws', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        setup: () => toss(new Error('bad setup')),
        fixtures: simpleFixture
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        setup: () => toss(new Error('bad setup')),
        tests: [simpleTest]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        setup: () => toss(new Error('bad setup')),
        fixtures: simpleFixture
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        setup: () => toss(new Error('bad setup')),
        tests: [simpleTest]
      })
    );
  });

  it('throws if teardown throws', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        teardown: () => toss(new Error('bad teardown')),
        fixtures: simpleFixture
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        teardown: () => toss(new Error('bad teardown')),
        tests: [simpleTest]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        teardown: () => toss(new Error('bad teardown')),
        fixtures: simpleFixture
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        teardown: () => toss(new Error('bad teardown')),
        tests: [simpleTest]
      })
    );
  });

  it('ensures failing teardown function does not silently consume error from failing test', async () => {
    expect.hasAssertions();

    const errorRegExp = /bad teardown\s+Additionally.+: actual output does not match/;

    await expect(
      runPluginTester(
        getDummyPluginOptions({
          teardown: () => toss(new Error('bad teardown')),
          fixtures: getFixturePath('simple-failing')
        })
      )
    ).rejects.toMatchObject({
      message: expect.stringMatching(errorRegExp),
      cause: { error: expect.any(Error), frameworkError: expect.any(AssertionError) }
    });

    await expect(
      runPluginTester(
        getDummyPluginOptions({
          teardown: () => toss(new Error('bad teardown')),
          tests: [{ code: simpleTest, output: '' }]
        })
      )
    ).rejects.toMatchObject({
      message: expect.stringMatching(errorRegExp),
      cause: { error: expect.any(Error), frameworkError: expect.any(AssertionError) }
    });

    await expect(
      runPluginTester(
        getDummyPresetOptions({
          teardown: () => toss(new Error('bad teardown')),
          fixtures: getFixturePath('simple-failing')
        })
      )
    ).rejects.toMatchObject({
      message: expect.stringMatching(errorRegExp),
      cause: { error: expect.any(Error), frameworkError: expect.any(AssertionError) }
    });

    await expect(
      runPluginTester(
        getDummyPresetOptions({
          teardown: () => toss(new Error('bad teardown')),
          tests: [{ code: simpleTest, output: '' }]
        })
      )
    ).rejects.toMatchObject({
      message: expect.stringMatching(errorRegExp),
      cause: { error: expect.any(Error), frameworkError: expect.any(AssertionError) }
    });
  });

  it('applies `formatResult` globally and passes it both updated and deprecated parameters', async () => {
    expect.hasAssertions();

    const formatResult = jest.fn(() => `var xyz = 'xyz';`);
    const simpleFailingPath = getFixturePath('simple-failing');
    const simpleFailingContent = getFixtureContents('simple-failing/fixture/code.js');
    const simpleFailingContentPath = `${simpleFailingPath}/fixture/code.js`;

    await runPluginTester(
      getDummyPluginOptions({
        formatResult,
        fixtures: simpleFailingPath,
        tests: [{ code: simpleTest, output: formatResult() }]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        formatResult,
        fixtures: simpleFailingPath,
        tests: [{ code: simpleTest, output: formatResult() }]
      })
    );

    // ? Since we've updated the API, both `filepath` for up-to-date consumers
    // ? and the deprecated `filename` for outdated consumers should be passed.
    expect(formatResult.mock.calls).toMatchObject([
      [
        simpleFailingContent,
        { filename: simpleFailingContentPath, filepath: simpleFailingContentPath }
      ],
      [simpleTest, { filename: __filename, filepath: __filename }],
      [
        simpleFailingContent,
        { filename: simpleFailingContentPath, filepath: simpleFailingContentPath }
      ],
      [simpleTest, { filename: __filename, filepath: __filename }]
    ]);
  });

  it('passes when `formatResult` appends an empty line to its output', async () => {
    expect.hasAssertions();

    // ? Simulate prettier adding an empty line at the end
    const formatResult = (r: string) => `${r.trim()}\n\n`;

    await runPluginTester(
      getDummyPluginOptions({
        formatResult,
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        formatResult,
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    expect(itSpy).toBeCalledTimes(4);
  });

  it("supports built-in prettier-based formatter using this project's own prettier configuration", async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        formatResult: prettierFormatter,
        fixtures: getFixturePath('prettier'),
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
    );

    await runPluginTester(
      getDummyPresetOptions({
        formatResult: prettierFormatter,
        fixtures: getFixturePath('prettier'),
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
    );

    expect(itSpy).toBeCalledTimes(4);
  });

  it('throws if `formatResult` throws even if `throws` is not `false`', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        formatResult: () => toss(new Error('faux error')),
        fixtures: getFixturePath('option-throws-true')
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        formatResult: () => toss(new Error('faux error')),
        tests: [{ code: simpleTest, throws: true }]
      })
    );
  });

  it('applies `snapshot` globally', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        snapshot: true,
        fixtures: simpleFixture
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        snapshot: true,
        tests: [{ code: simpleTest, output: shouldNotBeSeen }]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        snapshot: true,
        fixtures: simpleFixture
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        snapshot: true,
        tests: [{ code: simpleTest, output: shouldNotBeSeen }]
      })
    );

    await runPluginTester(
      getDummyPluginOptions({
        snapshot: false,
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        snapshot: false,
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );
  });

  it('applies `fixtureOutputName` globally', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtureOutputName: 'out',
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtureOutputName: 'out',
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    expect(writeFileSyncSpy.mock.calls).toMatchObject([
      [getFixturePath('simple/fixture/out.js'), expect.any(String)],
      [getFixturePath('simple/fixture/out.js'), expect.any(String)]
    ]);
  });

  it('applies `fixtureOutputExt` globally', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtureOutputExt: 'ext',
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtureOutputExt: 'ext',
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    expect(writeFileSyncSpy.mock.calls).toMatchObject([
      [getFixturePath('simple/fixture/output.ext'), expect.any(String)],
      [getFixturePath('simple/fixture/output.ext'), expect.any(String)]
    ]);
  });

  it('numbers all titles with respect to the default `titleNumbering`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('option-title'),
        tests: { 'a-custom-title': { code: simpleTest } }
      })
    );

    await runPluginTester(
      getDummyPluginOptions({
        tests: { 'another one': simpleTest }
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: simpleFixture,
        tests: [simpleTest, { code: simpleTest }]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        tests: [{ code: simpleTest, title: 'another-one' }]
      })
    );

    expect(itSpy.mock.calls).toMatchObject([
      [`1. ${requireFixtureOptions('option-title').title}`, expect.any(Function)],
      ['2. a-custom-title', expect.any(Function)],
      ['3. another one', expect.any(Function)],
      ['4. fixture', expect.any(Function)],
      [`5. ${dummyPresetName}`, expect.any(Function)],
      ['6. another-one', expect.any(Function)]
    ]);
  });

  it('numbers all titles with respect to `titleNumbering: all`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        titleNumbering: 'all',
        fixtures: getFixturePath('option-title'),
        tests: { 'a-custom-title': { code: simpleTest } }
      })
    );

    await runPluginTester(
      getDummyPluginOptions({
        titleNumbering: 'all',
        tests: { 'another one': simpleTest }
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        titleNumbering: 'all',
        fixtures: simpleFixture,
        tests: [simpleTest, { code: simpleTest }]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        titleNumbering: 'all',
        tests: [{ code: simpleTest, title: 'another-one' }]
      })
    );

    expect(itSpy.mock.calls).toMatchObject([
      [`1. ${requireFixtureOptions('option-title').title}`, expect.any(Function)],
      ['2. a-custom-title', expect.any(Function)],
      ['3. another one', expect.any(Function)],
      ['4. fixture', expect.any(Function)],
      [`5. ${dummyPresetName}`, expect.any(Function)],
      ['6. another-one', expect.any(Function)]
    ]);
  });

  it('numbers test object titles only when `titleNumbering: tests-only`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        titleNumbering: 'tests-only',
        fixtures: getFixturePath('option-title'),
        tests: { 'a-custom-title': { code: simpleTest } }
      })
    );

    await runPluginTester(
      getDummyPluginOptions({
        titleNumbering: 'tests-only',
        tests: { 'another one': simpleTest }
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        titleNumbering: 'tests-only',
        fixtures: simpleFixture,
        tests: [simpleTest, { code: simpleTest }]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        titleNumbering: 'tests-only',
        tests: [{ code: simpleTest, title: 'another-one' }]
      })
    );

    expect(itSpy.mock.calls).toMatchObject([
      [requireFixtureOptions('option-title').title, expect.any(Function)],
      ['1. a-custom-title', expect.any(Function)],
      ['2. another one', expect.any(Function)],
      ['fixture', expect.any(Function)],
      [`3. ${dummyPresetName}`, expect.any(Function)],
      [`4. ${dummyPresetName}`, expect.any(Function)],
      ['5. another-one', expect.any(Function)]
    ]);
  });

  it('numbers fixtures titles only when `titleNumbering: fixtures-only`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        titleNumbering: 'fixtures-only',
        fixtures: getFixturePath('option-title'),
        tests: { 'a-custom-title': { code: simpleTest } }
      })
    );

    await runPluginTester(
      getDummyPluginOptions({
        titleNumbering: 'fixtures-only',
        tests: { 'another one': simpleTest }
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        titleNumbering: 'fixtures-only',
        fixtures: simpleFixture,
        tests: [simpleTest, { code: simpleTest }]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        titleNumbering: 'fixtures-only',
        tests: [{ code: simpleTest, title: 'another-one' }]
      })
    );

    expect(itSpy.mock.calls).toMatchObject([
      [`1. ${requireFixtureOptions('option-title').title}`, expect.any(Function)],
      ['a-custom-title', expect.any(Function)],
      ['another one', expect.any(Function)],
      ['2. fixture', expect.any(Function)],
      [dummyPresetName, expect.any(Function)],
      [dummyPresetName, expect.any(Function)],
      ['another-one', expect.any(Function)]
    ]);
  });

  it('does not number titles when `titleNumbering: false`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        titleNumbering: false,
        fixtures: getFixturePath('option-title'),
        tests: { 'a-custom-title': { code: simpleTest } }
      })
    );

    await runPluginTester(
      getDummyPluginOptions({
        titleNumbering: false,
        tests: { 'another one': simpleTest }
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        titleNumbering: false,
        fixtures: simpleFixture,
        tests: [simpleTest, { code: simpleTest }]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        titleNumbering: false,
        tests: [{ code: simpleTest, title: 'another-one' }]
      })
    );

    expect(itSpy.mock.calls).toMatchObject([
      [requireFixtureOptions('option-title').title, expect.any(Function)],
      ['a-custom-title', expect.any(Function)],
      ['another one', expect.any(Function)],
      ['fixture', expect.any(Function)],
      [dummyPresetName, expect.any(Function)],
      [dummyPresetName, expect.any(Function)],
      ['another-one', expect.any(Function)]
    ]);
  });

  it('uses correct numbering when multiple different `titleNumbering`s are provided', async () => {
    expect.hasAssertions();

    const fixtureTitle = requireFixtureOptions('option-title').title;

    await runPluginTester(
      getDummyPluginOptions({
        titleNumbering: 'fixtures-only',
        fixtures: getFixturePath('option-title'),
        tests: { 'a-custom-title': { code: simpleTest } }
      })
    );

    await runPluginTester(
      getDummyPluginOptions({
        titleNumbering: 'tests-only',
        fixtures: getFixturePath('option-title'),
        tests: { 'another one': simpleTest }
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: simpleFixture,
        tests: [simpleTest, { code: simpleTest }]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        restartTitleNumbering: true,
        tests: [{ code: simpleTest, title: 'another-one' }]
      })
    );

    expect(itSpy.mock.calls).toMatchObject([
      [`1. ${fixtureTitle}`, expect.any(Function)],
      ['2. a-custom-title', expect.any(Function)],
      [fixtureTitle, expect.any(Function)],
      ['1. another one', expect.any(Function)],
      ['2. fixture', expect.any(Function)],
      [`3. ${dummyPresetName}`, expect.any(Function)],
      [`4. ${dummyPresetName}`, expect.any(Function)],
      ['1. another-one', expect.any(Function)]
    ]);
  });

  it('throws if `titleNumbering` is invalid', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        // @ts-expect-error: testing bad value
        titleNumbering: 'invalid',
        fixtures: getFixturePath('option-title')
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        // @ts-expect-error: testing bad value
        titleNumbering: 'invalid',
        tests: [simpleTest, { code: simpleTest }]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        // @ts-expect-error: testing bad value
        titleNumbering: 'invalid',
        fixtures: simpleFixture
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        // @ts-expect-error: testing bad value
        titleNumbering: 'invalid',
        tests: { 'a-custom-title': { code: simpleTest } }
      })
    );
  });

  it('restarts title numbering if `restartTitleNumbering` is true', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('option-title'),
        tests: { 'a-custom-title': { code: simpleTest } }
      })
    );

    await runPluginTester(
      getDummyPluginOptions({
        restartTitleNumbering: true,
        tests: { 'another one': simpleTest }
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: simpleFixture,
        tests: [simpleTest, { code: simpleTest }]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        restartTitleNumbering: true,
        tests: [{ code: simpleTest, title: 'another-one' }]
      })
    );

    expect(itSpy.mock.calls).toMatchObject([
      [`1. ${requireFixtureOptions('option-title').title}`, expect.any(Function)],
      ['2. a-custom-title', expect.any(Function)],
      ['1. another one', expect.any(Function)],
      ['2. fixture', expect.any(Function)],
      [`3. ${dummyPresetName}`, expect.any(Function)],
      [`4. ${dummyPresetName}`, expect.any(Function)],
      ['1. another-one', expect.any(Function)]
    ]);
  });

  it('handles `titleNumbering` and `restartTitleNumbering` together', async () => {
    expect.hasAssertions();

    const fixtureTitle = requireFixtureOptions('option-title').title;

    await runPluginTester(
      getDummyPluginOptions({
        titleNumbering: 'fixtures-only',
        fixtures: getFixturePath('option-title'),
        tests: { 'a-custom-title': { code: simpleTest } }
      })
    );

    await runPluginTester(
      getDummyPluginOptions({
        restartTitleNumbering: true,
        titleNumbering: 'tests-only',
        fixtures: getFixturePath('option-title'),
        tests: { 'another one': simpleTest }
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        restartTitleNumbering: true,
        titleNumbering: false,
        fixtures: simpleFixture,
        tests: [simpleTest, { code: simpleTest }]
      })
    );

    expect(itSpy.mock.calls).toMatchObject([
      [`1. ${fixtureTitle}`, expect.any(Function)],
      ['a-custom-title', expect.any(Function)],
      [fixtureTitle, expect.any(Function)],
      ['2. another one', expect.any(Function)],
      ['fixture', expect.any(Function)],
      [dummyPresetName, expect.any(Function)],
      [dummyPresetName, expect.any(Function)]
    ]);
  });

  it('exits early if `tests` is empty and `fixtures` is not a directory path or points to an improperly structured directory', async () => {
    expect.hasAssertions();

    const { plugin } = getDummyPluginOptions();

    await runPluginTester({ plugin });

    expect(describeSpy).toHaveBeenCalledTimes(0);
    expect(itSpy).toHaveBeenCalledTimes(0);

    await runPluginTester({ plugin, tests: [] });

    expect(describeSpy).toHaveBeenCalledTimes(0);
    expect(itSpy).toHaveBeenCalledTimes(0);

    await runPluginTester({ plugin, tests: {} });

    expect(describeSpy).toHaveBeenCalledTimes(0);
    expect(itSpy).toHaveBeenCalledTimes(0);

    await runPluginTester({ plugin, fixtures: __filename });

    expect(describeSpy).toHaveBeenCalledTimes(0);
    expect(itSpy).toHaveBeenCalledTimes(0);

    await runPluginTester({ plugin, fixtures: getFixturePath('empty') });

    expect(describeSpy).toHaveBeenCalledTimes(0);
    expect(itSpy).toHaveBeenCalledTimes(0);

    await runPluginTester({ plugin, tests: [], fixtures: __filename });

    expect(describeSpy).toHaveBeenCalledTimes(0);
    expect(itSpy).toHaveBeenCalledTimes(0);

    const { preset } = getDummyPresetOptions();

    await runPluginTester({ preset });

    expect(describeSpy).toHaveBeenCalledTimes(0);
    expect(itSpy).toHaveBeenCalledTimes(0);

    await runPluginTester({ preset, tests: [] });

    expect(describeSpy).toHaveBeenCalledTimes(0);
    expect(itSpy).toHaveBeenCalledTimes(0);

    await runPluginTester({ preset, tests: {} });

    expect(describeSpy).toHaveBeenCalledTimes(0);
    expect(itSpy).toHaveBeenCalledTimes(0);

    await runPluginTester({ preset, fixtures: __filename });

    expect(describeSpy).toHaveBeenCalledTimes(0);
    expect(itSpy).toHaveBeenCalledTimes(0);

    await runPluginTester({ preset, fixtures: getFixturePath('empty') });

    expect(describeSpy).toHaveBeenCalledTimes(0);
    expect(itSpy).toHaveBeenCalledTimes(0);

    await runPluginTester({ preset, tests: [], fixtures: __filename });

    expect(describeSpy).toHaveBeenCalledTimes(0);
    expect(itSpy).toHaveBeenCalledTimes(0);
  });
});

describe('tests targeting both FixtureOptions and TestObject interfaces', () => {
  it('throws if `it.skip` or `it.only` functions are not available in the global scope when using `skip`/`only`', async () => {
    expect.hasAssertions();

    const oldIt = globalThis.it;

    // @ts-expect-error: I'll put it back, I pwomise!
    globalThis.it = () => undefined;

    try {
      await runPluginTesterExpectThrownException(
        getDummyPluginOptions({ fixtures: getFixturePath('option-skip') })
      );

      await runPluginTesterExpectThrownException(
        getDummyPresetOptions({ fixtures: getFixturePath('option-only') })
      );

      await runPluginTesterExpectThrownException(
        getDummyPluginOptions({ tests: [{ code: simpleTest, skip: true }] })
      );

      await runPluginTesterExpectThrownException(
        getDummyPresetOptions({ tests: [{ code: simpleTest, only: true }] })
      );
    } finally {
      globalThis.it = oldIt;
    }
  });

  it('uses `title`, if available, for the `it` block, otherwise uses `pluginName`/`presetName`, directory name, or object key', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('option-title'),
        tests: {
          'test-1': { code: simpleTest, title: 'test-x' },
          'test 2': simpleTest,
          '': simpleTest
        }
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('simple'),
        tests: [
          simpleTest,
          { code: simpleTest },
          { code: simpleTest, title: 'some-custom-title' }
        ]
      })
    );

    expect(itSpy.mock.calls).toMatchObject([
      [`1. ${requireFixtureOptions('option-title').title}`, expect.any(Function)],
      ['2. test-x', expect.any(Function)],
      ['3. test 2', expect.any(Function)],
      [`4. ${dummyExplicitPluginName}`, expect.any(Function)],
      ['5. fixture', expect.any(Function)],
      [`6. ${dummyPresetName}`, expect.any(Function)],
      [`7. ${dummyPresetName}`, expect.any(Function)],
      [`8. ${dummyPresetName}`, expect.any(Function)]
    ]);
  });

  it('setting `title` to an empty string is equivalent to setting `title` to `undefined`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('option-title-empty'),
        tests: { '': simpleTest }
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('option-title-empty'),
        tests: [{ code: simpleTest, title: '' }]
      })
    );

    expect(itSpy.mock.calls).toMatchObject([
      ['1. fixture', expect.any(Function)],
      [`2. ${dummyExplicitPluginName}`, expect.any(Function)],
      ['3. fixture', expect.any(Function)],
      [`4. ${dummyPresetName}`, expect.any(Function)]
    ]);
  });

  it('calls `describe` and `it` in the proper order when `tests` and `fixtures` are provided together', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: simpleFixture,
        tests: [simpleTest]
      })
    );

    expect(describeSpy.mock.calls).toMatchObject([
      [`${dummyExplicitPluginName} fixtures`, expect.any(Function)],
      [dummyExplicitPluginName, expect.any(Function)],
      [`${dummyExplicitPluginName} fixtures`, expect.any(Function)],
      [dummyExplicitPluginName, expect.any(Function)]
    ]);

    expect(itSpy.mock.calls).toMatchObject([
      [`1. fixture`, expect.any(Function)],
      [`2. ${dummyExplicitPluginName}`, expect.any(Function)],
      [`3. fixture`, expect.any(Function)],
      [`4. ${dummyPresetName}`, expect.any(Function)]
    ]);
  });

  it('handles failing `tests` and `fixtures` gracefully', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        plugin: identifierReversePlugin,
        fixtures: getFixturePath('simple')
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        plugin: identifierReversePlugin,
        tests: [{ code: simpleTest }]
      })
    );
  });

  it('runs multiple tests and fixtures together', async () => {
    expect.hasAssertions();

    const customTitle = 'third-test';

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('multiple'),
        tests: [
          simpleTest,
          { code: simpleTest },
          { code: simpleTest, title: customTitle }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('multiple'),
        tests: [
          simpleTest,
          { code: simpleTest },
          { code: simpleTest, title: customTitle }
        ]
      })
    );

    expect(describeSpy.mock.calls).toMatchObject([
      [`${dummyExplicitPluginName} fixtures`, expect.any(Function)],
      [dummyExplicitPluginName, expect.any(Function)],
      [`${dummyExplicitPluginName} fixtures`, expect.any(Function)],
      [dummyExplicitPluginName, expect.any(Function)]
    ]);

    expect(itSpy.mock.calls).toMatchObject([
      [`1. fixture 1`, expect.any(Function)],
      [`2. fixture 2`, expect.any(Function)],
      [`3. fixture 3`, expect.any(Function)],
      [`4. fixture 4`, expect.any(Function)],
      [`5. fixture 5`, expect.any(Function)],
      [`6. ${dummyExplicitPluginName}`, expect.any(Function)],
      [`7. ${dummyExplicitPluginName}`, expect.any(Function)],
      [`8. ${customTitle}`, expect.any(Function)],
      [`9. fixture 1`, expect.any(Function)],
      [`10. fixture 2`, expect.any(Function)],
      [`11. fixture 3`, expect.any(Function)],
      [`12. fixture 4`, expect.any(Function)],
      [`13. fixture 5`, expect.any(Function)],
      [`14. ${dummyExplicitPluginName}`, expect.any(Function)],
      [`15. ${dummyExplicitPluginName}`, expect.any(Function)],
      [`16. ${customTitle}`, expect.any(Function)]
    ]);
  });

  it('merges global `babelOptions` with test-level `babelOptions`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        babelOptions: { assumptions: { constantReexports: true } },
        fixtures: getFixturePath('option-babelOptions-assumptions'),
        tests: [
          {
            code: simpleTest,
            babelOptions: {
              assumptions: {
                constantReexports: false
              }
            }
          }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        babelOptions: { assumptions: { constantReexports: true } },
        fixtures: getFixturePath('option-babelOptions-assumptions'),
        tests: [
          {
            code: simpleTest,
            babelOptions: {
              assumptions: {
                constantReexports: false
              }
            }
          }
        ]
      })
    );

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [
        expect.any(String),
        expect.objectContaining({ assumptions: { constantReexports: false } })
      ],
      [
        expect.any(String),
        expect.objectContaining({ assumptions: { constantReexports: false } })
      ],
      [
        expect.any(String),
        expect.objectContaining({ assumptions: { constantReexports: false } })
      ],
      [
        expect.any(String),
        expect.objectContaining({ assumptions: { constantReexports: false } })
      ]
    ]);
  });

  it('merges global `pluginOptions` with test-level `pluginOptions`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        pluginOptions: {
          optionA: true
        },
        fixtures: getFixturePath('option-pluginOptions'),
        tests: [{ code: simpleTest, pluginOptions: { optionA: false } }]
      })
    );

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [
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
      ],
      [
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
      ]
    ]);
  });

  it('merges global `presetOptions` with test-level `presetOptions`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPresetOptions({
        presetOptions: {
          optionA: true
        },
        fixtures: getFixturePath('option-presetOptions'),
        tests: [{ code: simpleTest, presetOptions: { optionA: false } }]
      })
    );

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [
        expect.any(String),
        expect.objectContaining({
          presets: expect.arrayContaining([
            [
              expect.any(Function),
              expect.objectContaining({
                optionA: false
              })
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          presets: expect.arrayContaining([
            [
              expect.any(Function),
              expect.objectContaining({
                optionA: false
              })
            ]
          ])
        })
      ]
    ]);
  });

  it('calls `it.only` if `only` is provided', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('option-only'),
        tests: [{ code: simpleTest, only: true, title: 'test-x' }]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('multiple-with-only'),
        tests: [simpleTest, { code: simpleTest, only: true, title: 'test-y' }]
      })
    );

    expect(mockedItOnly.mock.calls).toMatchObject([
      ['1. fixture', expect.any(Function)],
      ['2. test-x', expect.any(Function)],
      ['4. fixture-2', expect.any(Function)],
      ['6. fixture-4', expect.any(Function)],
      ['9. test-y', expect.any(Function)]
    ]);

    expect(itSpy.mock.calls).toMatchObject([
      ['3. fixture-1', expect.any(Function)],
      ['5. fixture-3', expect.any(Function)],
      ['7. fixture-5', expect.any(Function)],
      [`8. ${dummyExplicitPluginName}`, expect.any(Function)]
    ]);
  });

  it('calls `it.skip` if `skip` is provided', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('option-skip'),
        tests: [{ code: simpleTest, skip: true, title: 'test-x' }]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('multiple-with-skip'),
        tests: [simpleTest, { code: simpleTest, skip: true, title: 'test-y' }]
      })
    );

    expect(mockedItSkip.mock.calls).toMatchObject([
      ['1. fixture', expect.any(Function)],
      ['2. test-x', expect.any(Function)],
      ['4. fixture-2', expect.any(Function)],
      ['6. fixture-4', expect.any(Function)],
      ['9. test-y', expect.any(Function)]
    ]);

    expect(itSpy.mock.calls).toMatchObject([
      ['3. fixture-1', expect.any(Function)],
      ['5. fixture-3', expect.any(Function)],
      ['7. fixture-5', expect.any(Function)],
      [`8. ${dummyExplicitPluginName}`, expect.any(Function)]
    ]);
  });

  it('calls `it.only` with respect to TEST_ONLY environment variable', async () => {
    expect.hasAssertions();

    await withMockedEnv(
      async () => {
        await runPluginTester(
          getDummyPluginOptions({
            fixtures: getFixturePath('option-only'),
            tests: [{ code: simpleTest, only: true, title: 'test-x' }]
          })
        );

        await runPluginTester(
          getDummyPresetOptions({
            fixtures: getFixturePath('multiple-with-only'),
            tests: [simpleTest, { code: simpleTest, only: true, title: 'test-🚀' }]
          })
        );

        expect(mockedItOnly.mock.calls).toMatchObject([
          ['1. fixture', expect.any(Function)],
          ['2. test-x', expect.any(Function)],
          ['3. fixture-1', expect.any(Function)],
          ['4. fixture-2', expect.any(Function)],
          ['6. fixture-4', expect.any(Function)],
          ['7. fixture-5', expect.any(Function)],
          ['9. test-🚀', expect.any(Function)]
        ]);

        expect(itSpy.mock.calls).toMatchObject([
          ['5. fixture-3', expect.any(Function)],
          [`8. ${dummyExplicitPluginName}`, expect.any(Function)]
        ]);
      },
      { TEST_ONLY: 'fixture-1|5' }
    );
  });

  it('calls `it.skip` with respect to TEST_SKIP environment variable', async () => {
    expect.hasAssertions();

    await withMockedEnv(
      async () => {
        await runPluginTester(
          getDummyPluginOptions({
            fixtures: getFixturePath('option-skip'),
            tests: [{ code: simpleTest, skip: true, title: 'test-x' }]
          })
        );

        await runPluginTester(
          getDummyPresetOptions({
            fixtures: getFixturePath('multiple-with-skip'),
            tests: [simpleTest, { code: simpleTest, skip: true, title: 'test-🚀' }]
          })
        );

        expect(mockedItSkip.mock.calls).toMatchObject([
          ['1. fixture', expect.any(Function)],
          ['2. test-x', expect.any(Function)],
          ['3. fixture-1', expect.any(Function)],
          ['4. fixture-2', expect.any(Function)],
          ['6. fixture-4', expect.any(Function)],
          ['7. fixture-5', expect.any(Function)],
          ['9. test-🚀', expect.any(Function)]
        ]);

        expect(itSpy.mock.calls).toMatchObject([
          ['5. fixture-3', expect.any(Function)],
          [`8. ${dummyExplicitPluginName}`, expect.any(Function)]
        ]);
      },
      { TEST_SKIP: 'fixture-1|5' }
    );
  });

  it('prioritizes TEST_SKIP over TEST_ONLY, `skip`, and `only`', async () => {
    expect.hasAssertions();

    await withMockedEnv(
      async () => {
        await runPluginTester(
          getDummyPluginOptions({
            fixtures: getFixturePath('option-only'),
            tests: [{ code: simpleTest, only: true, title: 'test-6' }]
          })
        );

        await runPluginTester(
          getDummyPresetOptions({
            fixtures: getFixturePath('multiple-with-only'),
            tests: [simpleTest, { code: simpleTest, skip: false, title: 'test-🚀' }]
          })
        );

        expect(mockedItOnly.mock.calls).toMatchObject([
          ['1. fixture', expect.any(Function)],
          ['5. fixture-3', expect.any(Function)],
          ['6. fixture-4', expect.any(Function)]
        ]);

        expect(mockedItSkip.mock.calls).toMatchObject([
          ['2. test-6', expect.any(Function)],
          ['3. fixture-1', expect.any(Function)],
          ['4. fixture-2', expect.any(Function)],
          ['7. fixture-5', expect.any(Function)],
          ['9. test-🚀', expect.any(Function)]
        ]);

        expect(itSpy.mock.calls).toMatchObject([
          [`8. ${dummyExplicitPluginName}`, expect.any(Function)]
        ]);
      },
      {
        //? Should be able to handle unicode-enabled regular expressions
        TEST_SKIP: 'fixture-1|fixture-2|5|6|test-\\p{Emoji_Presentation}',
        TEST_ONLY: 'fixture-1|6|test-🚀|3'
      }
    );
  });

  it('prioritizes TEST_ONLY over `skip` and `only`', async () => {
    expect.hasAssertions();

    await withMockedEnv(
      async () => {
        await runPluginTester(
          getDummyPluginOptions({
            fixtures: getFixturePath('option-skip'),
            tests: [{ code: simpleTest, skip: true, title: 'test-6' }]
          })
        );

        await runPluginTester(
          getDummyPresetOptions({
            fixtures: getFixturePath('multiple-with-skip'),
            tests: [simpleTest, { code: simpleTest, only: false, title: 'test-🚀' }]
          })
        );

        expect(mockedItOnly.mock.calls).toMatchObject([
          ['2. test-6', expect.any(Function)],
          ['3. fixture-1', expect.any(Function)],
          ['4. fixture-2', expect.any(Function)],
          ['7. fixture-5', expect.any(Function)],
          ['9. test-🚀', expect.any(Function)]
        ]);

        expect(mockedItSkip.mock.calls).toMatchObject([
          ['1. fixture', expect.any(Function)],
          ['6. fixture-4', expect.any(Function)]
        ]);

        expect(itSpy.mock.calls).toMatchObject([
          ['5. fixture-3', expect.any(Function)],
          [`8. ${dummyExplicitPluginName}`, expect.any(Function)]
        ]);
      },
      {
        //? Should be able to handle unicode-enabled regular expressions
        TEST_ONLY: 'fixture-1|fixture-2|5|6|test-\\p{Emoji_Presentation}'
      }
    );
  });

  it('calls `it.only` with respect to TEST_NUM_ONLY environment variable', async () => {
    expect.hasAssertions();

    await withMockedEnv(
      async () => {
        await runPluginTester(
          getDummyPluginOptions({
            fixtures: getFixturePath('option-only'),
            tests: [{ code: simpleTest, only: true, title: 'test-x' }]
          })
        );

        await runPluginTester(
          getDummyPresetOptions({
            fixtures: getFixturePath('multiple-with-only'),
            tests: [simpleTest, { code: simpleTest, only: true, title: 'test-y' }]
          })
        );

        expect(mockedItOnly.mock.calls).toMatchObject([
          ['1. fixture', expect.any(Function)],
          ['2. test-x', expect.any(Function)],
          ['3. fixture-1', expect.any(Function)],
          ['4. fixture-2', expect.any(Function)],
          ['5. fixture-3', expect.any(Function)],
          ['6. fixture-4', expect.any(Function)],
          ['7. fixture-5', expect.any(Function)],
          [`8. ${dummyExplicitPluginName}`, expect.any(Function)],
          ['9. test-y', expect.any(Function)]
        ]);

        expect(mockedItSkip).toBeCalledTimes(0);
        expect(itSpy).toBeCalledTimes(0);
      },
      {
        // ? Should be able to handle multiple random commas and overlapping
        // ? ranges
        TEST_NUM_ONLY: ',,,3,  5-5,  ,5-7,6-20'
      }
    );
  });

  it('calls `it.skip` with respect to TEST_NUM_SKIP environment variable', async () => {
    expect.hasAssertions();

    await withMockedEnv(
      async () => {
        await runPluginTester(
          getDummyPluginOptions({
            fixtures: getFixturePath('option-skip'),
            tests: [{ code: simpleTest, skip: true, title: 'test-x' }]
          })
        );

        await runPluginTester(
          getDummyPresetOptions({
            fixtures: getFixturePath('multiple-with-skip'),
            tests: [simpleTest, { code: simpleTest, skip: true, title: 'test-y' }]
          })
        );

        expect(mockedItSkip.mock.calls).toMatchObject([
          ['1. fixture', expect.any(Function)],
          ['2. test-x', expect.any(Function)],
          ['3. fixture-1', expect.any(Function)],
          ['4. fixture-2', expect.any(Function)],
          ['5. fixture-3', expect.any(Function)],
          ['6. fixture-4', expect.any(Function)],
          ['7. fixture-5', expect.any(Function)],
          [`8. ${dummyExplicitPluginName}`, expect.any(Function)],
          ['9. test-y', expect.any(Function)]
        ]);

        expect(mockedItOnly).toBeCalledTimes(0);
        expect(itSpy).toBeCalledTimes(0);
      },
      {
        // ? Should be able to handle multiple random commas, overlapping
        // ? ranges, and single-number ranges
        TEST_NUM_SKIP: '3,,  5-5  , ,5-7,6-20,,,'
      }
    );
  });

  it('prioritizes TEST_NUM_SKIP over TEST_NUM_ONLY, `skip`, and `only`', async () => {
    expect.hasAssertions();

    await withMockedEnv(
      async () => {
        await runPluginTester(
          getDummyPluginOptions({
            fixtures: getFixturePath('option-only'),
            tests: [{ code: simpleTest, only: true, title: 'test-6' }]
          })
        );

        await runPluginTester(
          getDummyPresetOptions({
            fixtures: getFixturePath('multiple-with-only'),
            tests: [simpleTest, { code: simpleTest, skip: false, title: 'test-y' }]
          })
        );

        expect(mockedItSkip.mock.calls).toMatchObject([
          ['1. fixture', expect.any(Function)],
          ['2. test-6', expect.any(Function)],
          ['3. fixture-1', expect.any(Function)],
          ['4. fixture-2', expect.any(Function)],
          ['5. fixture-3', expect.any(Function)],
          ['6. fixture-4', expect.any(Function)],
          ['7. fixture-5', expect.any(Function)],
          [`8. ${dummyExplicitPluginName}`, expect.any(Function)],
          ['9. test-y', expect.any(Function)]
        ]);

        expect(mockedItOnly).toBeCalledTimes(0);
        expect(itSpy).toBeCalledTimes(0);
      },
      { TEST_NUM_SKIP: '1-9', TEST_NUM_ONLY: '5, 6, 7' }
    );
  });

  it('prioritizes TEST_NUM_ONLY over `skip` and `only`', async () => {
    expect.hasAssertions();

    await withMockedEnv(
      async () => {
        await runPluginTester(
          getDummyPluginOptions({
            fixtures: getFixturePath('option-skip'),
            tests: [{ code: simpleTest, skip: true, title: 'test-6' }]
          })
        );

        await runPluginTester(
          getDummyPresetOptions({
            fixtures: getFixturePath('multiple-with-skip'),
            tests: [simpleTest, { code: simpleTest, only: false, title: 'test-y' }]
          })
        );

        expect(mockedItOnly.mock.calls).toMatchObject([
          ['1. fixture', expect.any(Function)],
          ['2. test-6', expect.any(Function)],
          ['3. fixture-1', expect.any(Function)],
          ['4. fixture-2', expect.any(Function)],
          ['5. fixture-3', expect.any(Function)],
          ['6. fixture-4', expect.any(Function)],
          ['7. fixture-5', expect.any(Function)],
          [`8. ${dummyExplicitPluginName}`, expect.any(Function)],
          ['9. test-y', expect.any(Function)]
        ]);

        expect(mockedItSkip).toBeCalledTimes(0);
        expect(itSpy).toBeCalledTimes(0);
      },
      { TEST_NUM_ONLY: '1-9' }
    );
  });

  it('respects `restartTitleNumbering` when using TEST_NUM_SKIP and TEST_NUM_ONLY', async () => {
    expect.hasAssertions();

    await withMockedEnv(
      async () => {
        await runPluginTester(
          getDummyPluginOptions({
            fixtures: getFixturePath('multiple'),
            tests: [{ code: simpleTest, title: 'test-x' }]
          })
        );

        await runPluginTester(
          getDummyPresetOptions({
            restartTitleNumbering: true,
            fixtures: getFixturePath('multiple'),
            tests: [simpleTest, { code: simpleTest, title: 'test-y' }]
          })
        );

        expect(mockedItOnly.mock.calls).toMatchObject([
          ['1. fixture-1', expect.any(Function)],
          ['2. fixture-2', expect.any(Function)],
          ['3. fixture-3', expect.any(Function)],
          ['1. fixture-1', expect.any(Function)],
          ['2. fixture-2', expect.any(Function)],
          ['3. fixture-3', expect.any(Function)],
          ['7. test-y', expect.any(Function)]
        ]);

        expect(mockedItSkip.mock.calls).toMatchObject([
          ['4. fixture-4', expect.any(Function)],
          ['4. fixture-4', expect.any(Function)]
        ]);

        expect(itSpy.mock.calls).toMatchObject([
          ['5. fixture-5', expect.any(Function)],
          ['6. test-x', expect.any(Function)],
          ['5. fixture-5', expect.any(Function)],
          [`6. ${dummyExplicitPluginName}`, expect.any(Function)]
        ]);
      },
      {
        TEST_NUM_ONLY: '1-3,7',
        TEST_NUM_SKIP: '4'
      }
    );
  });

  it('ignores TEST_NUM_SKIP and TEST_NUM_ONLY on tests for which `titleNumbering` is disabled', async () => {
    expect.hasAssertions();

    await withMockedEnv(
      async () => {
        await runPluginTester(
          getDummyPluginOptions({
            titleNumbering: 'fixtures-only',
            fixtures: getFixturePath('multiple'),
            tests: [{ code: simpleTest, title: 'test-x' }]
          })
        );

        await runPluginTester(
          getDummyPresetOptions({
            titleNumbering: 'tests-only',
            restartTitleNumbering: true,
            fixtures: getFixturePath('multiple'),
            tests: [simpleTest, { code: simpleTest, title: 'test-y' }]
          })
        );

        await runPluginTester(
          getDummyPresetOptions({
            titleNumbering: false,
            fixtures: getFixturePath('multiple'),
            tests: [simpleTest, { code: simpleTest, title: 'test-z' }]
          })
        );

        expect(mockedItOnly.mock.calls).toMatchObject([
          ['1. fixture-1', expect.any(Function)],
          ['2. fixture-2', expect.any(Function)],
          ['3. fixture-3', expect.any(Function)],
          [`1. ${dummyExplicitPluginName}`, expect.any(Function)],
          ['2. test-y', expect.any(Function)]
        ]);

        expect(mockedItSkip.mock.calls).toMatchObject([
          ['4. fixture-4', expect.any(Function)],
          ['5. fixture-5', expect.any(Function)]
        ]);

        expect(itSpy.mock.calls).toMatchObject([
          ['test-x', expect.any(Function)],
          ['fixture-1', expect.any(Function)],
          ['fixture-2', expect.any(Function)],
          ['fixture-3', expect.any(Function)],
          ['fixture-4', expect.any(Function)],
          ['fixture-5', expect.any(Function)],
          ['fixture-1', expect.any(Function)],
          ['fixture-2', expect.any(Function)],
          ['fixture-3', expect.any(Function)],
          ['fixture-4', expect.any(Function)],
          ['fixture-5', expect.any(Function)],
          [dummyExplicitPluginName, expect.any(Function)],
          ['test-z', expect.any(Function)]
        ]);
      },
      {
        TEST_NUM_ONLY: '1-3,7',
        TEST_NUM_SKIP: '4-6'
      }
    );
  });

  it('throws when TEST_NUM_SKIP or TEST_NUM_ONLY are passed invalid values', async () => {
    expect.hasAssertions();
    // TODO: negative numbers, negative ranges, broken ranges, backwards ranges, spaces between numbers without a comma, bad syntax, etc
  });

  it('throws if both `only` and `skip` are provided', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        fixtures: getFixturePath('option-skip-only')
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        tests: [{ code: simpleTest, only: true, skip: true }]
      })
    );
  });

  it('captures babel transform errors when `throws: true`', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectCapturedError(true, {
      fixtures: getFixturePath('option-throws-true')
    });
  });

  it('throws when babel transform errors and `throws: false`', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownExceptionWhenCapturingError(false, {
      fixtures: getFixturePath('option-throws-false')
    });
  });

  it('captures babel transform errors when `throws: string`', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectCapturedError('expected this error to be captured', {
      fixtures: getFixturePath('option-throws-string')
    });
  });

  it('captures babel transform errors when `throws: RegExp instance`', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectCapturedError(/captured/, {
      fixtures: getFixturePath('option-throws-regex')
    });
  });

  it('captures babel transform errors when `throws: Error constructor`', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectCapturedError(SyntaxError, {
      fixtures: getFixturePath('option-throws-class')
    });
  });

  it('captures babel transform errors when `throws: callback`', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectCapturedError(
      (error) => error instanceof SyntaxError && /captured/.test(error.message),
      {
        fixtures: getFixturePath('option-throws-function')
      }
    );
  });

  it("throws if `throws` callback doesn't return `true`", async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownExceptionWhenCapturingError(() => false, {
      fixtures: getFixturePath('option-throws-false-function')
    });
  });

  it('throws if `throws` is not `false` but no error thrown', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownExceptionWhenCapturingError(true, {
      plugin: () => ({ visitor: {} }),
      fixtures: getFixturePath('option-throws-true')
    });
  });

  it('throws if both `throws` and `exec`/`execFixture`/exec.js are provided', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownExceptionWhenCapturingError(true, {
      fixtures: getFixturePath('option-throws-and-exec-file')
    });

    await runPluginTesterExpectThrownExceptionWhenCapturingError(true, {
      tests: [{ exec: simpleTest, throws: true }]
    });

    await runPluginTesterExpectThrownExceptionWhenCapturingError(true, {
      tests: [{ execFixture: dummyProjectRootFilepath, throws: true }]
    });
  });

  it('throws if both `throws` and `output`/`outputFixture`/output.js are provided', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownExceptionWhenCapturingError(true, {
      fixtures: getFixturePath('option-throws-and-output-file')
    });

    await runPluginTesterExpectThrownExceptionWhenCapturingError(true, {
      tests: [{ code: simpleTest, throws: true, output: simpleTest }]
    });

    await runPluginTesterExpectThrownExceptionWhenCapturingError(true, {
      tests: [{ code: simpleTest, throws: true, outputFixture: dummyProjectRootFilepath }]
    });
  });

  it('considers deprecated `error` as synonymous with `throws`', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectCapturedError(true, {
      fixtures: getFixturePath('option-throws-error-deprecated')
    });

    await runPluginTesterExpectCapturedError(true, {
      tests: [{ code: simpleTest, error: true }]
    });
  });

  it('supports built-in prettier-based formatter using `filepath`/`babelOptions.filename` and nearest prettier configuration', async () => {
    expect.hasAssertions();

    const codeFileWithPrettierConfig = getFixturePath(
      'prettier-configured/fixture/code.js'
    );

    await withMockedOutput(async ({ logSpy }) => {
      await runPluginTester(
        getDummyPluginOptions({
          formatResult: prettierFormatter,
          fixtures: getFixturePath('prettier-configured'),
          tests: {
            'formatted-1': {
              babelOptions: { filename: codeFileWithPrettierConfig },
              code: `
            console.log(  "hey"  )
          `,
              output: `
            console.log("hey");
          `
            },
            'formatted-2': {
              codeFixture: codeFileWithPrettierConfig,
              output: 'console.log("hey");'
            },
            'formatted-3': {
              execFixture: codeFileWithPrettierConfig
            }
          }
        })
      );

      await runPluginTester(
        getDummyPresetOptions({
          filepath: codeFileWithPrettierConfig,
          formatResult: prettierFormatter,
          fixtures: getFixturePath('prettier-configured'),
          tests: {
            'formatted-1': {
              code: `
            console.log(  "hey"  )
          `,
              output: `
            console.log("hey");
          `
            },
            'formatted-2': {
              codeFixture: codeFileWithPrettierConfig,
              output: 'console.log("hey");'
            },
            'formatted-3': {
              execFixture: codeFileWithPrettierConfig
            }
          }
        })
      );

      expect(logSpy.mock.calls).toMatchObject([['hey'], ['hey']]);
    });
  });

  it('overrides global `formatResult` with test-level `formatResult`', async () => {
    expect.hasAssertions();

    const { formatResult } = requireFixtureOptions('option-formatResult');
    const formatResultSpy = jest.fn((r) => r);

    await runPluginTester(
      getDummyPluginOptions({
        formatResult: formatResultSpy,
        fixtures: getFixturePath('option-formatResult'),
        tests: [{ code: simpleTest, output: formatResult!(simpleTest), formatResult }]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        formatResult: formatResultSpy,
        fixtures: getFixturePath('option-formatResult'),
        tests: [{ code: simpleTest, output: formatResult!(simpleTest), formatResult }]
      })
    );

    expect(formatResultSpy).toBeCalledTimes(0);
  });

  // TODO: fix and then un-skip these tests

  it.skip('supports jsx source using syntax plugin', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('support-jsx'),
        tests: [
          {
            babelOptions: { plugins: ['@babel/plugin-syntax-jsx'] },
            codeFixture: getFixturePath('support-jsx/fixture/code.jsx')
          }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('support-jsx'),
        tests: [
          {
            babelOptions: { plugins: ['@babel/plugin-syntax-jsx'] },
            codeFixture: getFixturePath('support-jsx/fixture/code.jsx')
          }
        ]
      })
    );

    expect(itSpy).toBeCalledTimes(4);
  });

  it.skip('supports ts source using syntax plugin', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('support-ts'),
        tests: [
          {
            babelOptions: { plugins: ['@babel/plugin-syntax-typescript'] },
            codeFixture: getFixturePath('support-ts/fixture/code.ts'),
            outputFixture: getFixturePath('support-ts/fixture/output.ts')
          }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('support-ts'),
        tests: [
          {
            babelOptions: { plugins: ['@babel/plugin-syntax-typescript'] },
            codeFixture: getFixturePath('support-ts/fixture/code.ts'),
            outputFixture: getFixturePath('support-ts/fixture/output.ts')
          }
        ]
      })
    );

    expect(itSpy).toBeCalledTimes(4);
  });

  it.skip('supports tsx source using syntax plugin', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('support-tsx'),
        tests: [
          {
            babelOptions: {
              plugins: [['@babel/plugin-syntax-typescript', { isTSX: true }]]
            },
            codeFixture: getFixturePath('support-tsx/fixture/code.tsx')
          }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('support-tsx'),
        tests: [
          {
            babelOptions: {
              plugins: [['@babel/plugin-syntax-typescript', { isTSX: true }]]
            },
            codeFixture: getFixturePath('support-tsx/fixture/code.tsx')
          }
        ]
      })
    );

    expect(itSpy).toBeCalledTimes(4);
  });
});

describe('tests targeting the FixtureOptions interface', () => {
  it('resolves non-absolute `fixtures` path relative to `filepath`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        filepath: dummyProjectRootFilepath,
        fixtures: 'test/fixtures/simple'
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        filepath: dummyProjectRootFilepath,
        fixtures: 'test/fixtures/simple'
      })
    );

    expect(describeSpy.mock.calls).toMatchObject([
      [`${dummyExplicitPluginName} fixtures`, expect.any(Function)],
      [`${dummyPresetName} fixtures`, expect.any(Function)]
    ]);

    expect(itSpy.mock.calls).toMatchObject([
      ['1. fixture', expect.any(Function)],
      ['2. fixture', expect.any(Function)]
    ]);
  });

  it('resolves absolute `fixtures` path regardless of `filepath`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        filepath: path.join(
          __dirname,
          './does-not-exist/should-use-absolute-fixtures-path-instead.js'
        ),
        fixtures: simpleFixture
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        filepath: path.join(
          __dirname,
          './does-not-exist/should-use-absolute-fixtures-path-instead.js'
        ),
        fixtures: simpleFixture
      })
    );

    expect(describeSpy.mock.calls).toMatchObject([
      [`${dummyExplicitPluginName} fixtures`, expect.any(Function)],
      [`${dummyPresetName} fixtures`, expect.any(Function)]
    ]);

    expect(itSpy.mock.calls).toMatchObject([
      ['1. fixture', expect.any(Function)],
      ['2. fixture', expect.any(Function)]
    ]);
  });

  it('replaces dashes with spaces in `it` block `title` when deriving from directory name', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        title: 'still-has-dashes',
        fixtures: getFixturePath('dir-name-with-dashes')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('option-title')
      })
    );

    expect(describeSpy.mock.calls).toMatchObject([
      ['still-has-dashes fixtures', expect.any(Function)],
      [`${dummyPresetName} fixtures`, expect.any(Function)]
    ]);

    expect(itSpy.mock.calls).toMatchObject([
      ['1. fixture with dashes', expect.any(Function)],
      ['2. some-custom-title', expect.any(Function)]
    ]);
  });

  it('uses `title` from nested options files for `it` blocks', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('nested-titles')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('nested-titles')
      })
    );

    expect(itSpy.mock.calls).toMatchObject([
      ['1. n3', expect.any(Function)],
      ['2. n4', expect.any(Function)],
      ['3. n2', expect.any(Function)],
      ['4. n1', expect.any(Function)],
      ['5. n3', expect.any(Function)],
      ['6. n4', expect.any(Function)],
      ['7. n2', expect.any(Function)],
      ['8. n1', expect.any(Function)]
    ]);
  });

  it('uses code.js/exec.js path as `babelOptions.filename` by default, overriding any globals', async () => {
    expect.hasAssertions();

    const execFixturesPath = getFixturePath('exec-file-passing');

    await runPluginTester(
      getDummyPluginOptions({
        plugin: identifierReversePlugin,
        filepath: '/bad/bad/not/good.js',
        babelOptions: {
          filename: '/does/not/exist/and/never/did.js'
        },
        fixtures: simpleFixture
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        filepath: '/bad/bad/not/good.js',
        babelOptions: {
          filename: '/does/not/exist/and/never/did.js'
        },
        fixtures: execFixturesPath
      })
    );

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [expect.any(String), expect.objectContaining({ filename: simpleFixture })],
      [expect.any(String), expect.objectContaining({ filename: execFixturesPath })],
      [expect.any(String), expect.objectContaining({ filename: execFixturesPath })],
      [expect.any(String), expect.objectContaining({ filename: execFixturesPath })],
      [expect.any(String), expect.objectContaining({ filename: execFixturesPath })],
      [expect.any(String), expect.objectContaining({ filename: execFixturesPath })]
    ]);
  });

  it('uses the test-level `babelOptions.filename` over the default and any globals', async () => {
    expect.hasAssertions();

    const filename = '/something/or/other/does/not/exist.js';

    await runPluginTester(
      getDummyPluginOptions({
        plugin: identifierReversePlugin,
        filename: '/bad/bad/not/good.js',
        babelOptions: {
          filename: '/does/not/exist/and/never/did.js'
        },
        fixtures: getFixturePath('option-babelOptions-filename')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        plugin: identifierReversePlugin,
        filename: '/bad/bad/not/good.js',
        babelOptions: {
          filename: '/does/not/exist/and/never/did.js'
        },
        fixtures: getFixturePath('option-babelOptions-filename')
      })
    );

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [expect.any(String), expect.objectContaining({ filename })],
      [expect.any(String), expect.objectContaining({ filename })],
      [expect.any(String), expect.objectContaining({ filename })],
      [expect.any(String), expect.objectContaining({ filename })]
    ]);
  });

  it('can test that code.js babel output is unchanged', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('unchanged')
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        plugin: identifierReversePlugin,
        fixtures: getFixturePath('unchanged')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('unchanged')
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        plugin: identifierReversePlugin,
        fixtures: getFixturePath('unchanged')
      })
    );
  });

  it('can test that code.js babel output matches output.js', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('simple')
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        plugin: identifierReversePlugin,
        fixtures: getFixturePath('simple')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('simple')
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        plugin: identifierReversePlugin,
        fixtures: getFixturePath('simple')
      })
    );
  });

  it('formats, trims, and fixes line endings of code.js babel output; trims and fixes line endings of output.js contents', async () => {
    expect.hasAssertions();

    // ? These tests ensure that nobody's IDE messed with our fixture files by
    // ? adding newlines, which would normally be the right thing to do. If any
    // ? of these fail, ensure the failing file has no extraneous characters.
    // ***
    expect(
      getFixtureContents('simple-multiline/fixture/output.js', { trim: false })
    ).toMatch(/(\r\n){2}$/);
    // ***

    const formatResult = jest.fn(
      () =>
        `\r\n${getFixtureContents('simple-multiline/fixture/code.js').replaceAll(
          '\n',
          '\r\n'
        )}\r\n`
    );

    await runPluginTester(
      getDummyPluginOptions({
        formatResult,
        endOfLine: 'lf',
        fixtures: getFixturePath('simple-multiline')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        formatResult,
        endOfLine: 'lf',
        fixtures: getFixturePath('simple-multiline')
      })
    );

    expect(formatResult).toBeCalledTimes(2);
  });

  it('runs mixed-extension tests with code.js and some with output.js', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('multiple')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('multiple')
      })
    );

    expect(itSpy).toBeCalledTimes(10);
  });

  it('handles multiple code.js files in the same directory', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('code-files-multiple')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('code-files-multiple')
      })
    );

    expect(itSpy).toBeCalledTimes(2);
  });

  it('handles incorrectly-structured fixtures directory', async () => {
    expect.hasAssertions();

    const formatResultSpy = jest.fn((r) => r);

    await runPluginTester(
      getDummyPluginOptions({
        formatResult: formatResultSpy,
        fixtures: getFixturePath('nested-incorrectly')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        formatResult: formatResultSpy,
        fixtures: getFixturePath('nested-incorrectly')
      })
    );

    expect(formatResultSpy.mock.calls).toMatchObject([
      [
        getFixtureContents('nested-incorrectly/correct-within-incorrect/code.js'),
        expect.any(Object)
      ],
      [
        getFixtureContents('nested-incorrectly/correct-within-incorrect/code.js'),
        expect.any(Object)
      ]
    ]);
  });

  it('handles empty code.js and output.js files', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('code-output-files-empty')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('code-output-files-empty')
      })
    );

    expect(itSpy).toBeCalledTimes(6);
  });

  it('handles code.js and output.js files with strange extensions', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('custom-extension')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('custom-extension')
      })
    );

    expect(itSpy).toBeCalledTimes(2);
  });

  it('throws with helpful message if there is a problem parsing code.js', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        fixtures: getFixturePath('code-file-bad')
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        fixtures: getFixturePath('code-file-bad')
      })
    );
  });

  it('formats, trims, and fixes line endings of exec.js babel output', async () => {
    expect.hasAssertions();

    const formatResult = jest.fn(
      () => `if('\r\n'.length == 2) { throw new Error('crlf not replaced with lf'); }`
    );

    await runPluginTester(
      getDummyPluginOptions({
        formatResult,
        endOfLine: 'lf',
        fixtures: getFixturePath('exec-file-failing')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        formatResult,
        endOfLine: 'lf',
        fixtures: getFixturePath('exec-file-failing')
      })
    );

    expect(formatResult).toBeCalledTimes(2);
  });

  it('runs exec.js files with various extensions', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('exec-file-passing')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('exec-file-passing')
      })
    );

    expect(itSpy).toBeCalledTimes(2);
  });

  it('does not generate output file when using exec.js', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('exec-file-passing')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('exec-file-passing')
      })
    );

    expect(itSpy).toBeCalledTimes(10);
  });

  it('throws if exec.js file is empty', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('exec-file-empty')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('exec-file-empty')
      })
    );

    expect(itSpy).toBeCalledTimes(2);
  });

  it('throws with helpful message if there is a problem parsing exec.js', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        fixtures: getFixturePath('exec-file-bad')
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        fixtures: getFixturePath('exec-file-bad')
      })
    );
  });

  it('handles failing exec.js file', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        fixtures: getFixturePath('exec-file-failing')
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        fixtures: getFixturePath('exec-file-failing')
      })
    );
  });

  it('throws if exec.js and code.js file in same directory', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        fixtures: getFixturePath('exec-and-code-files')
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        fixtures: getFixturePath('exec-and-code-files')
      })
    );
  });

  it('throws if exec.js and output.js file in same directory', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        fixtures: getFixturePath('exec-and-output-files')
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        fixtures: getFixturePath('exec-and-output-files')
      })
    );
  });

  it('merges global options with those present in options.json', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('nested-options-json')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('nested-options-json')
      })
    );

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                foo: 'bar',
                bar: 'baz',
                rootFoo: 'rootBar'
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                foo: null,
                rootFoo: null
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                foo: 'bar',
                rootFoo: 'rootBar'
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                rootFoo: 'rootBar'
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                foo: 'bar',
                bar: 'baz',
                rootFoo: 'rootBar'
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                foo: null,
                rootFoo: null
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                foo: 'bar',
                rootFoo: 'rootBar'
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                rootFoo: 'rootBar'
              }
            ]
          ])
        })
      ]
    ]);
  });

  it('merges global options with those returned by options.js', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('nested-options-js')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('nested-options-js')
      })
    );

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                foo: 'bar',
                bar: 'baz',
                rootFoo: 'rootBar'
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                foo: null,
                rootFoo: null
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                foo: 'bar',
                rootFoo: 'rootBar'
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                rootFoo: 'rootBar'
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                foo: 'bar',
                bar: 'baz',
                rootFoo: 'rootBar'
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                foo: null,
                rootFoo: null
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                foo: 'bar',
                rootFoo: 'rootBar'
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                rootFoo: 'rootBar'
              }
            ]
          ])
        })
      ]
    ]);
  });

  it('merges options from all options.json and options.js files in the fixture tree', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('nested-options-json-and-js')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('nested-options-json-and-js')
      })
    );

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                foo: 'bar',
                bar: 'baz',
                rootFoo: 'rootBar'
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                foo: null,
                rootFoo: null
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                foo: 'bar',
                rootFoo: 'rootBar'
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                rootFoo: 'rootBar'
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                foo: 'bar',
                bar: 'baz',
                rootFoo: 'rootBar'
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                foo: null,
                rootFoo: null
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                foo: 'bar',
                rootFoo: 'rootBar'
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                rootFoo: 'rootBar'
              }
            ]
          ])
        })
      ]
    ]);
  });

  it('prefers options.js files over options.json files if both are present in the same directory at the same level', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('options-json-and-js')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('options-json-and-js')
      })
    );

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                bar: 'from-js'
              }
            ]
          ])
        })
      ],
      [
        expect.any(String),
        expect.objectContaining({
          plugins: expect.arrayContaining([
            [
              expect.any(Function),
              {
                bar: 'from-js'
              }
            ]
          ])
        })
      ]
    ]);
  });

  it('throws with helpful message if there is a problem parsing options files', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        fixtures: getFixturePath('options-js-bad')
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        fixtures: getFixturePath('options-json-bad')
      })
    );
  });

  it('recognizes .babelrc files with various extensions', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('babelrc')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('babelrc')
      })
    );

    expect(itSpy).toBeCalledTimes(8);
  });

  it('coexists with .babelrc configurations', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('babelrc-inverted')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        babelOptions: { plugins: ['@babel/plugin-syntax-jsx'] },
        fixtures: getFixturePath('babelrc-missing')
      })
    );

    expect(itSpy).toBeCalledTimes(2);
  });

  it('respects nested .babelrc configurations that extend one-another', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('nested-babelrc')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('nested-babelrc')
      })
    );

    expect(itSpy).toBeCalledTimes(6);
  });

  it('runs global and test-level setup, teardown, and returned teardown functions/promises in the proper order', async () => {
    expect.hasAssertions();

    const globalTeardownSpy = async () =>
      fs.writeFileSync('/dne/teardown.js', 'fake teardown content c');

    const globalSetupReturnTeardownFnSpy = () => {
      fs.writeFileSync('/dne/setup.js', 'fake setup content a');
      return () => fs.writeFileSync('/dne/teardown.js', 'fake teardown content b');
    };

    const globalSetupReturnTeardownPromiseSpy = () => {
      fs.writeFileSync('/dne/setup.js', 'fake setup content a');
      return Promise.resolve(() =>
        fs.writeFileSync('/dne/teardown.js', 'fake teardown content b')
      );
    };

    await runPluginTester(
      getDummyPluginOptions({
        setup: globalSetupReturnTeardownFnSpy,
        teardown: globalTeardownSpy,
        fixtures: getFixturePath('option-setup-teardown')
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        setup: globalSetupReturnTeardownPromiseSpy,
        teardown: globalTeardownSpy,
        fixtures: getFixturePath('option-setup-teardown')
      })
    );

    const singleRunResults = [
      [expect.any(String), 'fake setup content a'],
      [expect.any(String), 'fake setup content 1'],
      [expect.any(String), 'fake teardown content 1'],
      [expect.any(String), 'fake teardown content b'],
      [expect.any(String), 'fake teardown content c'],

      [expect.any(String), 'fake setup content a'],
      [expect.any(String), 'fake setup content 2'],
      [expect.any(String), 'fake teardown content 2'],
      [expect.any(String), 'fake teardown content b'],
      [expect.any(String), 'fake teardown content c'],

      [expect.any(String), 'fake setup content a'],
      [expect.any(String), 'fake setup content 3'],
      [expect.any(String), 'fake teardown content 3'],
      [expect.any(String), 'fake teardown content 4'],
      [expect.any(String), 'fake teardown content b'],
      [expect.any(String), 'fake teardown content c']
    ];

    expect(writeFileSyncSpy.mock.calls).toMatchObject(
      singleRunResults.concat(singleRunResults)
    );
  });

  it('creates output files with respect to `fixtureOutputName` and `fixtureOutputExt` only if said files do not already exist', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('creates-output-file')
      })
    );

    expect(writeFileSyncSpy.mock.calls).toMatchObject([
      [
        getFixturePath('creates-output-file/fixture/output.js'),
        getFixtureContents('creates-output-file/fixture/code.js')
      ]
    ]);

    expect(equalSpy).toHaveBeenCalledTimes(0);

    jest.clearAllMocks();

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('option-fixtureOutputName')
      })
    );

    expect(writeFileSyncSpy).toHaveBeenCalledTimes(0);

    expect(equalSpy.mock.calls).toMatchObject([
      [
        getFixtureContents('option-fixtureOutputName/fixture/code.js'),
        getFixtureContents('option-fixtureOutputName/fixture/out.js'),
        expect.any(String)
      ]
    ]);

    jest.clearAllMocks();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('option-fixtureOutputExt')
      })
    );

    expect(writeFileSyncSpy).toHaveBeenCalledTimes(0);

    expect(equalSpy.mock.calls).toMatchObject([
      [
        getFixtureContents('option-fixtureOutputExt/fixture/code.ts'),
        getFixtureContents('option-fixtureOutputExt/fixture/output.js'),
        expect.any(String)
      ]
    ]);
  });

  it('accepts fixtureOutputExt with and without the prepended period', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        fixtures: getFixturePath('option-fixtureOutputExt')
      })
    );

    expect(writeFileSyncSpy).toHaveBeenCalledTimes(0);

    expect(equalSpy.mock.calls).toMatchObject([
      [
        getFixtureContents('option-fixtureOutputExt/fixture/code.ts'),
        getFixtureContents('option-fixtureOutputExt/fixture/output.js'),
        expect.any(String)
      ]
    ]);

    await runPluginTester(
      getDummyPresetOptions({
        fixtures: getFixturePath('option-fixtureOutputExt-no-dot')
      })
    );

    expect(writeFileSyncSpy).toHaveBeenCalledTimes(0);

    expect(equalSpy.mock.calls).toMatchObject([
      [
        getFixtureContents('option-fixtureOutputExt-no-dot/fixture/code.ts'),
        getFixtureContents('option-fixtureOutputExt-no-dot/fixture/output.js'),
        expect.any(String)
      ]
    ]);
  });
});

describe('tests targeting the TestObject interface', () => {
  it('accepts an array value for `tests`', async () => {
    expect.hasAssertions();

    await runPluginTester(getDummyPluginOptions({ tests: [simpleTest] }));
    await runPluginTester(getDummyPresetOptions({ tests: [simpleTest] }));

    expect(itSpy).toHaveBeenCalledTimes(2);

    expect(equalSpy.mock.calls).toMatchObject([
      [simpleTest, simpleTest, expect.any(String)],
      [simpleTest, simpleTest, expect.any(String)]
    ]);
  });

  it('skips nullish `tests` array items except empty string', async () => {
    expect.hasAssertions();

    await runPluginTester(
      // @ts-expect-error: bad tests
      getDummyPluginOptions({ tests: [simpleTest, undefined, null, simpleTest, ''] })
    );

    await runPluginTester(
      // @ts-expect-error: bad tests
      getDummyPresetOptions({ tests: [simpleTest, undefined, null, simpleTest, ''] })
    );

    expect(itSpy).toHaveBeenCalledTimes(6);

    expect(equalSpy.mock.calls).toMatchObject([
      [simpleTest, simpleTest, expect.any(String)],
      [simpleTest, simpleTest, expect.any(String)],
      ['', '', expect.any(String)],
      [simpleTest, simpleTest, expect.any(String)],
      [simpleTest, simpleTest, expect.any(String)],
      ['', '', expect.any(String)]
    ]);
  });

  it('accepts an object value for `tests`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        tests: {
          'first title': simpleTest,
          'second title': {
            code: simpleTest
          }
        }
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        tests: {
          'first title': simpleTest,
          'second title': {
            code: simpleTest
          }
        }
      })
    );

    expect(itSpy.mock.calls).toMatchObject([
      [`1. first title`, expect.any(Function)],
      [`2. second title`, expect.any(Function)],
      [`3. first title`, expect.any(Function)],
      [`4. second title`, expect.any(Function)]
    ]);

    expect(equalSpy.mock.calls).toMatchObject([
      [simpleTest, simpleTest, expect.any(String)],
      [simpleTest, simpleTest, expect.any(String)],
      [simpleTest, simpleTest, expect.any(String)],
      [simpleTest, simpleTest, expect.any(String)]
    ]);
  });

  it('skips nullish `tests` object values except empty string', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        // @ts-expect-error: bad tests
        tests: {
          'test-1': { code: simpleTest },
          'test-2': undefined,
          'test-3': null,
          'test-4': { code: simpleTest },
          'test-5': { code: '' }
        }
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        // @ts-expect-error: bad tests
        tests: {
          'test-1': { code: simpleTest },
          'test-2': undefined,
          'test-3': null,
          'test-4': { code: simpleTest },
          'test-5': { code: '' }
        }
      })
    );

    expect(itSpy).toHaveBeenCalledTimes(6);

    expect(equalSpy.mock.calls).toMatchObject([
      [simpleTest, simpleTest, expect.any(String)],
      [simpleTest, simpleTest, expect.any(String)],
      ['', '', expect.any(String)],
      [simpleTest, simpleTest, expect.any(String)],
      [simpleTest, simpleTest, expect.any(String)],
      ['', '', expect.any(String)]
    ]);
  });

  it('resolves relative `codeFixture`/`outputFixture`/`execFixture` path with respect to `filepath`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        plugin: identifierReversePlugin,
        filepath: dummyProjectRootFilepath,
        tests: [
          {
            codeFixture: 'test/fixtures/codeFixture.js',
            outputFixture: 'test/fixtures/outputFixture.js'
          }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        plugin: identifierReversePlugin,
        filepath: dummyProjectRootFilepath,
        tests: [{ execFixture: 'test/fixtures/execFixture.js' }]
      })
    );

    expect(itSpy).toBeCalledTimes(2);

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [getFixtureContents('codeFixture.js'), expect.any(Object)],
      [getFixtureContents('execFixture.js'), expect.any(Object)]
    ]);
  });

  it('resolves absolute `codeFixture`/`outputFixture`/`execFixture` path regardless of `filepath`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        plugin: identifierReversePlugin,
        filepath: '/does/not/exist/and/never/did.js',
        tests: [{ execFixture: getFixturePath('execFixture.js') }]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        plugin: identifierReversePlugin,
        filepath: '/does/not/exist/and/never/did.js',
        tests: [
          {
            codeFixture: getFixturePath('codeFixture.js'),
            outputFixture: getFixturePath('outputFixture.js')
          }
        ]
      })
    );

    expect(itSpy).toBeCalledTimes(2);

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [getFixtureContents('codeFixture.js'), expect.any(Object)],
      [getFixtureContents('execFixture.js'), expect.any(Object)]
    ]);
  });

  it('accepts a string literal `tests` array item asserting babel output is unchanged', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        tests: [simpleTest]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        plugin: identifierReversePlugin,
        tests: [simpleTest]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        tests: [simpleTest]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        preset: () => ({ plugins: [identifierReversePlugin] }),
        tests: [simpleTest]
      })
    );
  });

  it('can test that `code`/`codeFixture` babel output is unchanged', async () => {
    expect.hasAssertions();

    const codeFixturePath = getFixturePath('codeFixture.js');

    await runPluginTester(
      getDummyPluginOptions({
        tests: [
          {
            codeFixture: codeFixturePath,
            outputFixture: codeFixturePath
          }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        tests: [
          {
            codeFixture: codeFixturePath,
            outputFixture: codeFixturePath
          }
        ]
      })
    );

    expect(itSpy).toBeCalledTimes(2);
  });

  it('can test that `code`/`codeFixture` and `output`/`outputFixture` babel output matches', async () => {
    expect.hasAssertions();

    const codeFixturePath = getFixturePath('codeFixture.js');
    const outputFixturePath = getFixturePath('outputFixture.js');
    const codeFixtureContents = getFixtureContents('codeFixture.js');
    const outputFixtureContents = getFixtureContents('outputFixture.js');

    await runPluginTester(
      getDummyPluginOptions({
        plugin: identifierReversePlugin,
        tests: [
          { code: codeFixtureContents, output: outputFixtureContents },
          { code: codeFixtureContents, outputFixture: outputFixturePath },
          { codeFixture: codeFixturePath, output: outputFixtureContents },
          { codeFixture: codeFixturePath, outputFixture: outputFixturePath }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        preset: () => ({ plugins: [identifierReversePlugin] }),
        tests: [
          { code: codeFixtureContents, output: outputFixtureContents },
          { code: codeFixtureContents, outputFixture: outputFixturePath },
          { codeFixture: codeFixturePath, output: outputFixtureContents },
          { codeFixture: codeFixturePath, outputFixture: outputFixturePath }
        ]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        tests: [{ code: codeFixtureContents, outputFixture: outputFixturePath }]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        tests: [{ codeFixture: codeFixturePath, output: outputFixtureContents }]
      })
    );
  });

  it('handles empty `code`/`codeFixture`', async () => {
    expect.hasAssertions();

    const codeFixtureEmptyPath = getFixturePath('codeFixture-empty.js');

    await runPluginTester(
      getDummyPluginOptions({
        plugin: deleteVariablesPlugin,
        tests: [
          {
            code: '',
            output: ''
          },
          {
            codeFixture: codeFixtureEmptyPath,
            output: ''
          }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        preset: () => ({ plugins: [deleteVariablesPlugin] }),
        tests: [
          {
            code: '',
            output: ''
          },

          {
            codeFixture: codeFixtureEmptyPath,
            output: ''
          }
        ]
      })
    );

    expect(itSpy).toBeCalledTimes(4);
  });

  it('handles empty `output`/`outputFixture`', async () => {
    expect.hasAssertions();

    const codeFixturePath = getFixturePath('codeFixture.js');
    const outputFixtureEmptyPath = getFixturePath('outputFixture-empty.js');

    await runPluginTester(
      getDummyPluginOptions({
        plugin: deleteVariablesPlugin,
        tests: [
          {
            codeFixture: codeFixturePath,
            output: ''
          },
          {
            codeFixture: codeFixturePath,
            outputFixture: outputFixtureEmptyPath
          }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        preset: () => ({ plugins: [deleteVariablesPlugin] }),
        tests: [
          {
            codeFixture: codeFixturePath,
            output: ''
          },

          {
            codeFixture: codeFixturePath,
            outputFixture: outputFixtureEmptyPath
          }
        ]
      })
    );

    expect(itSpy).toBeCalledTimes(4);
  });

  it('throws if `exec`/`execFixture` is empty', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        tests: [{ exec: '' }]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        tests: [{ execFixture: getFixturePath('execFixture-empty.js') }]
      })
    );
  });

  it('throws if `exec`/`execFixture` is transformed into an empty string', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        plugin: deleteVariablesPlugin,
        tests: [{ execFixture: getFixturePath('codeFixture.js') }]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        preset: () => ({ plugins: [deleteVariablesPlugin] }),
        tests: [{ exec: getFixtureContents('codeFixture.js') }]
      })
    );
  });

  it('throws if test object is non-nullish and missing both `code` and `codeFixture`', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(getDummyPluginOptions({ tests: [{}] }));
    await runPluginTesterExpectThrownException(getDummyPresetOptions({ tests: [{}] }));

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({ tests: [{ pluginOptions: {} }] })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({ tests: [{ presetOptions: {} }] })
    );

    //@ts-expect-error: testing bad tests value
    await runPluginTesterExpectThrownException(getDummyPluginOptions({ tests: [false] }));
    //@ts-expect-error: testing bad tests value
    await runPluginTesterExpectThrownException(getDummyPresetOptions({ tests: [false] }));

    //@ts-expect-error: testing bad tests value
    await runPluginTesterExpectThrownException(getDummyPluginOptions({ tests: [[]] }));
    //@ts-expect-error: testing bad tests value
    await runPluginTesterExpectThrownException(getDummyPresetOptions({ tests: [[]] }));
  });

  it('strips `code`, `output`, and `exec` of any indentation before transformation; trims and fixes their line endings afterwards, formatting `code` and `exec` as well', async () => {
    expect.hasAssertions();

    const code = `
      var someCode = 'cool';
      require('fs').writeFileSync('fake.js', someCode);
    `;

    const formatResult = jest.fn((r: string) => r);

    await runPluginTester(
      getDummyPluginOptions({
        formatResult,
        endOfLine: 'lf',
        tests: [
          {
            code,
            output:
              "var someCode = 'cool';\nrequire('fs').writeFileSync('fake.js', someCode);"
          },
          {
            code,
            output: `
              var someCode = 'cool';
                require('fs').writeFileSync('fake.js', someCode);
            `
          },
          { exec: code }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        formatResult,
        endOfLine: 'lf',
        tests: [
          {
            code,
            output:
              "\r\nvar someCode = 'cool';\r\nrequire('fs').writeFileSync('/dne/fake.js', someCode);\r\n"
          },
          {
            code,
            output: `
                var someCode = 'cool';
              require('fs').writeFileSync('/dne/fake.js', someCode);
            `
          },
          { exec: code }
        ]
      })
    );

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [stripIndent(code), expect.any(Object)],
      [stripIndent(code), expect.any(Object)],
      [stripIndent(code), expect.any(Object)],
      [stripIndent(code), expect.any(Object)]
    ]);

    expect(writeFileSyncSpy.mock.calls).toMatchObject([
      [expect.any(Object), 'cool'],
      [expect.any(Object), 'cool']
    ]);

    expect(formatResult).toBeCalledTimes(4);
  });

  it('does not strip `codeFixture`/`outputFixture`/`execFixture` of any indentation before transformation', async () => {
    expect.hasAssertions();

    const codeFixture = getFixturePath('codeFixture-indented.js');
    const codeFixtureContents = getFixtureContents('codeFixture-indented.js');
    const outputFixture = getFixturePath('outputFixture-indented.js');

    await runPluginTester(
      getDummyPluginOptions({
        tests: [{ codeFixture, outputFixture }, { execFixture: codeFixture }]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        tests: [{ codeFixture, outputFixture }, { execFixture: codeFixture }]
      })
    );

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [codeFixtureContents, expect.any(Object)],
      [codeFixtureContents, expect.any(Object)],
      [codeFixtureContents, expect.any(Object)],
      [codeFixtureContents, expect.any(Object)]
    ]);
  });

  it('formats, trims, and fixes line endings of `codeFixture` and `execFixture` babel output; trims and fixes line endings of `outputFixture` contents', async () => {
    expect.hasAssertions();

    const codeFixtureCrlf = getFixturePath('option-endOfLine-preserve/crlf/code.js');
    const outputFixtureCrlf = getFixturePath('option-endOfLine-preserve/crlf/output.js');
    const codeFixtureLf = getFixturePath('option-endOfLine-preserve/lf/code.js');

    const formatResult = jest.fn((r: string) => r);

    await runPluginTester(
      getDummyPluginOptions({
        formatResult,
        endOfLine: 'lf',
        tests: [
          {
            codeFixture: codeFixtureCrlf,
            outputFixture: outputFixtureCrlf
          },
          { execFixture: codeFixtureCrlf }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        formatResult,
        endOfLine: 'lf',
        tests: [
          {
            codeFixture: codeFixtureLf,
            outputFixture: outputFixtureCrlf
          },
          { execFixture: codeFixtureCrlf }
        ]
      })
    );

    expect(formatResult).toBeCalledTimes(4);
  });

  it('throws if both `code`/`codeFixture` and `exec`/`execFixture` are provided', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({ tests: [{ code: simpleTest, exec: simpleTest }] })
    );

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({ tests: [{ code: simpleTest, execFixture: simpleFixture }] })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({ tests: [{ codeFixture: simpleFixture, exec: simpleTest }] })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        tests: [{ codeFixture: simpleFixture, execFixture: simpleFixture }]
      })
    );
  });

  it('throws if both `output`/`outputFixture` and `exec`/`execFixture` are provided', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        tests: [{ code: simpleTest, exec: simpleTest, output: simpleTest }]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        tests: [{ code: simpleTest, execFixture: simpleFixture, output: simpleTest }]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        tests: [{ code: simpleTest, exec: simpleTest, outputFixture: simpleFixture }]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        tests: [
          { code: simpleTest, execFixture: simpleFixture, outputFixture: simpleFixture }
        ]
      })
    );
  });

  it('throws if both `code` and `codeFixture` are provided', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({ tests: [{ code: simpleTest, codeFixture: simpleFixture }] })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({ tests: [{ code: simpleTest, codeFixture: simpleFixture }] })
    );
  });

  it('throws if both `output` and `outputFixture` are provided', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        tests: [{ output: simpleTest, outputFixture: simpleFixture }]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        tests: [{ output: simpleTest, outputFixture: simpleFixture }]
      })
    );
  });

  it('throws if both `exec` and `execFixture` are provided', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({ tests: [{ exec: simpleTest, execFixture: simpleFixture }] })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({ tests: [{ exec: simpleTest, execFixture: simpleFixture }] })
    );
  });

  it('throws with helpful message if there is a problem parsing `code`/`codeFixture`', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        tests: [getFixtureContents('code-file-bad/fixture/code.js')]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        tests: [{ code: getFixtureContents('code-file-bad/fixture/code.js') }]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        tests: { bad: { codeFixture: getFixturePath('code-file-bad') } }
      })
    );
  });

  it('throws with helpful message if there is a problem parsing `exec`/`execFixture`', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        tests: [{ exec: getFixtureContents('code-file-bad/fixture/code.js') }]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        tests: [{ execFixture: getFixturePath('code-file-bad') }]
      })
    );
  });

  it('throws with helpful message if `codeFixture`/`outputFixture`/`execFixture` cannot be read', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        tests: [{ codeFixture: dummyProjectRootFilepath }]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        tests: [
          {
            code: `var eraseMe = 'junk'`,
            outputFixture: dummyProjectRootFilepath
          }
        ]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        tests: [{ execFixture: dummyProjectRootFilepath }]
      })
    );
  });

  it('can test that `exec`/`execFixture` babel output executes without errors', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        plugin: identifierReversePlugin,
        tests: [{ exec: getFixtureContents('execFixture.js') }]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        plugin: identifierReversePlugin,
        tests: [{ execFixture: getFixturePath('execFixture.js') }]
      })
    );

    // ? expect() call is in the execFixture.js script
  });

  it('considers deprecated `fixture` as synonymous with `codeFixture`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        plugin: identifierReversePlugin,
        tests: [
          {
            fixture: getFixturePath('codeFixture.js'),
            outputFixture: getFixturePath('outputFixture.js')
          }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        tests: [{ fixture: getFixturePath('codeFixture.js') }]
      })
    );

    expect(itSpy).toBeCalledTimes(2);

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [getFixtureContents('codeFixture.js'), expect.any(Object)],
      [getFixtureContents('codeFixture.js'), expect.any(Object)]
    ]);
  });

  it('uses `codeFixture`/`execFixture`, if defined, as the default `babelOptions.filename`, overriding any globals', async () => {
    expect.hasAssertions();

    const codeFixture = getFixturePath('codeFixture.js');

    await runPluginTester(
      getDummyPluginOptions({
        plugin: identifierReversePlugin,
        filepath: '/bad/bad/not/good.js',
        babelOptions: {
          filename: '/does/not/exist/and/never/did.js'
        },
        tests: [
          {
            codeFixture,
            outputFixture: getFixturePath('outputFixture.js')
          }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        filepath: '/bad/bad/not/good.js',
        babelOptions: {
          filename: '/does/not/exist/and/never/did.js'
        },
        tests: [{ execFixture: codeFixture }]
      })
    );

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [expect.any(String), expect.objectContaining({ filename: codeFixture })],
      [expect.any(String), expect.objectContaining({ filename: codeFixture })]
    ]);
  });

  it('uses the test-level `babelOptions.filename` over the default and any globals', async () => {
    expect.hasAssertions();

    const filename = getFixturePath('does-not-exist.js');

    await runPluginTester(
      getDummyPluginOptions({
        plugin: identifierReversePlugin,
        filename: '/bad/bad/not/good.js',
        babelOptions: {
          filename: '/does/not/exist/and/never/did.js'
        },
        tests: [
          {
            babelOptions: { filename },
            codeFixture: getFixturePath('codeFixture.js'),
            outputFixture: getFixturePath('outputFixture.js')
          }
        ]
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        plugin: identifierReversePlugin,
        filename: '/bad/bad/not/good.js',
        babelOptions: {
          filename: '/does/not/exist/and/never/did.js'
        },
        tests: [
          {
            babelOptions: { filename },
            execFixture: getFixturePath('codeFixture.js')
          }
        ]
      })
    );

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [expect.any(String), expect.objectContaining({ filename })],
      [expect.any(String), expect.objectContaining({ filename })]
    ]);
  });

  it('can provide a test-level `babelOptions.filename` for code strings', async () => {
    expect.hasAssertions();

    const filename = getFixturePath('outputFixture.js');

    await runPluginTester(
      getDummyPluginOptions({ tests: [{ babelOptions: { filename }, code: simpleTest }] })
    );

    await runPluginTester(
      getDummyPresetOptions({ tests: [{ babelOptions: { filename }, code: simpleTest }] })
    );

    expect(transformAsyncSpy.mock.calls).toMatchObject([
      [expect.any(String), expect.objectContaining({ filename })],
      [expect.any(String), expect.objectContaining({ filename })]
    ]);
  });

  it('runs global and test-level setup, teardown, and returned teardown functions/promises in the proper order', async () => {
    expect.hasAssertions();

    const globalTeardownSpy = async () =>
      fs.writeFileSync('/dne/teardown.js', 'fake teardown content c');

    const globalSetupReturnTeardownFnSpy = () => {
      fs.writeFileSync('/dne/setup.js', 'fake setup content a');
      return () => fs.writeFileSync('/dne/teardown.js', 'fake teardown content b');
    };

    const globalSetupReturnTeardownPromiseSpy = () => {
      fs.writeFileSync('/dne/setup.js', 'fake setup content a');
      return Promise.resolve(() =>
        fs.writeFileSync('/dne/teardown.js', 'fake teardown content b')
      );
    };

    const tests = [
      {
        ...requireFixtureOptions('option-setup-teardown/no-return'),
        code: simpleTest
      },
      {
        ...requireFixtureOptions('option-setup-teardown/return-fn'),
        code: simpleTest
      },
      {
        ...requireFixtureOptions('option-setup-teardown/return-promise'),
        code: simpleTest
      }
    ];

    const singleRunResults = [
      [expect.any(String), 'fake setup content a'],
      [expect.any(String), 'fake setup content 1'],
      [expect.any(String), 'fake teardown content 1'],
      [expect.any(String), 'fake teardown content b'],
      [expect.any(String), 'fake teardown content c'],

      [expect.any(String), 'fake setup content a'],
      [expect.any(String), 'fake setup content 2'],
      [expect.any(String), 'fake teardown content 2'],
      [expect.any(String), 'fake teardown content b'],
      [expect.any(String), 'fake teardown content c'],

      [expect.any(String), 'fake setup content a'],
      [expect.any(String), 'fake setup content 3'],
      [expect.any(String), 'fake teardown content 3'],
      [expect.any(String), 'fake teardown content 4'],
      [expect.any(String), 'fake teardown content b'],
      [expect.any(String), 'fake teardown content c']
    ];

    await runPluginTester(
      getDummyPluginOptions({
        setup: globalSetupReturnTeardownFnSpy,
        teardown: globalTeardownSpy,
        tests
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        setup: globalSetupReturnTeardownPromiseSpy,
        teardown: globalTeardownSpy,
        tests
      })
    );

    expect(writeFileSyncSpy.mock.calls).toMatchObject(
      singleRunResults.concat(singleRunResults)
    );
  });

  it('takes a snapshot if `snapshot` is enabled', async () => {
    expect.hasAssertions();

    // ? This one is kinda tricky... At first I thought I'd mock toMatchSnapshot
    // ? but then I realized that we can actually use it to our advantage in
    // ? this case. We actually _do_ take a snapshot and that makes our test
    // ? work pretty well soooooo... 😀
    await runPluginTester(
      getDummyPluginOptions({
        snapshot: true,
        tests: [simpleTest],
        plugin: identifierReversePlugin
      })
    );

    await runPluginTester(
      getDummyPresetOptions({
        snapshot: true,
        tests: [simpleTest],
        plugin: identifierReversePlugin
      })
    );
  });

  it('throws if `toMatchSnapshot` function is not available in the value returned by `expect()` when `snapshot` is enabled', async () => {
    expect.hasAssertions();

    // @ts-expect-error: It's probably there.
    const oldExpect = globalThis.expect;

    // @ts-expect-error: I'll put it back, I pwomise!
    delete globalThis.expect;

    try {
      await runPluginTesterExpectThrownException(
        getDummyPluginOptions({
          tests: [{ code: simpleTest, snapshot: true }]
        })
      );

      await runPluginTesterExpectThrownException(
        getDummyPresetOptions({
          tests: [{ code: simpleTest, snapshot: true }]
        })
      );
    } finally {
      // @ts-expect-error: It's probably there.
      globalThis.expect = oldExpect;
    }
  });

  it('overrides global `snapshot` with test-level `snapshot`', async () => {
    expect.hasAssertions();

    await runPluginTester(
      getDummyPluginOptions({
        snapshot: true,
        tests: [{ code: simpleTest, snapshot: false }]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        snapshot: false,
        tests: [{ code: simpleTest, output: shouldNotBeSeen, snapshot: true }]
      })
    );
  });

  it('throws if both `snapshot` and `output`/`outputFixture` are provided', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        tests: [{ code: simpleTest, output: shouldNotBeSeen, snapshot: true }]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        tests: [{ code: simpleTest, outputFixture: shouldNotBeSeen, snapshot: true }]
      })
    );
  });

  it('throws if both `snapshot` and `exec`/`execFixture` are provided', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        tests: [{ exec: shouldNotBeSeen, snapshot: true }]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        tests: [{ execFixture: shouldNotBeSeen, snapshot: true }]
      })
    );
  });

  it('throws if both `snapshot` and `throws` are provided', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({
        tests: [{ code: simpleTest, throws: true, snapshot: true }]
      })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({
        tests: [{ code: simpleTest, throws: true, snapshot: true }]
      })
    );
  });

  it('throws if babel output is unchanged and `snapshot` is enabled', async () => {
    expect.hasAssertions();

    await runPluginTesterExpectThrownException(
      getDummyPluginOptions({ snapshot: true, tests: [simpleTest] })
    );

    await runPluginTesterExpectThrownException(
      getDummyPresetOptions({ snapshot: true, tests: [simpleTest] })
    );
  });
});
