# Examples

Want to add an example? See `CONTRIBUTING.md`

## Working with other plugins

If your plugin requires some other plugins or presets to do its work, then you
can leverage the `babelrc` in `babelOptions`, but you must also specify a
`filename` if it's not a fixture. Here's how you'd do that:

```javascript
pluginTester({
  plugin,
  tests: [
    {
      code: '"blah"',
      babelOptions: {
        babelrc: true,
        filename: path.join(__dirname, 'some-file.js'),
      },
    },
    {
      code: '"hi"',
      babelOptions: {
        babelrc: true,
        filename: path.join(__dirname, 'some-other-file.js'),
      },
    },
    {
      fixture: path.join(__dirname, '__fixtures__/my-file.js'),
    },
  ],
})
```

This file doesn't actually have to exist either, so you can do whatever you like
for the actual filename as long as the `.babelrc` that is resolved to for that
file is the one you want. So you could simplify the example above as:

```javascript
pluginTester({
  plugin,
  babelOptions: {
    babelrc: true,
    filename: __filename,
  },
  tests: [
    '"blah"',
    '"hi"',
    {
      fixture: path.join(__dirname, '__fixtures__/my-file.js'),
    },
  ],
})
```
