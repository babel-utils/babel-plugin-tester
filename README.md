# babel-plugin-tester

> **Note**\
> **This documentation is for an upcoming version of babel-plugin-tester.** See [here][1]
> for the current version's documentation.

Utilities for testing babel plugins and presets.

---

<!-- prettier-ignore-start -->

[![Build Status][build-badge]][build]
[![Code Coverage][coverage-badge]][coverage]
[![Version][version-badge]][package]
[![Downloads][downloads-badge]][npmtrends]
[![MIT License][license-badge]][license]

<!-- remark-ignore-start -->
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-19-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->
<!-- remark-ignore-end -->

[![PRs Welcome][prs-badge]][prs]
[![Code of Conduct][coc-badge]][coc]

<!-- prettier-ignore-end -->

## The Problem

You are writing a babel [plugin][2] or [preset][3] and want to write tests for
it too.

## This Solution

This is a fairly simple abstraction to help you write tests for your babel
plugin or preset. It was built to work with [Jest][4] (and by extension
[Vitest][5]), but most of the functionality should work with [Mocha][6],
[Jasmine][7], and any other framework that defines standard `describe` and `it`
globals with async support.

<!-- remark-ignore-start -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Installation](#installation)
- [Usage](#usage)
  - [Import](#import)
  - [Invoke](#invoke)
  - [Options](#options)
- [Examples](#examples)
  - [Simple Example](#simple-example)
  - [Full Example](#full-example)
- [Appendix](#appendix)
  - [Using Babel for Configuration Loading](#using-babel-for-configuration-loading)
  - [`pluginName` Inference Caveat](#pluginname-inference-caveat)
  - [Custom Snapshot Serialization](#custom-snapshot-serialization)
  - [Formatting Output with Prettier](#formatting-output-with-prettier)
  - [Built-In Debugging Support](#built-in-debugging-support)
  - [`TEST_ONLY` and `TEST_SKIP` Environment Variables](#test_only-and-test_skip-environment-variables)
  - [`setup` and `teardown` Run Order](#setup-and-teardown-run-order)
- [Inspiration](#inspiration)
- [Issues](#issues)
  - [🐛 Bugs](#-bugs)
  - [💡 Feature Requests](#-feature-requests)
- [Contributors ✨](#contributors-)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
<!-- remark-ignore-end -->

## Installation

This module is distributed via [npm][npm] which is bundled with [node][node] and
should be installed as one of your project's `devDependencies`:

```shell
npm install --save-dev babel-plugin-tester
```

## Usage

### Import

ESM:

```javascript
import { pluginTester } from 'babel-plugin-tester';
```

CJS:

```javascript
const { pluginTester } = require('babel-plugin-tester');
```

> For backwards compatibility reasons, a default export is also available but
> its use [should be avoided][8].

### Invoke

```javascript
/* file: test/unit.test.js */

import { pluginTester } from 'babel-plugin-tester';
import yourPlugin from '../src/your-plugin';

pluginTester({
  plugin: yourPlugin,
  tests: {
    /* Your test objects */
  }
});
```

> Note how `pluginTester` does not appear inside any `test`/`it` block nor
> within any [hook functions][9]. For advanced use cases, `pluginTester` may
> appear within one or more `describe` blocks, though this is discouraged.

### Options

This section lists the options you can pass to babel-plugin-tester. They are all
optional with respect to the following:

- When testing a preset, the [`preset`][10] option is required.
- When testing a plugin, the [`plugin`][11] option is required.
- You must test either a preset or a plugin.
- You cannot use preset-specific options ([`preset`][10], [`presetName`][12],
  [`presetOptions`][13]) and plugin-specific options ([`plugin`][11],
  [`pluginName`][14], [`pluginOptions`][15]) at the same time.

#### `plugin`

This is used to provide the babel plugin under test. For example:

```javascript
/* file: test/unit.test.js */

import { pluginTester } from 'babel-plugin-tester';
import identifierReversePlugin from '../src/identifier-reverse-plugin';

pluginTester({
  plugin: identifierReversePlugin,
  tests: {
    /* Your test objects */
  }
});

/* file: src/identifier-reverse-plugin.js */

// Normally you would import this from your plugin module
function identifierReversePlugin() {
  return {
    name: 'identifier reverse',
    visitor: {
      Identifier(idPath) {
        idPath.node.name = idPath.node.name.split('').reverse().join('');
      }
    }
  };
}
```

#### `pluginName`

This is used as the [describe block name][16] and in your [tests' names][17]. If
`pluginName` can be inferred from the [`plugin`][11]'s [name][18], then it will
be and you do not need to provide this option. If it cannot be inferred for
whatever reason, `pluginName` defaults to `"unknown plugin"`.

Note that there is a small [caveat][19] when relying on `pluginName` inference.

#### `pluginOptions`

This is used to pass options into your plugin at transform time. If provided,
the object will be [`lodash.mergeWith`][lodash.mergewith]'d with each [test
object's `pluginOptions`][20]/[fixture's `pluginOptions`][21], with the latter
taking precedence. Note that arrays will be concatenated during merging.

#### `preset`

This is used to provide the babel preset under test. For example:

```javascript
/* file: cool-new-babel-preset.test.js */

import { pluginTester } from 'babel-plugin-tester';
import coolNewBabelPreset from 'cool-new-babel-preset.js';

pluginTester({
  preset: coolNewBabelPreset,
  // A path to a directory containing your test fixtures
  fixtures: `${__dirname}/__fixtures__`
});

/* file: cool-new-babel-preset.js */

function identifierReversePlugin() {
  return {
    name: 'identifier reverse',
    visitor: {
      Identifier(idPath) {
        idPath.node.name = idPath.node.name.split('').reverse().join('');
      }
    }
  };
}

function identifierAppendPlugin() {
  return {
    name: 'identifier append',
    visitor: {
      Identifier(idPath) {
        idPath.node.name = `${idPath.node.name}_appended`;
      }
    }
  };
}

export function coolNewBabelPreset() {
  return { plugins: [identifierReversePlugin, identifierAppendPlugin] };
}
```

#### `presetName`

This is used as the [describe block name][16] and in your [tests' names][17].
Defaults to `"unknown preset"`.

#### `presetOptions`

This is used to pass options into your preset at transform time. If provided,
the object will be [`lodash.mergeWith`][lodash.mergewith]'d with each [test
object's `presetOptions`][22]/[fixture's `presetOptions`][23], with the latter
taking precedence. Note that arrays will be concatenated during merging.

#### `babel`

This is used to provide your own implementation of babel. This is particularly
useful if you want to use a different version of babel than what's required by
this package.

#### `babelOptions`

This is used to configure babel. If provided, the object will be
[`lodash.mergeWith`][lodash.mergewith]'d with the [defaults][24] and each [test
object's `babelOptions`][25]/[fixture's `babelOptions`][26], with the latter
taking precedence. Note that arrays will be concatenated during merging.

Also note that [`babelOptions.babelrc`][27] and [`babelOptions.configFile`][28]
are set to `false` by default, which disables automatic babel configuration
loading. [This can be re-enabled if desired][29].

To simply reuse your project's [`babel.config.js`][30] or some other
configuration file, set `babelOptions` like so:

```javascript
import { pluginTester } from 'babel-plugin-tester';

pluginTester({
  plugin: yourPlugin,
  // ...
  babelOptions: require('../babel.config.js'),
  // ...
  tests: {
    /* Your test objects */
  }
});
```

##### Custom Plugin and Preset Run Order

By default, when you include a custom list of [plugins][31] or [presets][3] in
`babelOptions`, the plugin or preset under test will always be the final plugin
or preset to run.

For example, consider the `myPlugin` plugin:

```javascript
import { pluginTester } from 'babel-plugin-tester';

pluginTester({
  plugin: myPlugin,
  pluginName: 'my-plugin',
  babelOptions: {
    plugins: [
      ['@babel/plugin-syntax-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties', { loose: true }]
    ]
  }
});
```

By default, `myPlugin` will be invoked _after_ @babel/plugin-syntax-decorators
and @babel/plugin-proposal-class-properties (i.e. `myPlugin` is _appended_ by
default).

It is possible to specify a custom ordering using the exported
`runPluginUnderTestHere` symbol. For instance, to run `myPlugin` _after_
@babel/plugin-syntax-decorators but _before_
@babel/plugin-proposal-class-properties:

```javascript
import { pluginTester, runPluginUnderTestHere } from 'babel-plugin-tester';

pluginTester({
  plugin: myPlugin,
  pluginName: 'my-plugin',
  babelOptions: {
    plugins: [
      ['@babel/plugin-syntax-decorators', { legacy: true }],
      runPluginUnderTestHere,
      ['@babel/plugin-proposal-class-properties', { loose: true }]
    ]
  }
});
```

Or to run `myPlugin` _before_ both @babel/plugin-syntax-decorators and
@babel/plugin-proposal-class-properties:

```javascript
import { pluginTester, runPluginUnderTestHere } from 'babel-plugin-tester';

pluginTester({
  plugin: myPlugin,
  pluginName: 'my-plugin',
  babelOptions: {
    plugins: [
      runPluginUnderTestHere,
      ['@babel/plugin-syntax-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties', { loose: true }]
    ]
  }
});
```

The same can be done when testing presets. Note that `myPreset` is normally
_prepended_ by default since, unlike plugins, [presets are run in reverse
order][32]:

```javascript
import { pluginTester, runPresetUnderTestHere } from 'babel-plugin-tester';

pluginTester({
  preset: myPreset,
  presetName: 'my-preset',
  babelOptions: {
    presets: [
      '@babel/preset-typescript',
      ['@babel/preset-react', { pragma: 'dom' }],
      runPresetUnderTestHere
    ]
  }
});
```

In this example, `myPreset` will run first instead of last.

#### `title`

This is used to specify a custom title for the two top-level [describe
blocks][16], the first enclosing all [tests][33] (i.e. `describe(title, ...)`)
and the second enclosing all [fixtures][34] (i.e.
`` describe(`${title} fixtures`, ...) ``).

Explicitly setting this option will override any defaults or inferred values.
Set to `false` to prevent the creation of these enclosing describe blocks.
Otherwise, the title defaults to using [`pluginName`][14]/[`presetName`][12].

#### `filepath`

This is used to resolve relative paths provided by the [`fixtures`][34] option;
the test object properties [`codeFixture`][35], [`outputFixture`][36], and
[`execFixture`][37]; and [during configuration resolution for prettier][38]. If
the aforesaid properties are not absolute paths, they will be
[`path.join`][39]'d with the [directory name][40] of `filepath`.

`filepath` is also passed to `formatResult`.

This option defaults to the absolute path of the file that [invoked the
`pluginTester` function][41].

> For backwards compatibility reasons, `filepath` is synonymous with `filename`.
> They can be used interchangeably, though care must be taken not to confuse the
> babel-plugin-tester option `filename` with `babelOptions.filename`. They are
> NOT the same!

#### `endOfLine`

This is used to control which line endings both the actual output from babel and
the expected output will be converted to. Defaults to `"lf"`.

| Options      | Description                             |
| ------------ | --------------------------------------- |
| `"lf"`       | Use Unix-style line endings             |
| `"crlf"`     | Use Windows-style line endings          |
| `"auto"`     | Use the system default line endings     |
| `"preserve"` | Use the line endings from the input     |
| `false`      | Disable line ending conversion entirely |

#### `setup`

This function will be run before every test runs, including fixtures. It can
return a function which will be treated as a [`teardown`][42] function. It can
also return a promise. If that promise resolves to a function, that will be
treated as a [`teardown`][42] function.

See [here][43] for the complete run order.

#### `teardown`

This function will be run after every test runs, including fixtures. You can
define this via `teardown` or you can return it from the [`setup`][44] function.
This can likewise return a promise if it is asynchronous.

This function, if provided, will be run _after_ any teardown function returned
by [`setup`][44]. See [here][43] for the complete run order.

#### `formatResult`

This function is used to format all babel outputs, and defaults to a function
that invokes [prettier][45]. If a prettier configuration file is [found][46],
then that will be used. Otherwise, prettier will use its own default
configuration.

You can also [override or entirely disable formatting][38].

#### `snapshot`

Equivalent to [`snapshot`][47] but applied globally across all [test
objects][48].

#### `fixtureOutputName`

Equivalent to [`fixtureOutputName`][49] but applied globally across all
[fixtures][34].

#### `fixtureOutputExt`

Equivalent to [`fixtureOutputExt`][50] but applied globally across all
[fixtures][34].

#### `titleNumbering`

Determines which test titles are prefixed with a number when registering [test
blocks][17] (e.g. `` `1. ${title}` ``, `` `2. ${title}` ``, etc). Defaults to
`"all"`.

| Options           | Description                                         |
| ----------------- | --------------------------------------------------- |
| `"all"`           | All test object and fixtures tests will be numbered |
| `"tests-only"`    | Only test object tests will be numbered             |
| `"fixtures-only"` | Only fixtures tests will be numbered                |
| `false`           | Disable automatic numbering in titles entirely      |

#### `restartTitleNumbering`

Normally, multiple [invocations][41] of babel-plugin-tester in the same test
file will share the same [test title numbering][51]. For example:

```javascript
/* file: test/unit.test.js */

import { pluginTester } from 'babel-plugin-tester';
import yourPlugin from '../src/your-plugin';

pluginTester({
  plugin: yourPlugin,
  tests: { 'test one': testOne, 'test two': testTwo }
});

pluginTester({
  plugin: yourPlugin,
  tests: { 'test one': testOne, 'test x': testTwo }
});

pluginTester({
  plugin: yourPlugin,
  tests: { 'test five': testOne }
});
```

Will result in [test blocks][17] with names like:

```text
1. Test one
2. Test two
3. Test one
4. Test x
5. Test five
```

However, setting this option to `true` will restart the numbering:

```javascript
/* file: test/unit.test.js */

import { pluginTester } from 'babel-plugin-tester';
import yourPlugin from '../src/your-plugin';

pluginTester({
  plugin: yourPlugin,
  tests: { 'test one': testOne, 'test two': testTwo }
});

pluginTester({
  plugin: yourPlugin,
  restartTitleNumbering: true,
  tests: { 'test one': testOne, 'test x': testTwo }
});

pluginTester({
  plugin: yourPlugin,
  tests: { 'test five': testOne }
});
```

Which will result in [test blocks][17] with names like:

```text
1. Test one
2. Test two
1. Test one
2. Test x
3. Test five
```

This option is `false` by default.

#### `fixtures`

There are two ways to create tests: using the [`tests`][33] option to provide
one or more [test objects][48] or using the `fixtures` option described here.
Both can be used simultaneously.

The `fixtures` option must be a path to a directory with a structure similar to
the following:

```text
__fixtures__
├── first-test         # test title will be: "1. first test"
│   ├── code.js        # required
│   └── output.js      # required (unless using the `throws` option)
├── second-test        # test title will be: "2. second test"
│   ├── .babelrc.js    # optional
│   ├── options.json   # optional
│   ├── code.ts        # required (other file extensions are allowed too)
│   └── output.js      # required (unless using the `throws` option)
└── nested
    ├── options.json   # optional
    ├── third-test     # test title will be: "3. nested > third test"
    │   ├── code.mjs   # required (other file extensions are allowed too)
    │   ├── output.js  # required (unless using the `throws` option)
    │   └── options.js # optional (overrides props in nested/options.json)
    └── x-fourth-test  # test title will be: "4. nested > x fourth test"
        └── exec.js    # required (alternative to code/output structure)
```

Assuming the `__fixtures__` directory is in the same directory as your test
file, you could use it with the following configuration:

```javascript
pluginTester({
  plugin,
  fixtures: path.join(__dirname, '__fixtures__')
});
```

> If `fixtures` is not an absolute path, it will be [`path.join`][39]'d with the
> [directory name][40] of [`filepath`][52].

> `.babelrc`, `.babelrc.json`, `.babelrc.js`, `.babelrc.cjs`, and `.babelrc.mjs`
> config files in fixture directories are technically supported out-of-the-box,
> though `.mjs` config files will cause a segfault until [this issue with
> V8/Chromium is resolved][53].

And it would run four tests, one for each directory in `__fixtures__` containing
a file starting with "code" or "exec".

##### `code.js`

This file's contents will be used as the source code input into babel at
transform time. Any file extension can be used, even a multi-part extension
(e.g. `.test.js` in `code.test.js`) as long as the file name starts with
`code.`; the [expected output file][54] will have the same file extension suffix
(i.e. `.js` in `code.test.js`) as this file unless changed with the
[`fixtureOutputExt`][50] option.

After being transformed by babel, the resulting output will have whitespace
trimmed, line endings [converted][55], and then get [formatted by prettier][38].

Note that this file cannot appear in the same directory as [`exec.js`][56]. If
more than one `code.*` file exists in a directory, the first one will be used
and the rest will be silently ignored.

##### `output.js`

This file, if provided, will have its contents compared with babel's output,
which is [`code.js`][57] transformed by babel and [formatted with prettier][38].
If this file is missing and neither [`throws`][58] nor [`exec.js`][56] are being
used, this file will be automatically generated from babel's output.
Additionally, the name and extension of this file can be changed with the
[`fixtureOutputName`][49] and [`fixtureOutputExt`][50] options.

Before being compared to babel's output, this file's contents will have
whitespace trimmed and line endings [converted][55].

Note that this file cannot appear in the same directory as [`exec.js`][56].

##### `exec.js`

This file's contents will be used as the input into babel at transform time just
like the [`code.js`][57] file, except the output will be _evaluated_ in the
[same _CJS_ context][59] as the the test runner itself, meaning it has access to
`expect` (if, for example, you are using Jest), `require`, and other globals
_but not `import` or top-level await_. Hence, while any file extension can be
used (e.g. `.ts`, `.vue`, `.jsx`), this file will always be evaluated as CJS.

The test will always pass unless an exception is thrown (e.g. when an `expect()`
fails).

Use this to make advanced assertions on the output. For example, to test that
[babel-plugin-proposal-throw-expressions][60] actually throws, your `exec.js`
file might contain:

```javascript
expect(() => throw new Error('throw expression')).toThrow('throw expression');
```

Before being evaluated, this file's contents will have whitespace trimmed, line
endings [converted][55], and then get [formatted by prettier][38].

Note that this file cannot appear in the same directory as [`code.js`][57] or
[`output.js`][54]. If more than one `exec.*` file exists in a directory, the
first one will be used and the rest will be silently ignored.

##### `options.json` (Or `options.js`)

For each fixture, the contents of the entirely optional `options.json` file are
[`lodash.mergeWith`][lodash.mergewith]'d with the options provided to
babel-plugin-tester, with the former taking precedence. Note that arrays will be
concatenated during merging.

For added flexibility, `options.json` can be specified as `options.js` instead
so long as a JSON object is exported via [`module.exports`][61]. If both files
exist in the same directory, `options.js` will take precedence and
`options.json` will be ignored entirely.

Fixtures support deeply nested directory structures as well as shared or "root"
`options.json` files. For example, placing an `options.json` file in the
`__fixtures__/nested` directory would make its contents the "global
configuration" for all fixtures under `__fixtures__/nested`. That is: each
fixture would [`lodash.mergeWith`][lodash.mergewith] the options provided to
babel-plugin-tester, `__fixtures__/nested/options.json`, and the contents of
their local `options.json` file (or exports from `options.js`) as described
above.

What follows are the properties you may use if you provide an options file, all
of which are optional:

###### `babelOptions`

This is used to configure babel. Properties specified here override
([`lodash.mergeWith`][lodash.mergewith]) those from the [`babelOptions`][62]
option provided to babel-plugin-tester. Note that arrays will be concatenated
during merging.

###### `pluginOptions`

This is used to pass options into your plugin at transform time. Properties
specified here override ([`lodash.mergeWith`][lodash.mergewith]) those from the
[`pluginOptions`][15] option provided to babel-plugin-tester. Note that arrays
will be concatenated during merging.

###### `presetOptions`

This is used to pass options into your preset at transform time. Properties
specified here override ([`lodash.mergeWith`][lodash.mergewith]) those from the
[`presetOptions`][13] option provided to babel-plugin-tester. Note that arrays
will be concatenated during merging.

###### `title`

If provided, this will be used as the title of the test. Otherwise, the
directory name will be used as the title by default (with spaces replacing
dashes).

###### `only`

Use this to run only the specified fixture. Useful while developing to help
focus on a small number of fixtures. Can be used in multiple `options.json`
files.

###### `skip`

Use this to skip running the specified fixture. Useful for when you are working
on a feature that is not yet supported. Can be used in multiple `options.json`
files.

###### `throws`

> When using certain values, this property must be used in `options.js` instead
> of `options.json`.

Use this to assert that a particular `code.js` file should cause babel to throw
an error during transformation. For example:

```javascript
{
  // ...
  throws: true,
  throws: 'should have this exact message',
  throws: /should pass this regex/,
  throws: SyntaxError, // Should be an instance of this class
  throws: err => {
    if (err instanceof SyntaxError && /message/.test(err.message)) {
      return true; // Test will fail if this function's return value !== true
    }
  },
}
```

> Be careful using `instanceof` [across realms][63] as it can lead to [strange
> behavior][64] with [frontend frames/windows][65] and with tools that rely on
> [Node's VM module][66] (like Jest). Prefer [name checks][67] and utilities
> like [`isNativeError`][68], [`Array.isArray`][69], and overriding
> [`Symbol.hasInstance`][70] instead.

If the value of `throws` is a class, that class must [be a subtype of
`Error`][71] or the behavior of babel-plugin-tester is undefined.

> For backwards compatibility reasons, `throws` is synonymous with `error`. They
> can be used interchangeably, with `throws` taking precedence.

Note that this property cannot be present when using an [`exec.js`][56] or
[`output.js`][54] file.

###### `setup`

> As it requires a function value, this property must be used in `options.js`
> instead of `options.json`.

This function will be run before a particular fixture's tests are run. It can
return a function which will be treated as a [`teardown`][72] function. It can
also return a promise. If that promise resolves to a function, that will be
treated as a [`teardown`][72] function.

This function, if provided, will run _after_ any [`setup`][44] function provided
as a babel-plugin-tester option. See [here][43] for the complete run order.

###### `teardown`

> As it requires a function value, this property must be used in `options.js`
> instead of `options.json`.

This function will be run after a fixture's tests finish running. You can define
this via `teardown` or you can return it from the [`setup`][73] function. This
can likewise return a promise if it is asynchronous.

This function, if provided, will be run _after_ any teardown function returned
by the [`setup`][73] property, both of which will run _before_ any
[`teardown`][42] function provided as a babel-plugin-tester option. See
[here][43] for the complete run order.

###### `formatResult`

> As it requires a function value, this property must be used in `options.js`
> instead of `options.json`.

This function is used to format all babel outputs, and defaults to a function
that invokes [prettier][45]. If a prettier configuration file is [found][46],
then that will be used. Otherwise, prettier will use its own default
configuration.

You can also [entirely disable formatting][38].

This will override the [`formatResult`][74] function provided to
babel-plugin-tester.

###### `fixtureOutputName`

Use this to provide your own fixture output file name. Defaults to `"output"`.

###### `fixtureOutputExt`

Use this to provide your own fixture output file extension. Including the
leading period is optional; that is: if you want `output.jsx`,
`fixtureOutputExt` can be set to either `"jsx"` or `".jsx"`. If omitted, the
[input fixture][57]'s file extension will be used instead.

This is particularly useful if you are testing TypeScript input.

#### `tests`

There are two ways to create tests: using the [`fixtures`][34] option that
leverages the filesystem or using the `tests` option described here. Both can be
used simultaneously.

Using the `tests` option, you can provide [test objects][48] describing your
expected transformations. You can provide `tests` as an object of test objects
or an array of test objects. If you provide an object, the object's keys will be
used as the default title of each test. If you provide an array, each test's
default title will be derived from its index and
[`pluginName`][14]/[`presetName`][12].

See [the example][75] for more details.

##### Test Objects

A minimal test object can be:

1. A `string` representing [code][76].
2. An `object` with a [`code`][76] property.

What follows are the properties you may use if you provide an object, most of
which are optional:

###### `babelOptions`

This is used to configure babel. Properties specified here override
([`lodash.mergeWith`][lodash.mergewith]) those from the [`babelOptions`][62]
option provided to babel-plugin-tester. Note that arrays will be concatenated
during merging.

###### `pluginOptions`

This is used to pass options into your plugin at transform time. Properties
specified here override ([`lodash.mergeWith`][lodash.mergewith]) those from the
[`pluginOptions`][15] option provided to babel-plugin-tester. Note that arrays
will be concatenated during merging.

###### `presetOptions`

This is used to pass options into your preset at transform time. Properties
specified here override ([`lodash.mergeWith`][lodash.mergewith]) those from the
[`presetOptions`][13] option provided to babel-plugin-tester. Note that arrays
will be concatenated during merging.

###### `title`

If provided, this will be used as the title of the test. Otherwise, the title
will be determined from test object by default.

###### `only`

Use this to run only the specified test. Useful while developing to help focus
on a small number of tests. Can be used on multiple tests.

###### `skip`

Use this to skip running the specified test. Useful for when you are working on
a feature that is not yet supported. Can be used on multiple tests.

###### `throws`

Use this to assert that a particular test object should cause babel to throw an
error during transformation. For example:

```javascript
{
  // ...
  throws: true,
  throws: 'should have this exact message',
  throws: /should pass this regex/,
  throws: SyntaxError, // Should be an instance of this class
  throws: err => {
    if (err instanceof SyntaxError && /message/.test(err.message)) {
      return true; // Test will fail if this function's return value !== true
    }
  },
}
```

> Be careful using `instanceof` [across realms][63] as it can lead to [strange
> behavior][64] with [frontend frames/windows][65] and with tools that rely on
> [Node's VM module][66] (like Jest). Prefer [name checks][67] and utilities
> like [`isNativeError`][68], [`Array.isArray`][69], and overriding
> [`Symbol.hasInstance`][70] instead.

If the value of `throws` is a class, that class must [be a subtype of
`Error`][71] or the behavior of babel-plugin-tester is undefined.

> For backwards compatibility reasons, `throws` is synonymous with `error`. They
> can be used interchangeably, with `throws` taking precedence.

Note that this property cannot be present when using the [`output`][77],
[`outputFixture`][36], [`exec`][78], [`execFixture`][37], or [`snapshot`][47]
properties.

###### `setup`

This function will be run before a particular test is run. It can return a
function which will be treated as a [`teardown`][79] function. It can also
return a promise. If that promise resolves to a function, that will be treated
as a [`teardown`][79] function.

This function, if provided, will run _after_ any [`setup`][44] function provided
as a babel-plugin-tester option. See [here][43] for the complete run order.

###### `teardown`

This function will be run after a test finishes running. You can define this via
`teardown` or you can return it from the [`setup`][80] function. This can
likewise return a promise if it is asynchronous.

This function, if provided, will be run _after_ any teardown function returned
by the [`setup`][80] property, both of which will run _before_ any
[`teardown`][42] function provided as a babel-plugin-tester option. See
[here][43] for the complete run order.

###### `formatResult`

This function is used to format all babel outputs, and defaults to a function
that invokes [prettier][45]. If a prettier configuration file is [found][46],
then that will be used. Otherwise, prettier will use its own default
configuration.

You can also [entirely disable formatting][38].

This will override the [`formatResult`][74] function provided to
babel-plugin-tester.

###### `snapshot`

If you would prefer to take a snapshot of babel's output rather than compare it
to something you provide manually, specify `snapshot: true`. This will cause
babel-plugin-tester to generate a snapshot containing both the [source code][76]
and babel's output.

Defaults to `false`.

Note that this property cannot appear in the same test object as the
[`output`][77], [`outputFixture`][36], [`exec`][78], [`execFixture`][37], or
[`throws`][81] properties.

> Requires [Jest][82] or an [appropriate shim][83] to use.

###### `code`

The code that you want babel to transform using your plugin or preset. This must
be provided unless you are using the [`codeFixture`][35] or [`exec`][78]
properties instead. If you do not provide the [`output`][77] or
[`outputFixture`][36] properties and [`snapshot`][47] is not truthy, then the
assertion is that this code is unchanged by the transformation.

Before being transformed by babel, any indentation will be stripped as a
convenience for template literals. After being transformed, the resulting output
will have whitespace trimmed, line endings [converted][55], and then get
[formatted by prettier][38].

Note that this property cannot appear in the same test object as the
[`codeFixture`][35], [`exec`][78], or [`execFixture`][37] properties.

###### `output`

The value of this property will be compared with [babel's output][76].

Before being compared to babel's output, this value will have whitespace
trimmed, line endings [converted][55], and any indentation stripped as a
convenience for template literals.

Note that this property cannot appear in the same test object as the
[`outputFixture`][36], [`exec`][78], [`execFixture`][37], [`throws`][81], or
[`snapshot`][47] properties.

###### `exec`

The provided source will be transformed just like the [`code`][76] property,
except the output will be _evaluated_ in the [same _CJS_ context][59] as the the
test runner itself, meaning it has access to `expect` (if, for example, you are
using Jest), `require`, and other globals _but not `import` or top-level await_.

The test will always pass unless an exception is thrown (e.g. when an `expect()`
fails).

Use this to make advanced assertions on the output. For example, you can test
that [babel-plugin-proposal-throw-expressions][60] actually throws using the
following:

```javascript
{
  // ...
  exec: `
    expect(() => throw new Error('throw expression')).toThrow('throw expression');
  `;
}
```

After being transformed by babel but before being evaluated, the babel output
will have whitespace trimmed, line endings [converted][55], and then get
[formatted by prettier][38].

Note that this property cannot appear in the same test object as the
[`execFixture`][37], [`code`][76], [`codeFixture`][35], [`output`][77],
[`outputFixture`][36], [`throws`][81], or [`snapshot`][47] properties.

###### `codeFixture`

If you would rather put your [`code`][76] in a separate file, you can specify a
file path here instead. If it is an absolute path, then that's the file that
will be loaded. Otherwise, `codeFixture` will be [`path.join`][39]'d with the
[directory name][40] of [`filepath`][52].

After being transformed by babel, the resulting output will have whitespace
trimmed, line endings [converted][55], and then get [formatted by prettier][38].

Like [`code`][76], this property cannot appear in the same test object as the
[`exec`][78] or [`execFixture`][37] properties, nor the [`code`][76] property
(obviously).

> If you find you are using this property more than a couple of times, consider
> using [`fixtures`][34] instead.

> For backwards compatibility reasons, `codeFixture` is synonymous with
> `fixture`. They can be used interchangeably, though care must be taken not to
> confuse the test object property `fixture` with the babel-plugin-tester option
> [_`fixtures`_][34], the latter being plural.

###### `outputFixture`

If you would rather put your [`output`][77] in a separate file, you can specify
a file path here instead. If it is an absolute path, then that's the file that
will be loaded. Otherwise, `outputFixture` will be [`path.join`][39]'d with the
[directory name][40] of [`filepath`][52].

Before being compared to babel's output, this file's contents will have
whitespace trimmed and line endings [converted][55].

Like [`output`][77], this property cannot appear in the same test object as the
[`exec`][78], [`execFixture`][37], [`throws`][81], or [`snapshot`][47]
properties, nor the [`output`][77] property (obviously).

> If you find you are using this property more than a couple of times, consider
> using [`fixtures`][34] instead.

###### `execFixture`

If you would rather put your [`exec`][78] in a separate file, you can specify a
file path here instead. If it is an absolute path, then that's the file that
will be loaded. Otherwise, `execFixture` will be [`path.join`][39]'d with the
[directory name][40] of [`filepath`][52].

After being transformed by babel but before being evaluated, the babel output
will have whitespace trimmed, line endings [converted][55], and then get
[formatted by prettier][38].

Like [`exec`][78], this property cannot appear in the same test object as the
[`code`][76], [`codeFixture`][35], [`output`][77], [`outputFixture`][36],
[`throws`][81], or [`snapshot`][47] properties, nor the [`exec`][78] property
(obviously).

> If you find you are using this property more than a couple of times, consider
> using [`fixtures`][34] instead.

## Examples

What follows are several babel-plugin-tester [test object][48] examples. See
[`fixtures`][34] for an example fixtures directory layout.

### Simple Example

```javascript
import { pluginTester } from 'babel-plugin-tester';
import identifierReversePlugin from '../identifier-reverse-plugin';

// NOTE: you can use beforeAll, afterAll, beforeEach, and afterEach as usual,
// but initial configuration tasks, like loading content from fixture files,
// will complete *at the point the pluginTester function is called* which means
// BEFORE beforeAll and other Jest hooks are run.

pluginTester({
  plugin: identifierReversePlugin,
  snapshot: true,
  tests: [
    {
      code: '"hello";'
      // Snapshot should show that code has not changed.
    },
    {
      snapshot: false,
      code: 'var hello = "hi";',
      output: 'var olleh = "hi";'
    },
    `
      function sayHi(person) {
        return 'Hello ' + person + '!'
      }
      console.log(sayHi('Jenny'))
    `
  ]
});
```

### Full Example

```javascript
import { pluginTester } from 'babel-plugin-tester';
import identifierReversePlugin from '../identifier-reverse-plugin';

pluginTester({
  // One (and ONLY ONE) of the two following lines MUST be included.
  plugin: identifierReversePlugin,
  //preset: coolNewBabelPreset,

  // Usually unnecessary if it is returned by the plugin. This will default to
  // 'unknown plugin' if a name cannot otherwise be inferred.
  pluginName: 'identifier reverse',
  // Unlike with pluginName, there is no presetName inference. This will default
  // to 'unknown preset' if a name is not provided.
  //presetName: 'cool-new-babel-preset',

  // Used to test specific plugin options.
  pluginOptions: {
    optionA: true
  },
  //presetOptions: {
  //  optionB: false,
  //}

  // Defaults to the plugin name.
  title: 'describe block title',

  // Only useful if you are using fixtures, codeFixture, outputFixture, or
  // execFixture options. Defaults to the absolute path of the file the
  // pluginTester function was invoked from, which in this case  is equivalent
  // to the following line:
  filepath: __filename,

  // These are the defaults that will be lodash.mergeWith'd with the provided
  // babelOptions option.
  babelOptions: {
    parserOpts: {},
    generatorOpts: {},
    babelrc: false,
    configFile: false
  },

  // Do not use snapshots across all tests, which is the default anyway. Note
  // that snapshots are only guaranteed to work with Jest
  snapshot: false,

  // Defaults to a function that formats with prettier
  formatResult: customFormatFunction,

  // You can provide tests as an object
  tests: {
    // The key is the title. The value is the code that is unchanged (because
    // snapshot == false across all tests). Test title will be: "1. does not
    // change code with no identifiers"
    'does not change code with no identifiers': '"hello";',

    // Test title will be: "2. changes this code"
    'changes this code': {
      // Input to the plugin
      code: 'var hello = "hi";',
      // Expected output
      output: 'var olleh = "hi";'
    }
  },

  // Alternatively, you can provide tests as an array
  tests: [
    // Should be unchanged by the plugin (because snapshot == false across all
    // tests). Test title will be: "1. identifier reverse"
    '"hello";',
    {
      // Test title will be: "2. identifier reverse"
      code: 'var hello = "hi";',
      output: 'var olleh = "hi";'
    },
    {
      // Test title will be: "3. unchanged code"
      title: 'unchanged code',
      // Because this is an absolute path, the filepath option above will not
      // be used to resolve this path
      codeFixture: path.join(__dirname, 'some-path', 'unchanged.js')
      // No output, outputFixture, or snapshot, so the assertion will be that
      // the plugin does not change this code
    },
    {
      // Because these are not absolute paths, they will be joined with the
      // directory of the filepath option provided above
      codeFixture: '__fixtures__/changed.js',
      // Because outputFixture is provided, the assertion will be that the
      // plugin will change the contents of "changed.js" to the contents of
      // "changed-output.js"
      outputFixture: '__fixtures__/changed-output.js'
    },
    {
      // As a convenience, this will have the indentation striped and it will
      // be trimmed
      code: `
        function sayHi(person) {
          return 'Hello ' + person + '!';
        }
      `,
      // This will take a Jest snapshot, overwriting the default/global
      // settings (set above). The snapshot will contain both source code and
      // the transformed output, making the snapshot file easier to understand
      snapshot: true
    },
    {
      code: 'var hello = "hi";',
      output: 'var olleh = "hi";',
      // This can be used to overwrite pluginOptions (set above)
      pluginOptions: {
        optionA: false
      }
      // This can be used to overwrite presetOptions (set above)
      //presetOptions: {
      //  optionB: true
      //}
    },
    {
      title: 'unchanged code',
      code: "'no change';",
      setup() {
        // Runs before this test
        return function teardown() {
          // Runs after this tests
        };
        // Can also return a promise
      },
      teardown() {
        // Runs after this test
        // Can return a promise
      }
    },
    {
      // This source will be transformed just like the code property, except the
      // produced code will be evaluated in the same CJS context as the the test
      // runner. This lets us make more advanced assertions on the output.
      exec: `
        const hello = "hi";
        // The plugin will reverse ALL identifiers, even globals like "expect"!
        tcepxe(hello)['toBe']("hi");
      `
    }
  ]
});
```

## Appendix

### Using Babel for Configuration Loading

[`babelOptions.babelrc`][27] and [`babelOptions.configFile`][28] are set to
`false` by default. This way, you can [manually import (or provide an object
literal)][62] the exact configuration you want to apply rather than relying on
babel's [somewhat complex configuration loading rules][84]. However, if your
plugin, preset, or project relies on a complicated external setup to do its
work, and you do not mind the [default run order][85], you can leverage [babel's
automatic configuration loading][86] via the `babelOptions.babelrc` and/or
`babelOptions.configFile` options.

> Fixtures provided via the [`fixtures`][34] option **do not** need to provide a
> separate `babelOptions.filename` since it will be set automatically. This
> section only applies to [test objects][48].

When relying on `babelOptions.babelrc`, you must also provide a
[`babelOptions.filename`][87] for each test object that does not include a
[`codeFixture`][35] or [`execFixture`][37] property. For example:

```javascript
pluginTester({
  plugin,
  tests: [
    {
      code: '"blah"',
      // This configuration is set at the test level
      babelOptions: {
        babelrc: true,
        filename: path.join(__dirname, 'some-file.js')
      }
    },
    {
      code: '"hi"',
      // This configuration is set at the test level
      babelOptions: {
        babelrc: true,
        filename: path.join(__dirname, 'some-other-file.js')
      }
    },
    {
      // babelOptions.filename will be set to the value of codeFixture for you
      // unless you set it manually here at the test level
      codeFixture: path.join(__dirname, '__fixtures__/my-file.js')
    },
    {
      // babelOptions.filename will be set to the value of execFixture for you
      // unless you set it manually here at the test level
      execFixture: path.join(__dirname, '__fixtures__/my-script.js')
    }
  ]
});
```

This file does not actually have to exist either, so you can use whatever value
you want for `filename` as long as the `.babelrc` file is [resolved][88]
properly. Hence, the above example could be simplified further:

```javascript
pluginTester({
  plugin,
  // This configuration is global: it applies to *all* tests by default!
  babelOptions: {
    babelrc: true,
    // The value of filename does not have to point to a file that exists
    filename: __filename
  },
  tests: [
    '"blah"',
    '"hi"',
    {
      // babelOptions.filename will be set to the value of codeFixture for you
      // unless you set it manually here at the test level
      codeFixture: path.join(__dirname, '__fixtures__/my-file.js')
    },
    {
      // babelOptions.filename will be set to the value of execFixture for you
      // unless you set it manually here at the test level
      execFixture: path.join(__dirname, '__fixtures__/my-script.js')
    }
  ]
});
```

### `pluginName` Inference Caveat

Inferring [`pluginName`][14] during testing requires invoking [the plugin][11]
_at least twice_: once outside of babel to check for the plugin's name and then
again when run by babel. This is irrelevant to babel-plugin-tester (even if your
plugin crashes when run outside of babel) and to the overwhelming majority of
babel plugins in existence. This only becomes a problem if your plugin is
_aggressively stateful_, which is against the [babel handbook on plugin
design][89].

For example, the following plugin which replaces an import specifier using a
regular expression will exhibit strange behavior due to being invoked twice:

```javascript
/*  -*-*-  BAD CODE DO NOT USE  -*-*-  */

let source;
// vvv When first invoked outside of babel, all passed arguments are mocks vvv
function badNotGoodPlugin({ assertVersion, types: t }) {
  // ^^^ Which means assertVersion is mocked and t is undefined ^^^
  assertVersion(7);

  // vvv So don't memoize `t` here (which among other things is poor design) vvv
  if (!source) {
    source = (value, original, replacement) => {
      return t.stringLiteral(value.replace(original, replacement));
    };
  }

  return {
    name: 'bad-bad-not-good',
    visitor: {
      ImportDeclaration(path, state) {
        path.node.source = source(
          path.node.source.value,
          state.opts.originalRegExp,
          state.opts.replacementString
        );
      }
    }
  };
}

pluginTester({
  plugin: badNotGoodPlugin,
  pluginOptions: { originalRegExp: /^y$/, replacementString: 'z' },
  tests: [{ code: 'import { x } from "y";', output: 'import { x } from "z";' }]
});

// Result: error!
// TypeError: Cannot read properties of undefined (reading 'stringLiteral')
```

If you still want to use global state despite the handbook's advice, either
initialize global state within your visitor:

```javascript
let source;
function okayPlugin({ assertVersion, types: t }) {
  assertVersion(7);

  return {
    name: 'okay',
    visitor: {
      Program: {
        enter() {
          // vvv Initialize global state in a safe place vvv
          if (!source) {
            source = (value, original, replacement) => {
              return t.stringLiteral(value.replace(original, replacement));
            };
          }
        }
      },
      ImportDeclaration(path, state) {
        path.node.source = source(
          path.node.source.value,
          state.opts.originalRegExp,
          state.opts.replacementString
        );
      }
    }
  };
}

pluginTester({
  plugin: okayPlugin,
  pluginOptions: { originalRegExp: /^y$/, replacementString: 'z' },
  tests: [{ code: 'import { x } from "y";', output: 'import { x } from "z";' }]
});

// Result: works!
```

Or do things the proper way and just use local state instead:

```javascript
function betterPlugin({ assertVersion, types: t }) {
  assertVersion(7);

  // vvv Use local state instead so t is memoized properly vvv
  const source = (value, original, replacement) => {
    return t.stringLiteral(value.replace(original, replacement));
  };

  return {
    name: 'better',
    visitor: {
      ImportDeclaration(path, state) {
        path.node.source = source(
          path.node.source.value,
          state.opts.originalRegExp,
          state.opts.replacementString
        );
      }
    }
  };
}

pluginTester({
  plugin: betterPlugin,
  pluginOptions: { originalRegExp: /^y$/, replacementString: 'z' },
  tests: [{ code: 'import { x } from "y";', output: 'import { x } from "z";' }]
});

// Result: works!
```

### Custom Snapshot Serialization

If you are using Jest and snapshots, then the snapshot output could have a bunch
of bothersome `\"` to escape quotes. This is because, when Jest serializes a
string, it will wrap everything in double quotes. This is not a huge deal, but
it makes the snapshots harder to read, so we automatically add a snapshot
serializer for you to remove those. Note that this serializer is added globally
and thus will affect _all_ snapshots taken in the test file, even those outside
of babel-plugin-tester.

If you would like to disable this feature, then use the "pure" import (also
disables formatting of babel output with prettier):

```diff
- import { pluginTester } from 'babel-plugin-tester'
+ import { pluginTester } from 'babel-plugin-tester/pure'
```

> It seems recent versions of Jest already ship with easier-to-read snapshots,
> making this serializer redundant. Therefore, the built-in custom serializer
> will likely be removed entirely in a future version of babel-plugin-tester.

### Formatting Output with Prettier

By default, a [formatter][74] is used which formats all babel output with
[prettier][45]. It will [look for][46] a prettier configuration file relative to
[the file that's being tested][52] or the [current working directory][90]. If it
cannot find one, then it uses the default configuration for prettier.

This makes your snapshots easier to read and your expectations easier to write,
but if you would like to disable this feature, you can either use the [`pure`
import][91] to disable automatic formatting (along with snapshot serialization)
or you can override the `formatResult` option manually like so:

```javascript
pluginTester({
  // ...
  formatResult: (r) => r
  // ...
});
```

### Built-In Debugging Support

This package uses [debug][92] under the hood; more verbose output, including the
results of all babel transformations, can be activated by passing the
`DEBUG='babel-plugin-tester,babel-plugin-tester:*'` [environment variable][93]
when running babel-plugin-tester.

#### Available Debug Namespaces

The following [debug namespaces][94] are available for activation:

<!-- lint disable list-item-style -->

- `babel-plugin-tester:index`
- `babel-plugin-tester:tester`
- `babel-plugin-tester:formatter`
- `babel-plugin-tester:serializer`

<!-- lint enable list-item-style -->

### `TEST_ONLY` and `TEST_SKIP` Environment Variables

The optional `TEST_ONLY` and `TEST_SKIP` environment variables are recognized by
babel-plugin-tester, allowing you to control which tests are run in an adhoc
fashion without having to modify your test configuration code.

The values of these variables will be transformed into regular expressions via
`RegExp(value, 'u')` and matched against each test/fixture title (sans
[automatic numbering][51]). Tests with titles that match `TEST_ONLY` will be run
while all others are skipped. On the other hand, tests with titles that match
`TEST_SKIP` will be skipped while others are run.

Given both `TEST_ONLY` and `TEST_SKIP`, tests matched by `TEST_SKIP` will
_always_ be skipped, even if they are also matched by `TEST_ONLY`.

### `setup` and `teardown` Run Order

For each test object and fixture test, setup and teardown functions are run in
the following order:

1. [Base `setup`][44].
2. [Test object `setup`][80] / [fixture `setup`][73].
3. _Test object / fixture test is run_.
4. Any function returned by test object `setup` / fixture `setup`.
5. [Test object `teardown`][79] / [fixture `teardown`][72].
6. Any function returned by base `setup`.
7. [Base `teardown`][42].

## Inspiration

The API was inspired by:

- ESLint's [RuleTester][ruletester].
- [@thejameskyle][95]'s [tweet][jamestweet].
- Babel's own
  [`@babel/helper-plugin-test-runner`][@babel/helper-plugin-test-runner].

## Issues

_Looking to contribute? Look for the [Good First Issue][good-first-issue]
label._

### 🐛 Bugs

Please file an issue for bugs, missing documentation, or unexpected behavior.

[**See Bugs**][bugs]

### 💡 Feature Requests

Please file an issue to suggest new features. Vote on feature requests by adding
a 👍. This helps maintainers prioritize what to work on.

[**See Feature Requests**][requests]

## Contributors ✨

Thanks goes to these people ([emoji key][emojis]):

<!-- remark-ignore-start -->
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<table>
  <tr>
    <td align="center"><a href="https://kentcdodds.com"><img src="https://avatars.githubusercontent.com/u/1500684?v=3?s=100" width="100px;" alt=""/><br /><sub><b>Kent C. Dodds</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kentcdodds" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kentcdodds" title="Documentation">📖</a> <a href="#infra-kentcdodds" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kentcdodds" title="Tests">⚠️</a></td>
    <td align="center"><a href="http://thejameskyle.com/"><img src="https://avatars3.githubusercontent.com/u/952783?v=3?s=100" width="100px;" alt=""/><br /><sub><b>james kyle</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=thejameskyle" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=thejameskyle" title="Documentation">📖</a> <a href="https://github.com/babel-utils/babel-plugin-tester/pulls?q=is%3Apr+reviewed-by%3Athejameskyle" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=thejameskyle" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/bbohen"><img src="https://avatars1.githubusercontent.com/u/1894628?v=3?s=100" width="100px;" alt=""/><br /><sub><b>Brad Bohen</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/issues?q=author%3Abbohen" title="Bug reports">🐛</a></td>
    <td align="center"><a href="http://www.krwelch.com"><img src="https://avatars0.githubusercontent.com/u/1295580?v=3?s=100" width="100px;" alt=""/><br /><sub><b>Kyle Welch</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kwelch" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kwelch" title="Documentation">📖</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kwelch" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/kontrollanten"><img src="https://avatars3.githubusercontent.com/u/6680299?v=4?s=100" width="100px;" alt=""/><br /><sub><b>kontrollanten</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kontrollanten" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/rubennorte"><img src="https://avatars3.githubusercontent.com/u/117921?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Rubén Norte</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=rubennorte" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=rubennorte" title="Tests">⚠️</a></td>
    <td align="center"><a href="http://andreneves.work"><img src="https://avatars2.githubusercontent.com/u/3869532?v=4?s=100" width="100px;" alt=""/><br /><sub><b>André Neves</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=andrefgneves" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=andrefgneves" title="Tests">⚠️</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/merceyz"><img src="https://avatars0.githubusercontent.com/u/3842800?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Kristoffer K.</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=merceyz" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=merceyz" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/lifeart"><img src="https://avatars2.githubusercontent.com/u/1360552?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Alex Kanunnikov</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=lifeart" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=lifeart" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://solverfox.dev"><img src="https://avatars3.githubusercontent.com/u/12292047?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sebastian Silbermann</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=eps1lon" title="Code">💻</a></td>
    <td align="center"><a href="http://ololos.space/"><img src="https://avatars1.githubusercontent.com/u/3940079?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Andrey Los</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/issues?q=author%3ARIP21" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/charlesbodman"><img src="https://avatars2.githubusercontent.com/u/231894?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Charles Bodman</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=charlesbodman" title="Documentation">📖</a></td>
    <td align="center"><a href="https://michaeldeboey.be"><img src="https://avatars3.githubusercontent.com/u/6643991?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Michaël De Boey</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=MichaelDeBoey" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/yuyaryshev"><img src="https://avatars0.githubusercontent.com/u/18558421?v=4?s=100" width="100px;" alt=""/><br /><sub><b>yuyaryshev</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=yuyaryshev" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/CzBuCHi"><img src="https://avatars0.githubusercontent.com/u/12444673?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Marek Buchar</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=CzBuCHi" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=CzBuCHi" title="Tests">⚠️</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=CzBuCHi" title="Documentation">📖</a></td>
    <td align="center"><a href="https://twitter.com/_jayphelps"><img src="https://avatars1.githubusercontent.com/u/762949?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jay Phelps</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/pulls?q=is%3Apr+reviewed-by%3Ajayphelps" title="Reviewed Pull Requests">👀</a></td>
    <td align="center"><a href="https://www.mathiassoeholm.com"><img src="https://avatars0.githubusercontent.com/u/1747242?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Mathias</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=mathiassoeholm" title="Documentation">📖</a></td>
    <td align="center"><a href="http://go/moon"><img src="https://avatars.githubusercontent.com/u/40330875?v=4?s=100" width="100px;" alt=""/><br /><sub><b>joe moon</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=moon-stripe" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=moon-stripe" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://xunn.io"><img src="https://avatars.githubusercontent.com/u/656017?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Bernard</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=Xunnamius" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=Xunnamius" title="Tests">⚠️</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=Xunnamius" title="Documentation">📖</a><br /> <a href="#infra-Xunnamius" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/babel-utils/babel-plugin-tester/pulls?q=is%3Apr+reviewed-by%3AXunnamius" title="Reviewed Pull Requests">👀</a> <a href="#maintenance-Xunnamius" title="Maintenance">🚧</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->
<!-- remark-ignore-end -->

This project follows the [all-contributors][all-contributors] specification.
Contributions of any kind welcome!

## License

MIT

[@babel/helper-plugin-test-runner]:
  https://github.com/babel/babel/tree/master/packages/babel-helper-plugin-test-runner
[all-contributors]: https://github.com/all-contributors/all-contributors
[bugs]:
  https://github.com/babel-utils/babel-plugin-tester/issues?q=is%3Aissue+is%3Aopen+label%3A%22bug%22
[build]: https://travis-ci.org/babel-utils/babel-plugin-tester
[build-badge]:
  https://img.shields.io/travis/babel-utils/babel-plugin-tester.svg?style=flat-square
[coc]:
  https://github.com/babel-utils/babel-plugin-tester/blob/master/.github/CODE_OF_CONDUCT.md
[coc-badge]:
  https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coverage]: https://codecov.io/github/babel-utils/babel-plugin-tester
[coverage-badge]:
  https://img.shields.io/codecov/c/github/babel-utils/babel-plugin-tester.svg?style=flat-square
[downloads-badge]:
  https://img.shields.io/npm/dm/babel-plugin-tester.svg?style=flat-square
[emojis]: https://github.com/all-contributors/all-contributors#emoji-key
[good-first-issue]:
  https://github.com/babel-utils/babel-plugin-tester/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22
[jamestweet]: https://twitter.com/thejameskyle/status/864359438819262465
[license]:
  https://github.com/babel-utils/babel-plugin-tester/blob/master/LICENSE
[license-badge]:
  https://img.shields.io/npm/l/babel-plugin-tester.svg?style=flat-square
[lodash.mergewith]: https://lodash.com/docs/4.17.4#mergeWith
[node]: https://nodejs.org
[npm]: https://www.npmjs.com
[npmtrends]: https://www.npmtrends.com/babel-plugin-tester
[package]: https://www.npmjs.com/package/babel-plugin-tester
[prs]: http://makeapullrequest.com
[prs-badge]:
  https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[requests]:
  https://github.com/babel-utils/babel-plugin-tester/issues?q=is%3Aissue+is%3Aopen+label%3A%22enhancement%22
[ruletester]:
  http://eslint.org/docs/developer-guide/working-with-rules#rule-unit-tests
[version-badge]:
  https://img.shields.io/npm/v/babel-plugin-tester.svg?style=flat-square
[1]: https://npm.im/babel-plugin-tester
[2]: https://babeljs.io/docs/en/plugins
[3]: https://babeljs.io/docs/en/presets
[4]: https://jestjs.io
[5]: https://vitest.dev
[6]: https://mochajs.org
[7]: https://jasmine.github.io
[8]: https://basarat.gitbook.io/typescript/main-1/defaultisbad
[9]: https://jestjs.io/docs/setup-teardown#one-time-setup
[10]: #preset
[11]: #plugin
[12]: #presetname
[13]: #presetoptions
[14]: #pluginname
[15]: #pluginoptions
[16]: https://jestjs.io/docs/api#describename-fn
[17]: https://jestjs.io/docs/api#testname-fn-timeout
[18]:
  https://github.com/DefinitelyTyped/DefinitelyTyped/blob/2b229cce80b334f673f1b26895007e9eca786366/types/babel-core/index.d.ts#L25
[19]: #pluginname-inference-caveat
[20]: #pluginoptions-2
[21]: #pluginoptions-1
[22]: #presetoptions-2
[23]: #presetoptions-1
[24]:
  https://github.com/babel-utils/babel-plugin-tester/blob/1b413417de0f8f07764ee31e6131cee3e16f1265/src/plugin-tester.ts#L24-L31
[25]: #babeloptions-2
[26]: #babeloptions-1
[27]: https://babeljs.io/docs/en/options#babelrc
[28]: https://babeljs.io/docs/en/options#configfile
[29]: #using-babel-for-configuration-loading
[30]: https://babeljs.io/docs/en/configuration
[31]: https://babeljs.io/docs/en/options#plugins
[32]: https://babeljs.io/docs/en/presets#preset-ordering
[33]: #tests
[34]: #fixtures
[35]: #codefixture
[36]: #outputfixture
[37]: #execfixture
[38]: #formatting-output-with-prettier
[39]: https://nodejs.org/api/path.html#pathjoinpaths
[40]: https://nodejs.org/api/path.html#pathdirnamepath
[41]: #invoke
[42]: #teardown
[43]: #setup-and-teardown-run-order
[44]: #setup
[45]: https://prettier.io
[46]: https://prettier.io/docs/en/configuration.html
[47]: #snapshot-1
[48]: #test-objects
[49]: #fixtureoutputname-1
[50]: #fixtureoutputext-1
[51]: #titlenumbering
[52]: #filepath
[53]: https://github.com/nodejs/node/issues/35889
[54]: #outputjs
[55]: #endofline
[56]: #execjs
[57]: #codejs
[58]: #throws
[59]: https://nodejs.org/api/vm.html#vmruninthiscontextcode-options
[60]: https://babeljs.io/docs/en/babel-plugin-proposal-throw-expressions
[61]: https://nodejs.org/api/modules.html#moduleexports
[62]: #babeloptions
[63]:
  https://github.com/nodejs/node/blob/a03529d82858ed225f40837f14db71851ad5d885/lib/internal/util.js#L97-L99
[64]: https://github.com/facebook/jest/issues/2549
[65]:
  https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-instanceof-array.md
[66]: https://nodejs.org/api/vm.html#vm-executing-javascript
[67]:
  https://github.com/sindresorhus/eslint-plugin-unicorn/issues/723#issuecomment-627001966
[68]: https://nodejs.org/api/util.html#utiltypesisnativeerrorvalue
[69]:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
[70]:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/hasInstance
[71]: https://stackoverflow.com/a/32750746/1367414
[72]: #teardown-1
[73]: #setup-1
[74]: #formatresult
[75]: #full-example
[76]: #code
[77]: #output
[78]: #exec
[79]: #teardown-2
[80]: #setup-2
[81]: #throws-1
[82]: https://jestjs.io/docs/snapshot-testing
[83]: https://www.npmjs.com/package/jest-snapshot
[84]: https://babeljs.io/docs/en/options#config-loading-options
[85]: #custom-plugin-and-preset-run-order
[86]: https://babeljs.io/docs/en/config-files
[87]: https://babeljs.io/docs/en/options#filename
[88]: https://babeljs.io/docs/en/config-files#file-relative-configuration
[89]:
  https://github.com/jamiebuilds/babel-handbook/blob/c6828415127f27fedcc51299e98eaf47b3e26b5f/translations/en/plugin-handbook.md#state
[90]: https://nodejs.org/api/process.html#processcwd
[91]: #custom-snapshot-serialization
[92]: https://npm.im/debug
[93]: https://www.npmjs.com/package/debug#environment-variables
[94]: https://www.npmjs.com/package/debug#namespace-colors
[95]: https://github.com/jamiebuilds
