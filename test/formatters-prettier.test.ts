import os from 'node:os';
import { prettierFormatter } from '../src/formatters/prettier';

test('uses default format with no available config', () => {
  expect.hasAssertions();

  const result = prettierFormatter(`  var a = 'hi'  `, { cwd: os.tmpdir() });
  expect(result).toBe('var a = "hi";\n');
});

test('defaults all options', () => {
  expect.hasAssertions();

  const result = prettierFormatter(`var a = "hi";`);
  expect(result).toBe(`var a = 'hi';\n`);
});
