import os from 'node:os';

import { toPath } from '@-xun/fs';
import prettier from 'prettier';

import { prettierFormatter } from 'universe:formatters/prettier.ts';

import type { AnyFunction } from '@-xun/types';

type SpiedFunction<T extends AnyFunction> = jest.SpyInstance<
  ReturnType<T>,
  Parameters<T>
>;

let prettierSpy: SpiedFunction<typeof prettier.format>;

beforeEach(() => {
  prettierSpy = jest.spyOn(prettier, 'format');
});

it('uses default prettier options when no user-supplied config is available', async () => {
  expect.hasAssertions();

  const result = await prettierFormatter(`  var a = 'hi'  `, { cwd: os.tmpdir() });
  expect(result).toBe('var a = "hi";\n');
});

it('uses user-supplied prettier config at project root if available (found starting at cwd)', async () => {
  expect.hasAssertions();

  const result = await prettierFormatter(`var a = "hi";`);
  expect(result).toBe(`var a = 'hi';\n`);
});

it('treats deprecated `filename` option as if it were `filepath`', async () => {
  expect.hasAssertions();

  const expectedFilename = toPath(__dirname, 'fake.js');
  await prettierFormatter(`  var a = 'hi'  `, { filename: expectedFilename });

  expect(prettierSpy.mock.calls).toMatchObject([
    [expect.any(String), expect.objectContaining({ filepath: expectedFilename })]
  ]);
});

it('treats deprecated `config` option as if it were `prettierOptions`', async () => {
  expect.hasAssertions();

  const expectedConfig = { endOfLine: 'crlf' } as const;
  await prettierFormatter(`  var a = 'hi'  `, { config: expectedConfig });

  expect(prettierSpy.mock.calls).toMatchObject([
    [expect.any(String), expect.objectContaining(expectedConfig)]
  ]);
});
