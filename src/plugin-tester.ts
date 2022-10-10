import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs';
import { EOL } from 'node:os';
import { isNativeError } from 'node:util/types';
import mergeWith from 'lodash.mergewith';
import stripIndent from 'strip-indent';

import {
  runPluginUnderTestHere,
  type ResultFormatter,
  type PluginTesterOptions,
  type TestObject,
  type FixtureOptions,
  type ErrorExpectation
} from '.';

import type { Class } from 'type-fest';

type PluginTesterOptionsWithBabel = Omit<PluginTesterOptions, 'babel'> & {
  babel: NonNullable<PluginTesterOptions['babel']>;
};

const fullDefaultConfig = {
  babelOptions: {
    parserOpts: {},
    generatorOpts: {},
    babelrc: false,
    configFile: false
  }
};

// ? Thanks to node throwing an error if you try to use instanceof with an arrow
// ? function we have to have this function. I guess it's spec... SMH...
// ? NOTE: I tried doing the "proper thing" using Symbol.hasInstance
// ? but no matter what that did, I couldn't make that work with a SyntaxError
// ? because SyntaxError[Symbol.hasInstance]() returns false. What. The. Heck!?
// ? So I'm doing this .prototype stuff :-/
// * See: https://github.com/nodejs/node/issues/12894#issuecomment-299888458
function hasPrototypeAndIsInstanceOf(
  inst: unknown,
  cls: Class<Error> | ((...args: unknown[]) => unknown)
): cls is Class<Error> {
  return cls.prototype !== undefined && inst instanceof cls;
}

function mergeCustomizer(objValue: unknown[], srcValue: unknown) {
  return Array.isArray(objValue) ? objValue.concat(srcValue) : undefined;
}

function fixLineEndings(
  line: string,
  endOfLine: PluginTesterOptions['endOfLine'],
  input = line
) {
  const getReplacement = () => {
    switch (endOfLine) {
      case 'lf': {
        return '\n';
      }
      case 'crlf': {
        return '\r\n';
      }
      case 'auto': {
        return EOL;
      }
      case 'preserve': {
        const match = input.match(/\r?\n/);
        if (match === null) {
          return EOL;
        }
        return match[0];
      }
      default: {
        throw new Error("invalid 'endOfLine' value");
      }
    }
  };

  return String(line).replace(/\r?\n/g, getReplacement()).trim();
}

function createFixtureTests(
  fixturesDir: string | undefined,
  options: PluginTesterOptionsWithBabel
) {
  if (!fixturesDir || !fs.statSync(fixturesDir).isDirectory()) return;

  const rootOptionsPath = path.join(fixturesDir, 'options.json');
  let rootFixtureOptions = {};

  if (fs.existsSync(rootOptionsPath)) {
    rootFixtureOptions = require(rootOptionsPath);
  }

  fs.readdirSync(fixturesDir).forEach((caseName) => {
    const fixtureDir = path.join(fixturesDir, caseName);
    const optionsPath = path.join(fixtureDir, 'options.json');
    const jsCodePath = path.join(fixtureDir, 'code.js');
    const tsCodePath = path.join(fixtureDir, 'code.ts');
    const jsxCodePath = path.join(fixtureDir, 'code.jsx');
    const tsxCodePath = path.join(fixtureDir, 'code.tsx');
    const blockTitle = caseName.split('-').join(' ');

    const codePath =
      (fs.existsSync(jsCodePath) && jsCodePath) ||
      (fs.existsSync(tsCodePath) && tsCodePath) ||
      (fs.existsSync(jsxCodePath) && jsxCodePath) ||
      (fs.existsSync(tsxCodePath) && tsxCodePath);

    const localFixtureOptions: FixtureOptions = fs.existsSync(optionsPath)
      ? require(optionsPath)
      : {};

    const mergedFixtureAndPluginOptions = {
      ...rootFixtureOptions,
      ...options.pluginOptions,
      ...localFixtureOptions
    };

    if (!codePath) {
      describe(blockTitle, () => {
        createFixtureTests(fixtureDir, {
          ...options,
          pluginOptions: mergedFixtureAndPluginOptions
        });
      });
      return;
    }

    const { only, skip, title } = localFixtureOptions;

    assert(
      (!skip && !only) || skip !== only,
      'cannot enable both skip and only on a test'
    );

    (only ? it.only : skip ? it.skip : it)(title || blockTitle, async () => {
      const {
        plugin,
        fixtureOutputName,
        babel,
        endOfLine,
        formatResult = (r) => r,
        ...rest
      } = options;

      const hasBabelrc = ['.babelrc', '.babelrc.js', '.babelrc.cjs'].some((babelrc) =>
        fs.existsSync(path.join(fixtureDir, babelrc))
      );

      const { babelOptions } = mergeWith(
        {},
        fullDefaultConfig,
        {
          babelOptions: {
            // ? If they have a babelrc, then we'll let them use that.
            // ? Otherwise, we'll just use our simple config
            babelrc: hasBabelrc
          }
        },
        rest,
        {
          babelOptions: {
            // ? Ensure `rest` comes before `babelOptions.plugins` to preserve
            // ? default plugin run order
            plugins: [[plugin, mergedFixtureAndPluginOptions]]
          }
        },
        mergeCustomizer
      );

      finalizePluginRunOrder(babelOptions);

      const input = fs.readFileSync(codePath).toString();
      const transformed = await (babel.transformAsync
        ? babel.transformAsync
        : babel.transform)(input, {
        ...babelOptions,
        filename: codePath
      });

      const { fixtureOutputExt } = mergedFixtureAndPluginOptions;
      const ext = fixtureOutputExt ? fixtureOutputExt : `.${codePath.split('.').pop()}`;

      const outputPath = path.join(fixtureDir, `${fixtureOutputName}${ext}`);

      const actual = formatResult(
        fixLineEndings(transformed?.code || '', endOfLine, input),
        { filepath: outputPath, filename: outputPath }
      );

      if (!fs.existsSync(outputPath)) {
        fs.writeFileSync(outputPath, actual);
        return;
      }

      const output = fs.readFileSync(outputPath, 'utf8');

      assert.equal(
        actual.trim(),
        fixLineEndings(output, endOfLine),
        `actual output does not match ${fixtureOutputName}${ext}`
      );
    });
  });
}

function runFixtureTests({
  title: describeBlockTitle,
  fixtures,
  filename,
  ...rest
}: PluginTesterOptionsWithBabel) {
  describe(`${describeBlockTitle} fixtures`, () => {
    const fixturesDir = getPath(filename, fixtures);
    createFixtureTests(fixturesDir, rest);
  });
}

function finalizePluginRunOrder(babelOptions: PluginTesterOptions['babelOptions']) {
  if (babelOptions?.plugins?.includes(runPluginUnderTestHere)) {
    babelOptions.plugins.splice(
      babelOptions.plugins.indexOf(runPluginUnderTestHere),
      1,
      babelOptions.plugins.pop()!
    );
  }
}

function toTestArray(tests: PluginTesterOptions['tests']) {
  // ? Null/0/false are ok, so no default param
  tests = tests || [];

  if (Array.isArray(tests)) {
    return tests;
  }

  return Object.keys(tests).reduce((testsArray, key) => {
    let value = (tests as Exclude<typeof tests, Array<unknown>>)?.[key];

    if (typeof value === 'string') {
      value = { code: value };
    }

    testsArray.push({
      title: key,
      ...value
    });

    return testsArray;
  }, [] as TestObject[]);
}

function getCode(filename?: string, fixture?: string) {
  const path = getPath(filename, fixture);

  if (!path) {
    return '';
  }

  return fs.readFileSync(path, 'utf8');
}

function getPath(filename?: string, basename?: string) {
  return !basename
    ? undefined
    : path.isAbsolute(basename)
    ? basename
    : filename
    ? path.join(path.dirname(filename), basename)
    : undefined;
}

function assertError(result: unknown, errorExpectation: ErrorExpectation) {
  if (typeof errorExpectation === 'function') {
    if (
      !(
        hasPrototypeAndIsInstanceOf(result, errorExpectation) ||
        errorExpectation(result) === true
      )
    ) {
      throw result;
    }
  } else {
    const resultString = isNativeError(result) ? result.message : String(result);

    if (typeof errorExpectation === 'string') {
      assert(
        resultString.includes(errorExpectation),
        `expected "${resultString}" to include "${errorExpectation}"`
      );
    } else if (errorExpectation instanceof RegExp) {
      assert(
        errorExpectation.test(resultString),
        `expected "${resultString}" to match ${errorExpectation}`
      );
    } else {
      assert(
        typeof errorExpectation === 'boolean',
        'the given `error` must be a function, string, boolean, or RegExp'
      );
    }
  }
}

export default pluginTester;
export function pluginTester({
  babel = require('@babel/core'),
  plugin,
  pluginName,
  title: describeBlockTitle,
  pluginOptions,
  tests,
  fixtures,
  fixtureOutputName = 'output',
  filename,
  endOfLine = 'lf',
  ...rest
}: PluginTesterOptions = {}) {
  if (!plugin) {
    throw new Error('plugin is a required parameter');
  }

  const tryInferPluginName = () => {
    try {
      // * https://xunn.at/babel-helper-plugin-utils-src
      return plugin(
        {
          assertVersion: () => undefined,
          targets: () => undefined,
          assumption: () => undefined
        },
        {},
        process.cwd()
      ).name;
    } catch {
      return undefined;
    }
  };

  pluginName = pluginName || tryInferPluginName() || 'unknown plugin';
  describeBlockTitle = describeBlockTitle || pluginName;

  if (fixtures) {
    runFixtureTests({
      plugin,
      pluginName,
      pluginOptions,
      title: describeBlockTitle,
      fixtures,
      fixtureOutputName,
      filename,
      babel,
      endOfLine,
      ...rest
    });
  }

  let currentTestNumber = 1;
  const testsArray = toTestArray(tests);

  if (!testsArray.length) {
    return;
  }

  const baseConfig = mergeWith({}, fullDefaultConfig, rest, mergeCustomizer);

  describe(describeBlockTitle, () => {
    testsArray.forEach((testConfig) => {
      if (!testConfig) {
        return;
      }

      const {
        skip,
        only,
        title,
        code,
        babelOptions,
        output,
        snapshot,
        error: expectedError,
        setup = () => undefined,
        teardown,
        formatResult = ((r) => r) as ResultFormatter,
        fixture
      } = mergeWith({}, baseConfig, toTestConfig(testConfig), mergeCustomizer);

      const testFilename = fixture || filename;

      assert(
        (!skip && !only) || skip !== only,
        'cannot enable both skip and only on a test'
      );

      finalizePluginRunOrder(babelOptions);

      if (skip) {
        // eslint-disable-next-line jest/no-disabled-tests
        it.skip(title, testerWrapper);
      } else if (only) {
        // eslint-disable-next-line jest/no-focused-tests
        it.only(title, testerWrapper);
      } else {
        it(title, testerWrapper);
      }

      async function testerWrapper() {
        const teardowns = teardown ? [teardown] : [];
        let returnedTeardown;
        try {
          returnedTeardown = await setup();
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('there was a problem during setup');
          throw e;
        }
        if (typeof returnedTeardown === 'function') {
          teardowns.push(returnedTeardown);
        }
        try {
          await tester();
        } finally {
          try {
            await Promise.all(teardowns.map((t) => t()));
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('there was a problem during teardown');
            // eslint-disable-next-line no-unsafe-finally
            throw e;
          }
        }
      }

      async function tester() {
        assert(
          code,
          'a string or object with a `code` or `fixture` property must be provided'
        );

        assert(
          !babelOptions.babelrc || babelOptions.filename,
          'babelrc set to true, but no filename specified in babelOptions'
        );

        assert(!snapshot || !output, '`output` cannot be provided with `snapshot: true`');

        let result: unknown;
        let errored = false;

        try {
          const transformed = await (babel.transformAsync
            ? babel.transformAsync
            : babel.transform)(code, babelOptions);

          result = formatResult(
            fixLineEndings(transformed?.code || '', endOfLine, code),
            {
              filepath: testFilename,
              filename: testFilename
            }
          );
        } catch (err) {
          if (expectedError) {
            errored = true;
            result = err;
          } else {
            throw err;
          }
        }

        assert(!expectedError || errored, 'expected to throw error, but it did not');

        if (snapshot) {
          assert(
            result !== code,
            'code was unmodified but attempted to take a snapshot. If the code should not be modified, set `snapshot: false`'
          );

          const separator = '\n\n      ↓ ↓ ↓ ↓ ↓ ↓\n\n';
          const formattedOutput = [code, separator, result].join('');

          expect(`\n${formattedOutput}\n`).toMatchSnapshot(title);
        } else if (expectedError) {
          assertError(result, expectedError);
        } else if (typeof result !== 'string') {
          throw new Error(`unexpected result type "${typeof result}" (excepted string)`);
        } else if (typeof output === 'string') {
          assert.equal(result.trim(), output.trim(), 'output is incorrect');
        } else {
          assert.equal(
            result.trim(),
            fixLineEndings(code, endOfLine),
            'expected output to not change, but it did'
          );
        }
      }
    });
  });

  function toTestConfig(testConfig: TestObject | string) {
    if (typeof testConfig === 'string') {
      testConfig = { code: testConfig };
    }

    const {
      title,
      fixture,
      code = getCode(filename, fixture),
      output = getCode(filename, testConfig.outputFixture) || undefined,
      pluginOptions: testOptions = pluginOptions
    } = testConfig;

    return mergeWith(
      {
        babelOptions: { filename: getPath(filename, fixture) }
      },
      testConfig,
      {
        babelOptions: { plugins: [[plugin, testOptions]] },
        title: title || `${currentTestNumber++}. ${pluginName}`,
        code: stripIndent(code).trim(),
        ...(output ? { output: stripIndent(output).trim() } : {})
      },
      mergeCustomizer
    );
  }
}
