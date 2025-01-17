import os from 'node:os';
import path from 'node:path';

import prettier from 'prettier';

import { prettierFormatter } from '../src/formatters/prettier';

import type { AnyFunction } from '@xunnamius/jest-types';

type SpiedFunction<T extends AnyFunction> = jest.SpyInstance<
  ReturnType<T>,
  Parameters<T>
>;

let prettierSpy: SpiedFunction<typeof prettier.format>;

beforeEach(() => {
  prettierSpy = jest.spyOn(prettier, 'format');
});

it('uses default prettier options when no user-supplied config is available', () => {
  expect.hasAssertions();

  const result = prettierFormatter(`  var a = 'hi'  `, { cwd: os.tmpdir() });
  expect(result).toBe('var a = "hi";\n');
});

it('uses user-supplied prettier config at project root if available (found starting at cwd)', () => {
  expect.hasAssertions();

  const result = prettierFormatter(`var a = "hi";`);
  expect(result).toBe(`var a = 'hi';\n`);
});

it('treats deprecated `filename` option as if it were `filepath`', () => {
  expect.hasAssertions();

  const expectedFilename = path.join(__dirname, 'fake.js');
  prettierFormatter(`  var a = 'hi'  `, { filename: expectedFilename });

  expect(prettierSpy.mock.calls).toMatchObject([
    [expect.any(String), expect.objectContaining({ filepath: expectedFilename })]
  ]);
});

it('treats deprecated `config` option as if it were `prettierOptions`', () => {
  expect.hasAssertions();

  const expectedConfig = { endOfLine: 'crlf' } as const;
  prettierFormatter(`  var a = 'hi'  `, { config: expectedConfig });

  expect(prettierSpy.mock.calls).toMatchObject([
    [expect.any(String), expect.objectContaining(expectedConfig)]
  ]);
});
