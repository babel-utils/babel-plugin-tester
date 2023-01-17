# babel-plugin-tester

> **Note**\
> This documentation is for version 11.x of babel-plugin-tester. If you're on an
> earlier version and interested in upgrading, check out the [release notes][1] for
> tips. Discuss any undocumented breaks to backwards-compatibility or offer other
> feedback [here][2] (or [open a new issue][3]). Documentation for earlier versions
> can be found [here][4].

Utilities for testing babel plugins and presets.

---

<!-- prettier-ignore-start -->

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

You are writing a babel [plugin][5] or [preset][6] and want to write tests for
it too.

## This Solution

This is a fairly simple abstraction to help you write tests for your babel
plugin or preset. It was built to work with [Jest][7], but most of the
functionality will work with [Mocha][8], [Jasmine][9], [`node:test`][10],
[Vitest][11], and any other test runner that defines standard `describe` and
`it` globals with async support (see [appendix][12]).

This package is tested on both Windows and nix (Ubuntu) environments.

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
  - [Testing Framework Compatibility](#testing-framework-compatibility)
  - [Using Babel for Configuration Loading](#using-babel-for-configuration-loading)
  - [`pluginName` Inference Caveat](#pluginname-inference-caveat)
  - [Custom Snapshot Serialization](#custom-snapshot-serialization)
  - [Formatting Output with Prettier](#formatting-output-with-prettier)
  - [Built-In Debugging Support](#built-in-debugging-support)
  - [`TEST_ONLY`/`TEST_NUM_ONLY` and `TEST_SKIP`/`TEST_NUM_SKIP` Environment Variables](#test_onlytest_num_only-and-test_skiptest_num_skip-environment-variables)
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

#### Default Export Compatibility

For backwards compatibility reasons, a default export is also available:

```javascript
import pluginTester from 'babel-plugin-tester';

const pluginTester = require('babel-plugin-tester');

const pluginTester = require('babel-plugin-tester').default;

const { default: pluginTester } = require('babel-plugin-tester');
```

These default exports are considered deprecated and [should be avoided][13].
They will be removed in the next major release.

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
> within any [hook functions][14]. For advanced use cases, `pluginTester` may
> appear within one or more `describe` blocks, though this is discouraged.

### Options

This section lists the options you can pass to babel-plugin-tester. They are all
optional with respect to the following:

- When testing a preset, the [`preset`][15] option is required.
- When testing a plugin, the [`plugin`][16] option is required.
- You must test either a preset or a plugin.
- You cannot use preset-specific options ([`preset`][15], [`presetName`][17],
  [`presetOptions`][18]) and plugin-specific options ([`plugin`][16],
  [`pluginName`][19], [`pluginOptions`][20]) at the same time.

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

This is used as the [describe block name][21] and in your [tests' names][22]. If
`pluginName` can be inferred from the [`plugin`][16]'s [name][23], then it will
be and you do not need to provide this option. If it cannot be inferred for
whatever reason, `pluginName` defaults to `"unknown plugin"`.

Note that there is a small [caveat][24] when relying on `pluginName` inference.

#### `pluginOptions`

This is used to pass options into your plugin at transform time. If provided,
the object will be [`lodash.mergeWith`][lodash.mergewith]'d with each [test
object's `pluginOptions`][25]/[fixture's `pluginOptions`][26], with the latter
taking precedence. Note that arrays will be concatenated and explicitly
undefined values will unset previously defined values during merging.

#### `preset`

This is used to provide the babel preset under test. For example:

```javascript
/* file: cool-new-babel-preset.test.js */

import path from 'node:path';
import { pluginTester } from 'babel-plugin-tester';
import coolNewBabelPreset from './cool-new-babel-preset.js';

pluginTester({
  preset: coolNewBabelPreset,
  // A path to a directory containing your test fixtures
  fixtures: path.join(__dirname, 'fixtures')
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

This is used as the [describe block name][21] and in your [tests' names][22].
Defaults to `"unknown preset"`.

#### `presetOptions`

This is used to pass options into your preset at transform time. If provided,
the object will be [`lodash.mergeWith`][lodash.mergewith]'d with each [test
object's `presetOptions`][27]/[fixture's `presetOptions`][28], with the latter
taking precedence. Note that arrays will be concatenated and explicitly
undefined values will unset previously defined values during merging.

#### `babel`

This is used to provide your own implementation of babel. This is particularly
useful if you want to use a different version of babel than what's required by
this package.

#### `babelOptions`

This is used to configure babel. If provided, the object will be
[`lodash.mergeWith`][lodash.mergewith]'d with the [defaults][29] and each [test
object's `babelOptions`][30]/[fixture's `babelOptions`][31], with the latter
taking precedence. Note that arrays will be concatenated and explicitly
undefined values will unset previously defined values during merging.

Also note that [`babelOptions.babelrc`][32] and [`babelOptions.configFile`][33]
are set to `false` by default, which disables automatic babel configuration
loading. [This can be re-enabled if desired][34].

To simply reuse your project's [`babel.config.js`][35] or some other
configuration file, set `babelOptions` like so:

```javascript
import path from 'node:path';
import { pluginTester } from 'babel-plugin-tester';

pluginTester({
  plugin: yourPlugin,
  // ...
  babelOptions: require(path.join('..', 'babel.config.js')),
  // ...
  tests: {
    /* Your test objects */
  }
});
```

##### Custom Plugin and Preset Run Order

By default, when you include a custom list of [plugins][36] or [presets][6] in
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
order][37]:

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
blocks][21], the first enclosing all [tests][38] (i.e. `describe(title, ...)`)
and the second enclosing all [fixtures][39] (i.e.
`` describe(`${title} fixtures`, ...) ``).

Explicitly setting this option will override any defaults or inferred values.
Set to `false` to prevent the creation of these enclosing describe blocks.
Otherwise, the title defaults to using [`pluginName`][19]/[`presetName`][17].

#### `filepath`

This is used to resolve relative paths provided by the [`fixtures`][39] option;
the test object properties [`codeFixture`][40], [`outputFixture`][41], and
[`execFixture`][42]; and [during configuration resolution for prettier][43].
That is: if the aforesaid properties are not absolute paths, they will be
[`path.join`][44]'d with the [directory name][45] of `filepath`.

`filepath` is also passed to `formatResult` if a more specific path is not
available, and it is used as the default value for `babelOptions.filename` in
[test objects][46].

This option defaults to the absolute path of the file that [invoked the
`pluginTester` function][47].

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

> When disabling line ending conversion, note that [Babel will always output
> LF][48] even if the input is CRLF.

#### `setup`

This function will be run before every test runs, including fixtures. It can
return a function which will be treated as a [`teardown`][49] function. It can
also return a promise. If that promise resolves to a function, that will be
treated as a [`teardown`][49] function.

See [here][50] for the complete run order.

#### `teardown`

This function will be run after every test runs, including fixtures. You can
define this via `teardown` or you can return it from the [`setup`][51] function.
This can likewise return a promise if it is asynchronous.

This function, if provided, will be run _after_ any teardown function returned
by [`setup`][51]. See [here][50] for the complete run order.

#### `formatResult`

This function is used to format all babel outputs, and defaults to a function
that invokes [prettier][52]. If a prettier configuration file is [found][53],
then that will be used. Otherwise, prettier will use its own default
configuration.

You can also [override or entirely disable formatting][43].

#### `snapshot`

Equivalent to [`snapshot`][54] but applied globally across all [test
objects][46].

#### `fixtureOutputName`

Equivalent to [`fixtureOutputName`][55] but applied globally across all
[fixtures][39].

#### `fixtureOutputExt`

Equivalent to [`fixtureOutputExt`][56] but applied globally across all
[fixtures][39].

#### `titleNumbering`

Determines which test titles are prefixed with a number when registering [test
blocks][22] (e.g. `` `1. ${title}` ``, `` `2. ${title}` ``, etc). Defaults to
`"all"`.

| Options           | Description                                         |
| ----------------- | --------------------------------------------------- |
| `"all"`           | All test object and fixtures tests will be numbered |
| `"tests-only"`    | Only test object tests will be numbered             |
| `"fixtures-only"` | Only fixtures tests will be numbered                |
| `false`           | Disable automatic numbering in titles entirely      |

#### `restartTitleNumbering`

Normally, multiple [invocations][47] of babel-plugin-tester in the same test
file will share the same [test title numbering][57]. For example:

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

Will result in [test blocks][22] with names like:

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

Which will result in [test blocks][22] with names like:

```text
1. Test one
2. Test two
1. Test one
2. Test x
3. Test five
```

This option is `false` by default.

#### `fixtures`

There are two ways to create tests: using the [`tests`][38] option to provide
one or more [test objects][46] or using the `fixtures` option described here.
Both can be used simultaneously.

The `fixtures` option must be a path to a directory with a structure similar to
the following:

```text
fixtures
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

Assuming the `fixtures` directory is in the same directory as your test file,
you could use it with the following configuration:

```javascript
pluginTester({
  plugin,
  fixtures: path.join(__dirname, 'fixtures')
});
```

> If `fixtures` is not an absolute path, it will be [`path.join`][44]'d with the
> [directory name][45] of [`filepath`][58].

> `.babelrc`, `.babelrc.json`, `.babelrc.js`, `.babelrc.cjs`, and `.babelrc.mjs`
> config files in fixture directories are technically supported out-of-the-box,
> though `.mjs` config files will cause a segfault in Jest until [this issue
> with V8/Chromium is resolved][59].

And it would run four tests, one for each directory in `fixtures` containing a
file starting with "code" or "exec".

##### `code.js`

This file's contents will be used as the source code input into babel at
transform time. Any file extension can be used, even a multi-part extension
(e.g. `.test.js` in `code.test.js`) as long as the file name starts with
`code.`; the [expected output file][60] will have the same file extension suffix
(i.e. `.js` in `code.test.js`) as this file unless changed with the
[`fixtureOutputExt`][56] option.

After being transformed by babel, the resulting output will have whitespace
trimmed, line endings [converted][61], and then get [formatted by prettier][43].

Note that this file cannot appear in the same directory as [`exec.js`][62]. If
more than one `code.*` file exists in a directory, the first one will be used
and the rest will be silently ignored.

##### `output.js`

This file, if provided, will have its contents compared with babel's output,
which is [`code.js`][63] transformed by babel and [formatted with prettier][43].
If this file is missing and neither [`throws`][64] nor [`exec.js`][62] are being
used, this file will be automatically generated from babel's output.
Additionally, the name and extension of this file can be changed with the
[`fixtureOutputName`][55] and [`fixtureOutputExt`][56] options.

Before being compared to babel's output, this file's contents will have
whitespace trimmed and line endings [converted][61].

Note that this file cannot appear in the same directory as [`exec.js`][62].

##### `exec.js`

This file's contents will be used as the input into babel at transform time just
like the [`code.js`][63] file, except the output will be _evaluated_ in the
[same _CJS_ context][65] as the test runner itself, meaning it supports features
like a/sync IIFEs and debugging breakpoints (!) and has access to `expect` (if,
for example, you are using Jest), `require`, and other globals provided by your
test framework. However, the context does not support _`import`, top-level
await, or any other ESM syntax_. Hence, while any file extension can be used
(e.g. `.ts`, `.vue`, `.jsx`), this file will always be evaluated as CJS.

The test will always pass unless an exception is thrown (e.g. when an `expect()`
fails).

Use this to make advanced assertions on the output. For example, to test that
[babel-plugin-proposal-throw-expressions][66] actually throws, your `exec.js`
file might contain:

```javascript
expect(() => throw new Error('throw expression')).toThrow('throw expression');
```

After being transformed by babel but before being evaluated, the babel output
will have whitespace trimmed, line endings [converted][61], and then get
[formatted by prettier][43].

Note that this file cannot appear in the same directory as [`code.js`][63] or
[`output.js`][60]. If more than one `exec.*` file exists in a directory, the
first one will be used and the rest will be silently ignored.

##### `options.json` (Or `options.js`)

For each fixture, the contents of the entirely optional `options.json` file are
[`lodash.mergeWith`][lodash.mergewith]'d with the options provided to
babel-plugin-tester, with the former taking precedence. Note that arrays will be
concatenated and explicitly undefined values will unset previously defined
values during merging.

For added flexibility, `options.json` can be specified as `options.js` instead
so long as a JSON object is exported via [`module.exports`][67]. If both files
exist in the same directory, `options.js` will take precedence and
`options.json` will be ignored entirely.

Fixtures support deeply nested directory structures as well as shared or "root"
`options.json` files. For example, placing an `options.json` file in the
`fixtures/nested` directory would make its contents the "global configuration"
for all fixtures under `fixtures/nested`. That is: each fixture would
[`lodash.mergeWith`][lodash.mergewith] the options provided to
babel-plugin-tester, `fixtures/nested/options.json`, and the contents of their
local `options.json` file as described above.

What follows are the properties you may use if you provide an options file, all
of which are optional:

###### `babelOptions`

This is used to configure babel. Properties specified here override
([`lodash.mergeWith`][lodash.mergewith]) those from the [`babelOptions`][68]
option provided to babel-plugin-tester. Note that arrays will be concatenated
and explicitly undefined values will unset previously defined values during
merging.

###### `pluginOptions`

This is used to pass options into your plugin at transform time. Properties
specified here override ([`lodash.mergeWith`][lodash.mergewith]) those from the
[`pluginOptions`][20] option provided to babel-plugin-tester. Note that arrays
will be concatenated and explicitly undefined values will unset previously
defined values during merging.

Unlike with babel-plugin-tester's options, you can safely mix plugin-specific
properties (like `pluginOptions`) with preset-specific properties (like
[`presetOptions`][28]) in your options files.

###### `presetOptions`

This is used to pass options into your preset at transform time. Properties
specified here override ([`lodash.mergeWith`][lodash.mergewith]) those from the
[`presetOptions`][18] option provided to babel-plugin-tester. Note that arrays
will be concatenated and explicitly undefined values will unset previously
defined values during merging.

Unlike with babel-plugin-tester's options, you can safely mix plugin-specific
properties (like [`pluginOptions`][26]) with preset-specific properties (like
`presetOptions`) in your options files.

###### `title`

If provided, this will be used as the title of the test. Otherwise, the
directory name will be used as the title by default (with spaces replacing
dashes).

###### `only`

Use this to run only the specified fixture. Useful while developing to help
focus on a small number of fixtures. Can be used in multiple `options.json`
files.

> Requires [Jest][69], an equivalent interface (like [Vitest][11]), or a
> manually-defined `it` object exposing an appropriate [`only`][70] method.

###### `skip`

Use this to skip running the specified fixture. Useful for when you are working
on a feature that is not yet supported. Can be used in multiple `options.json`
files.

> Requires [Jest][69], an equivalent interface (like [Vitest][11]), or a
> manually-defined `it` object exposing an appropriate [`skip`][71] method.

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

> Be careful using `instanceof` [across realms][72] as it can lead to [strange
> behavior][73] with [frontend frames/windows][74] and with tools that rely on
> [Node's VM module][75] (like Jest). Prefer [name checks][76] and utilities
> like [`isNativeError`][77], [`Array.isArray`][78], and overriding
> [`Symbol.hasInstance`][79] instead.

If the value of `throws` is a class, that class must [be a subtype of
`Error`][80] or the behavior of babel-plugin-tester is undefined.

> For backwards compatibility reasons, `throws` is synonymous with `error`. They
> can be used interchangeably, with `throws` taking precedence.

Note that this property cannot be present when using an [`exec.js`][62] or
[`output.js`][60] file.

###### `setup`

> As it requires a function value, this property must be used in `options.js`
> instead of `options.json`.

This function will be run before a particular fixture's tests are run. It can
return a function which will be treated as a [`teardown`][81] function. It can
also return a promise. If that promise resolves to a function, that will be
treated as a [`teardown`][81] function.

This function, if provided, will run _after_ any [`setup`][51] function provided
as a babel-plugin-tester option. See [here][50] for the complete run order.

###### `teardown`

> As it requires a function value, this property must be used in `options.js`
> instead of `options.json`.

This function will be run after a fixture's tests finish running. You can define
this via `teardown` or you can return it from the [`setup`][82] function. This
can likewise return a promise if it is asynchronous.

This function, if provided, will be run _after_ any teardown function returned
by the [`setup`][82] property, both of which will run _before_ any
[`teardown`][49] function provided as a babel-plugin-tester option. See
[here][50] for the complete run order.

###### `formatResult`

> As it requires a function value, this property must be used in `options.js`
> instead of `options.json`.

This function is used to format all babel outputs, and defaults to a function
that invokes [prettier][52]. If a prettier configuration file is [found][53],
then that will be used. Otherwise, prettier will use its own default
configuration.

You can also [entirely disable formatting][43].

This will override the [`formatResult`][83] function provided to
babel-plugin-tester.

###### `fixtureOutputName`

Use this to provide your own fixture output file name. Defaults to `"output"`.

###### `fixtureOutputExt`

Use this to provide your own fixture output file extension. Including the
leading period is optional; that is: if you want `output.jsx`,
`fixtureOutputExt` can be set to either `"jsx"` or `".jsx"`. If omitted, the
[input fixture][63]'s file extension will be used instead.

This is particularly useful if you are testing TypeScript input.

#### `tests`

There are two ways to create tests: using the [`fixtures`][39] option that
leverages the filesystem or using the `tests` option described here. Both can be
used simultaneously.

Using the `tests` option, you can provide [test objects][46] describing your
expected transformations. You can provide `tests` as an object of test objects
or an array of test objects. If you provide an object, the object's keys will be
used as the default title of each test. If you provide an array, each test's
default title will be derived from its index and
[`pluginName`][19]/[`presetName`][17].

See [the example][84] for more details.

##### Test Objects

A minimal test object can be:

1. A `string` representing [code][85].
2. An `object` with a [`code`][85] property.

What follows are the properties you may use if you provide an object, most of
which are optional:

###### `babelOptions`

This is used to configure babel. Properties specified here override
([`lodash.mergeWith`][lodash.mergewith]) those from the [`babelOptions`][68]
option provided to babel-plugin-tester. Note that arrays will be concatenated
and explicitly undefined values will unset previously defined values during
merging.

###### `pluginOptions`

This is used to pass options into your plugin at transform time. Properties
specified here override ([`lodash.mergeWith`][lodash.mergewith]) those from the
[`pluginOptions`][20] option provided to babel-plugin-tester. Note that arrays
will be concatenated and explicitly undefined values will unset previously
defined values during merging.

Unlike with babel-plugin-tester's options, you can safely mix plugin-specific
properties (like `pluginOptions`) with preset-specific properties (like
[`presetOptions`][27]) in your test objects.

###### `presetOptions`

This is used to pass options into your preset at transform time. Properties
specified here override ([`lodash.mergeWith`][lodash.mergewith]) those from the
[`presetOptions`][18] option provided to babel-plugin-tester. Note that arrays
will be concatenated and explicitly undefined values will unset previously
defined values during merging.

Unlike with babel-plugin-tester's options, you can safely mix plugin-specific
properties (like [`pluginOptions`][25]) with preset-specific properties (like
`presetOptions`) in your test objects.

###### `title`

If provided, this will be used as the title of the test. Otherwise, the title
will be determined from test object by default.

###### `only`

Use this to run only the specified test. Useful while developing to help focus
on a small number of tests. Can be used on multiple tests.

> Requires [Jest][69], an equivalent interface (like [Vitest][11]), or a
> manually-defined `it` object exposing an appropriate [`only`][70] method.

###### `skip`

Use this to skip running the specified test. Useful for when you are working on
a feature that is not yet supported. Can be used on multiple tests.

> Requires [Jest][69], an equivalent interface (like [Vitest][11]), or a
> manually-defined `it` object exposing an appropriate [`skip`][71] method.

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

> Be careful using `instanceof` [across realms][72] as it can lead to [strange
> behavior][73] with [frontend frames/windows][74] and with tools that rely on
> [Node's VM module][75] (like Jest). Prefer [name checks][76] and utilities
> like [`isNativeError`][77], [`Array.isArray`][78], and overriding
> [`Symbol.hasInstance`][79] instead.

If the value of `throws` is a class, that class must [be a subtype of
`Error`][80] or the behavior of babel-plugin-tester is undefined.

> For backwards compatibility reasons, `throws` is synonymous with `error`. They
> can be used interchangeably, with `throws` taking precedence.

Note that this property cannot be present when using the [`output`][86],
[`outputFixture`][41], [`exec`][87], [`execFixture`][42], or [`snapshot`][54]
properties.

###### `setup`

This function will be run before a particular test is run. It can return a
function which will be treated as a [`teardown`][88] function. It can also
return a promise. If that promise resolves to a function, that will be treated
as a [`teardown`][88] function.

This function, if provided, will run _after_ any [`setup`][51] function provided
as a babel-plugin-tester option. See [here][50] for the complete run order.

###### `teardown`

This function will be run after a test finishes running. You can define this via
`teardown` or you can return it from the [`setup`][89] function. This can
likewise return a promise if it is asynchronous.

This function, if provided, will be run _after_ any teardown function returned
by the [`setup`][89] property, both of which will run _before_ any
[`teardown`][49] function provided as a babel-plugin-tester option. See
[here][50] for the complete run order.

###### `formatResult`

This function is used to format all babel outputs, and defaults to a function
that invokes [prettier][52]. If a prettier configuration file is [found][53],
then that will be used. Otherwise, prettier will use its own default
configuration.

You can also [entirely disable formatting][43].

This will override the [`formatResult`][83] function provided to
babel-plugin-tester.

###### `snapshot`

If you would prefer to take a snapshot of babel's output rather than compare it
to something you provide manually, specify `snapshot: true`. This will cause
babel-plugin-tester to generate a snapshot containing both the [source code][85]
and babel's output.

Defaults to `false`.

Note that this property cannot appear in the same test object as the
[`output`][86], [`outputFixture`][41], [`exec`][87], [`execFixture`][42], or
[`throws`][90] properties.

> Requires [Jest][69], an [appropriate shim][91] or equivalent interface (like
> [Vitest][11]), or a manually-defined `expect` object exposing an appropriate
> [`toMatchSnapshot`][92] method.

###### `code`

The code that you want babel to transform using your plugin or preset. This must
be provided unless you are using the [`codeFixture`][40] or [`exec`][87]
properties instead. If you do not provide the [`output`][86] or
[`outputFixture`][41] properties and [`snapshot`][54] is not truthy, then the
assertion is that this code is unchanged by the transformation.

Before being transformed by babel, any indentation will be stripped as a
convenience for template literals. After being transformed, the resulting output
will have whitespace trimmed, line endings [converted][61], and then get
[formatted by prettier][43].

Note that this property cannot appear in the same test object as the
[`codeFixture`][40], [`exec`][87], or [`execFixture`][42] properties.

###### `output`

The value of this property will be compared with [babel's output][85].

Before being compared to babel's output, this value will have whitespace
trimmed, line endings [converted][61], and any indentation stripped as a
convenience for template literals.

Note that this property cannot appear in the same test object as the
[`outputFixture`][41], [`exec`][87], [`execFixture`][42], [`throws`][90], or
[`snapshot`][54] properties.

###### `exec`

The provided source will be transformed just like the [`code`][85] property,
except the output will be _evaluated_ in the [same _CJS_ context][65] as the
test runner itself, meaning it supports features like a/sync IIFEs and debugging
breakpoints (!) and has access to `expect` (if, for example, you are using
Jest), `require`, and other globals provided by your test framework. However,
the context does not support _`import`, top-level await, or any other ESM
syntax_. Hence, while any file extension can be used (e.g. `.ts`, `.vue`,
`.jsx`), this file will always be evaluated as CJS.

The test will always pass unless an exception is thrown (e.g. when an `expect()`
fails).

Use this to make advanced assertions on the output. For example, you can test
that [babel-plugin-proposal-throw-expressions][66] actually throws using the
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
will have whitespace trimmed, line endings [converted][61], and then get
[formatted by prettier][43].

Note that this property cannot appear in the same test object as the
[`execFixture`][42], [`code`][85], [`codeFixture`][40], [`output`][86],
[`outputFixture`][41], [`throws`][90], or [`snapshot`][54] properties.

###### `codeFixture`

If you would rather put your [`code`][85] in a separate file, you can specify a
file path here instead. If it is an absolute path, then that's the file that
will be loaded. Otherwise, `codeFixture` will be [`path.join`][44]'d with the
[directory name][45] of [`filepath`][58].

After being transformed by babel, the resulting output will have whitespace
trimmed, line endings [converted][61], and then get [formatted by prettier][43].

Like [`code`][85], this property cannot appear in the same test object as the
[`exec`][87] or [`execFixture`][42] properties, nor the [`code`][85] property
(obviously).

> If you find you are using this property more than a couple of times, consider
> using [`fixtures`][39] instead.

> For backwards compatibility reasons, `codeFixture` is synonymous with
> `fixture`. They can be used interchangeably, though care must be taken not to
> confuse the test object property `fixture` with the babel-plugin-tester option
> [_`fixtures`_][39], the latter being plural.

###### `outputFixture`

If you would rather put your [`output`][86] in a separate file, you can specify
a file path here instead. If it is an absolute path, then that's the file that
will be loaded. Otherwise, `outputFixture` will be [`path.join`][44]'d with the
[directory name][45] of [`filepath`][58].

Before being compared to babel's output, this file's contents will have
whitespace trimmed and line endings [converted][61].

Like [`output`][86], this property cannot appear in the same test object as the
[`exec`][87], [`execFixture`][42], [`throws`][90], or [`snapshot`][54]
properties, nor the [`output`][86] property (obviously).

> If you find you are using this property more than a couple of times, consider
> using [`fixtures`][39] instead.

###### `execFixture`

If you would rather put your [`exec`][87] in a separate file, you can specify a
file path here instead. If it is an absolute path, then that's the file that
will be loaded. Otherwise, `execFixture` will be [`path.join`][44]'d with the
[directory name][45] of [`filepath`][58].

After being transformed by babel but before being evaluated, the babel output
will have whitespace trimmed, line endings [converted][61], and then get
[formatted by prettier][43].

Like [`exec`][87], this property cannot appear in the same test object as the
[`code`][85], [`codeFixture`][40], [`output`][86], [`outputFixture`][41],
[`throws`][90], or [`snapshot`][54] properties, nor the [`exec`][87] property
(obviously).

> If you find you are using this property more than a couple of times, consider
> using [`fixtures`][39] instead.

## Examples

What follows are several babel-plugin-tester [test object][46] examples. See
[`fixtures`][39] for an example fixtures directory layout.

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
      output: "var olleh = 'hi';"
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
import path from 'node:path';
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
      codeFixture: path.join(
        __dirname,
        '..',
        'fixtures',
        'codeFixture-unchanging.js'
      )
      // No output, outputFixture, or snapshot, so the assertion will be that
      // the plugin does not change this code
    },
    {
      // Because these are not absolute paths, they will be joined with the
      // directory of the filepath option provided above
      codeFixture: path.join('..', 'fixtures', 'codeFixture.js'),
      // Because outputFixture is provided, the assertion will be that the
      // plugin will change the contents of "changed.js" to the contents of
      // "changed-output.js"
      outputFixture: path.join('..', 'fixtures', 'outputFixture.js')
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
      // produced code will be evaluated in the same CJS context as the test
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

### Testing Framework Compatibility

This package was originally tested on and built to work with [Jest][7], but it
is also [tested][93] against [Vitest][11], [Mocha][8], [Jasmine][9], and
[`node:test`][10]. See below for details.

#### Jest

All babel-plugin-tester features work with Jest. No further action is necessary
🚀

#### Vitest

All babel-plugin-tester features work with Vitest, though Vitest don't provide
global APIs by default. You can either supply some interoperability code (see
Jasmine or `node:test` below for an example) or run Vitest with the [`--globals`
CLI option][94].

#### Mocha

Most babel-plugin-tester features work with Mocha, except Mocha does not
natively support snapshots.

#### Jasmine

Most babel-plugin-tester features work with Jasmine if you define the
appropriate globals:

```javascript
import { pluginTester } from 'babel-plugin-tester';

globalThis.it.skip = globalThis.xit;
globalThis.it.only = globalThis.fit;

pluginTester(...);
```

However, Jasmine does not natively support snapshots.

#### `node:test`

Most babel-plugin-tester features work with `node:test` if you define the
appropriate globals:

```javascript
import { describe, it } from 'node:test';
import { pluginTester } from 'babel-plugin-tester';

globalThis.describe = describe;
globalThis.it = it;
// globalThis.it.skip = ... (weirdly, this is already defined)
globalThis.it.only = (...args) => it(args[0], { only: true }, args[1]);

pluginTester(...);
```

However, `node:test` does not natively support snapshots.

#### Other Frameworks

Other testing frameworks and test runners should also work so long as they
define standard `describe` and `it` globals with async support, or appropriate
interoperability code is used like in the above Jasmine and `node:test`
examples.

### Using Babel for Configuration Loading

[`babelOptions.babelrc`][32] and [`babelOptions.configFile`][33] are set to
`false` by default. This way, you can [manually import (or provide an object
literal)][68] the exact configuration you want to apply rather than relying on
babel's [somewhat complex configuration loading rules][95]. However, if your
plugin, preset, or project relies on a complicated external setup to do its
work, and you do not mind the [default run order][96], you can leverage [babel's
automatic configuration loading][97] via the `babelOptions.babelrc` and/or
`babelOptions.configFile` options.

> Fixtures provided via the [`fixtures`][39] option **do not** need to provide a
> separate `babelOptions.filename` since it will be set automatically. This
> section only applies to [test objects][46].

When relying on `babelOptions.babelrc`, you must also provide a
[`babelOptions.filename`][98] for each test object that does not include a
[`codeFixture`][40] or [`execFixture`][42] property. For example:

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
      codeFixture: path.join(__dirname, 'fixtures', 'my-file.js')
    },
    {
      // babelOptions.filename will be set to the value of execFixture for you
      // unless you set it manually here at the test level
      execFixture: path.join(__dirname, 'fixtures', 'my-script.js')
    }
  ]
});
```

This file does not actually have to exist either, so you can use whatever value
you want for `filename` as long as the `.babelrc` file is [resolved][99]
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
      codeFixture: path.join(__dirname, 'fixtures', 'my-file.js')
    },
    {
      // babelOptions.filename will be set to the value of execFixture for you
      // unless you set it manually here at the test level
      execFixture: path.join(__dirname, 'fixtures', 'my-script.js')
    }
  ]
});
```

### `pluginName` Inference Caveat

Inferring [`pluginName`][19] during testing requires invoking [the plugin][16]
_at least twice_: once outside of babel to check for the plugin's name and then
again when run by babel. This is irrelevant to babel-plugin-tester (even if your
plugin crashes when run outside of babel) and to the overwhelming majority of
babel plugins in existence. This only becomes a problem if your plugin is
_aggressively stateful_, which is against the [babel handbook on plugin
design][100].

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

By default, a [formatter][83] is used which formats all babel output with
[prettier][52]. It will [look for][53] a prettier configuration file relative to
[the file that's being tested][58] or the [current working directory][101]. If
it cannot find one, then it uses the default configuration for prettier.

This makes your snapshots easier to read and your expectations easier to write,
but if you would like to disable this feature, you can either use the [`pure`
import][102] to disable automatic formatting (along with snapshot serialization)
or you can override the `formatResult` option manually like so:

```javascript
pluginTester({
  // ...
  formatResult: (r) => r
  // ...
});
```

### Built-In Debugging Support

This package uses [debug][103] under the hood. To view all possible debugging
output, including the results of all babel transformations, set the
`DEBUG='babel-plugin-tester,babel-plugin-tester:*'` [environment variable][104]
when running your tests.

For example:

```bash
# Those using Windows (but not WSL) have to set environment variable differently
NODE_ENV='test' DEBUG='babel-plugin-tester,babel-plugin-tester:*' DEBUG_DEPTH='1' npx jest
```

#### Available Debug Namespaces

The following [debug namespaces][105] are available for activation:

<!-- lint disable list-item-style -->

- `babel-plugin-tester:index`
- `babel-plugin-tester:formatter`
- `babel-plugin-tester:serializer`
- `babel-plugin-tester:tester`
  - `babel-plugin-tester:tester:resolve-base`
  - `babel-plugin-tester:tester:resolve-env`
  - `babel-plugin-tester:tester:normalize`
    - `babel-plugin-tester:tester:normalize:create-desc`
    - `babel-plugin-tester:tester:normalize:create-fix`
    - `babel-plugin-tester:tester:normalize:create-obj`
  - `babel-plugin-tester:tester:register`
  - `babel-plugin-tester:tester:wrapper`
  - `babel-plugin-tester:tester:test`
  - `babel-plugin-tester:tester:validate`
  - `babel-plugin-tester:tester:read-opts`
  - `babel-plugin-tester:tester:read-code`
  - `babel-plugin-tester:tester:eol`
  - `babel-plugin-tester:tester:finalize`

The `babel-plugin-tester:tester` namespace and its sub-namespaces each have an
additional `verbose` sub-namespace that can be activated or deactivated at will,
e.g. `babel-plugin-tester:tester:verbose` and
`babel-plugin-tester:tester:wrapper:verbose`.

For example, to view all debug output except verbose output:

```bash
# Those using Windows (but not WSL) have to set environment variable differently
NODE_ENV='test' DEBUG='babel-plugin-tester,babel-plugin-tester:*,-*:verbose' npx jest
```

<!-- lint enable list-item-style -->

### `TEST_ONLY`/`TEST_NUM_ONLY` and `TEST_SKIP`/`TEST_NUM_SKIP` Environment Variables

The optional `TEST_ONLY` and `TEST_SKIP` environment variables are recognized by
babel-plugin-tester, allowing you to control which tests are run in an adhoc
fashion without having to modify your test configuration code.

The values of these variables will be transformed into regular expressions via
`RegExp(value, 'u')` and matched against each test/fixture title (not including
[automatically assigned numbers][57] prefixed to titles). Tests with titles that
match `TEST_ONLY` will be run while all others are skipped. On the other hand,
tests with titles that match `TEST_SKIP` will be skipped while others are run.

For example, to skip the test titled "this is the name of a failing unit test":

```bash
TEST_SKIP='name of a failing' npx jest
```

Given both `TEST_ONLY` and `TEST_SKIP`, tests matched by `TEST_SKIP` will
_always_ be skipped, even if they are also matched by `TEST_ONLY`. These
environment variables also override both the fixture-specific
[`skip`][106]/[`only`][107] and test object [`skip`][108]/[`only`][109]
properties _if they conflict_.

In addition to `TEST_ONLY` and `TEST_SKIP`, you can also target tests
specifically by their [automatically assigned number][57] using `TEST_NUM_ONLY`
and `TEST_NUM_SKIP`. These environment variables function identically to their
counterparts except they accept one or more numbers separated by commas (spaces
around commas are ignored) instead of regular expressions. Inclusive ranges
(e.g. `4-9`) are also supported.

For example, the following will skip tests numbered 1, 3, 5, and 6-10
(inclusive):

```bash
# Spaces around commas don't matter and sequential/final commas are ignored
TEST_NUM_SKIP='5,1, 6-10,,  3,' npx jest
```

`TEST_NUM_ONLY` and `TEST_NUM_SKIP` are meaningless if [`titleNumbering`][57] is
`false` or your tests are otherwise unnumbered, and may match multiple tests if
[automatic numbering is restarted][110].

### `setup` and `teardown` Run Order

For each test object and fixture test, setup and teardown functions are run in
the following order:

1. [Base `setup`][51].
2. [Test object `setup`][89] / [fixture `setup`][82].
3. _Test object / fixture test is run_.
4. Any function returned by test object `setup` / fixture `setup`.
5. [Test object `teardown`][88] / [fixture `teardown`][81].
6. Any function returned by base `setup`.
7. [Base `teardown`][49].

## Inspiration

The API was inspired by:

- ESLint's [RuleTester][ruletester].
- [@thejameskyle][111]'s [tweet][jamestweet].
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
[1]: https://github.com/babel-utils/babel-plugin-tester/releases/tag/v11.0.0
[2]: https://github.com/babel-utils/babel-plugin-tester/issues/139
[3]: https://github.com/babel-utils/babel-plugin-tester/issues/new
[4]: https://www.npmjs.com/package/babel-plugin-tester?activeTab=versions
[5]: https://babeljs.io/docs/en/plugins
[6]: https://babeljs.io/docs/en/presets
[7]: https://jestjs.io
[8]: https://mochajs.org
[9]: https://jasmine.github.io
[10]: https://nodejs.org/api/test.html#test-runner
[11]: https://vitest.dev
[12]: #testing-framework-compatibility
[13]: https://basarat.gitbook.io/typescript/main-1/defaultisbad
[14]: https://jestjs.io/docs/setup-teardown#one-time-setup
[15]: #preset
[16]: #plugin
[17]: #presetname
[18]: #presetoptions
[19]: #pluginname
[20]: #pluginoptions
[21]: https://jestjs.io/docs/api#describename-fn
[22]: https://jestjs.io/docs/api#testname-fn-timeout
[23]:
  https://github.com/DefinitelyTyped/DefinitelyTyped/blob/2b229cce80b334f673f1b26895007e9eca786366/types/babel-core/index.d.ts#L25
[24]: #pluginname-inference-caveat
[25]: #pluginoptions-2
[26]: #pluginoptions-1
[27]: #presetoptions-2
[28]: #presetoptions-1
[29]:
  https://github.com/babel-utils/babel-plugin-tester/blob/1b413417de0f8f07764ee31e6131cee3e16f1265/src/plugin-tester.ts#L24-L31
[30]: #babeloptions-2
[31]: #babeloptions-1
[32]: https://babeljs.io/docs/en/options#babelrc
[33]: https://babeljs.io/docs/en/options#configfile
[34]: #using-babel-for-configuration-loading
[35]: https://babeljs.io/docs/en/configuration
[36]: https://babeljs.io/docs/en/options#plugins
[37]: https://babeljs.io/docs/en/presets#preset-ordering
[38]: #tests
[39]: #fixtures
[40]: #codefixture
[41]: #outputfixture
[42]: #execfixture
[43]: #formatting-output-with-prettier
[44]: https://nodejs.org/api/path.html#pathjoinpaths
[45]: https://nodejs.org/api/path.html#pathdirnamepath
[46]: #test-objects
[47]: #invoke
[48]: https://github.com/babel/babel/issues/8921
[49]: #teardown
[50]: #setup-and-teardown-run-order
[51]: #setup
[52]: https://prettier.io
[53]: https://prettier.io/docs/en/configuration.html
[54]: #snapshot-1
[55]: #fixtureoutputname-1
[56]: #fixtureoutputext-1
[57]: #titlenumbering
[58]: #filepath
[59]: https://github.com/nodejs/node/issues/35889
[60]: #outputjs
[61]: #endofline
[62]: #execjs
[63]: #codejs
[64]: #throws
[65]: https://nodejs.org/api/vm.html#vmruninthiscontextcode-options
[66]: https://babeljs.io/docs/en/babel-plugin-proposal-throw-expressions
[67]: https://nodejs.org/api/modules.html#moduleexports
[68]: #babeloptions
[69]: https://jestjs.io/docs/snapshot-testing
[70]: https://jestjs.io/docs/api#testonlyname-fn-timeout
[71]: https://jestjs.io/docs/api#testskipname-fn
[72]:
  https://github.com/nodejs/node/blob/a03529d82858ed225f40837f14db71851ad5d885/lib/internal/util.js#L97-L99
[73]: https://github.com/facebook/jest/issues/2549
[74]:
  https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-instanceof-array.md
[75]: https://nodejs.org/api/vm.html#vm-executing-javascript
[76]:
  https://github.com/sindresorhus/eslint-plugin-unicorn/issues/723#issuecomment-627001966
[77]: https://nodejs.org/api/util.html#utiltypesisnativeerrorvalue
[78]:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray
[79]:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/hasInstance
[80]: https://stackoverflow.com/a/32750746/1367414
[81]: #teardown-1
[82]: #setup-1
[83]: #formatresult
[84]: #full-example
[85]: #code
[86]: #output
[87]: #exec
[88]: #teardown-2
[89]: #setup-2
[90]: #throws-1
[91]: https://www.npmjs.com/package/jest-snapshot
[92]: https://jestjs.io/docs/expect#tomatchsnapshotpropertymatchers-hint
[93]: ./test/integration/integration-node-smoke.test.ts
[94]: https://vitest.dev/config#globals
[95]: https://babeljs.io/docs/en/options#config-loading-options
[96]: #custom-plugin-and-preset-run-order
[97]: https://babeljs.io/docs/en/config-files
[98]: https://babeljs.io/docs/en/options#filename
[99]: https://babeljs.io/docs/en/config-files#file-relative-configuration
[100]:
  https://github.com/jamiebuilds/babel-handbook/blob/c6828415127f27fedcc51299e98eaf47b3e26b5f/translations/en/plugin-handbook.md#state
[101]: https://nodejs.org/api/process.html#processcwd
[102]: #custom-snapshot-serialization
[103]: https://npm.im/debug
[104]: https://www.npmjs.com/package/debug#environment-variables
[105]: https://www.npmjs.com/package/debug#namespace-colors
[106]: #skip
[107]: #only
[108]: #skip-1
[109]: #only-1
[110]: #restarttitlenumbering
[111]: https://github.com/jamiebuilds
