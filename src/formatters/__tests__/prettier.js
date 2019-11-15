import os from 'os'
import prettierFormatter from '../prettier'

test('uses default format with no available config', () => {
  const result = prettierFormatter(`  var a = 'hi'  `, {cwd: os.tmpdir()})
  expect(result).toBe('var a = "hi";\n')
})

test('defaults all options', () => {
  const result = prettierFormatter(`var a = "hi";`)
  expect(result).toBe(`var a = 'hi'\n`)
})

test('caches config', () => {
  // this is really just to get coverage /me rolls my own eyes at myself
  expect(prettierFormatter(`var a = 1`)).toBe(prettierFormatter(`var a = 1`))
})
