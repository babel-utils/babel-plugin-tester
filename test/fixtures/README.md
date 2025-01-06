# Dummy Fixtures

These are all dummy [fixtures](/README.md#fixtures) used in
babel-plugin-tester's unit tests. Each directory within `test/fixtures` is
considered a distinct fixture whose path should be passed as the value of the
[`fixtures`](/README.md#fixtures) option. Most of these fixtures have a
structure similar to the following:

```text
fixture-name-here
└── fixture (or some more specific sub-name)
    └── ... (one or more fixture-specific files like `code.js` or `options.js`)
```
