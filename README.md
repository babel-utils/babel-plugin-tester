<!-- symbiote-template-region-start 1 -->

<p align="center" width="100%">
  <img width="300" src="./logo.png">
</p>

<p align="center" width="100%">
<!-- symbiote-template-region-end -->
Utilities for testing babel plugins 🧪
<!-- symbiote-template-region-start 2 -->
</p>

<hr />

<div align="center">

[![Black Lives Matter!][x-badge-blm-image]][x-badge-blm-link]
[![Last commit timestamp][x-badge-lastcommit-image]][x-badge-repo-link]
[![Codecov][x-badge-codecov-image]][x-badge-codecov-link]
[![Source license][x-badge-license-image]][x-badge-license-link]
[![Uses Semantic Release!][x-badge-semanticrelease-image]][x-badge-semanticrelease-link]

[![NPM version][x-badge-npm-image]][x-badge-npm-link]
[![Monthly Downloads][x-badge-downloads-image]][x-badge-npm-link]

</div>

<br />

# babel-plugin-tester

<!-- symbiote-template-region-end -->

This is a fairly simple abstraction to help you write tests for your babel
plugin or preset. It was built to work with [Jest][1], but most of the
functionality will work with [Mocha][2], [Jasmine][3], [`node:test`][4],
[Vitest][5], and any other test runner that defines standard `describe` and `it`
globals with async support (see [appendix][6]).

This package is tested on both Windows and nix (Ubuntu) environments.

<!-- symbiote-template-region-start 3 -->

---

<!-- remark-ignore-start -->
<!-- symbiote-template-region-end -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Install](#install)
  - [`babel-plugin-tester@11`](#babel-plugin-tester11)
  - [`babel-plugin-tester@12`](#babel-plugin-tester12)
- [Usage](#usage)
  - [Import](#import)
  - [Invoke](#invoke)
  - [Execute](#execute)
  - [Configure](#configure)
- [Examples](#examples)
  - [Simple Example](#simple-example)
  - [Full Example](#full-example)
  - [Fixtures Examples](#fixtures-examples)
- [Appendix](#appendix)
  - [Testing Framework Compatibility](#testing-framework-compatibility)
  - [Using Babel for Configuration Loading](#using-babel-for-configuration-loading)
  - [`pluginName` Inference Caveat](#pluginname-inference-caveat)
  - [Custom Snapshot Serialization](#custom-snapshot-serialization)
  - [Formatting Output with Prettier](#formatting-output-with-prettier)
  - [Built-In Debugging Support](#built-in-debugging-support)
  - [`TEST_ONLY`/`TEST_NUM_ONLY` and `TEST_SKIP`/`TEST_NUM_SKIP` Environment Variables](#test_onlytest_num_only-and-test_skiptest_num_skip-environment-variables)
  - [`setup` and `teardown` Run Order](#setup-and-teardown-run-order)
  - [Published Package Details](#published-package-details)
  - [License](#license)
- [Contributing and Support](#contributing-and-support)
  - [Inspiration](#inspiration)
  - [Contributors](#contributors)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
<!-- symbiote-template-region-start 4 -->
<!-- remark-ignore-end -->

<br />

## Install

<!-- symbiote-template-region-end -->

Currently, babel-plugin-tester comes in two flavors:

### `babel-plugin-tester@11`

```shell
npm install --save-dev babel-plugin-tester
# Alternatively:
#npm install --save-dev babel-plugin-tester@11
```

This version of babel-plugin-tester:

- Has a minimum Node version of `18.19.0`.

- Optionally works with `jest@<=29` (as an optional peer dependency).

- Works with `prettier@2` (as a dependency).

### `babel-plugin-tester@12`

```shell
npm install --save-dev babel-plugin-tester@12.0.0-canary.2
# May require --force in some situations:
#npm install --save-dev babel-plugin-tester@12.0.0-canary.2 jest-extended
#npm install --save-dev --force jest@30.0.0-alpha.6
```

> \[!TIP]
>
> Check [the registry][7] for the latest canary version number.

This version of babel-plugin-tester:

- Technically has a minimum Node version of `20.18.0`, but likely works with
  `node@18`.

- Optionally works with `jest@>=30` (as an optional peer dependency).

> \[!CAUTION]
>
> You may need `--force` (i.e. `npm install ... --force`) if your project
> depends on Jest ecosystem packages that don't yet recognize `jest@>=30`, such
> as `jest-extended@<=4.0.2`.

- Works with `prettier@3` (as a dependency).

- Is stable and fully tested (despite the "canary" and "prerelease" monikers)
  but cannot be released until `jest@30` is released.

## Usage

To use babel-plugin-tester:

1. Import babel-plugin-tester into your test file.
2. Invoke `pluginTester` in your test file.
3. Execute your test file.

### Import

ESM:

```javascript
import { pluginTester } from 'babel-plugin-tester';
```

CJS:

```javascript
const { pluginTester } = require('babel-plugin-tester');
```

### Invoke

```javascript
/* file: test/unit.test.js */

import { pluginTester } from 'babel-plugin-tester';
import yourPlugin from 'universe:your-plugin';

pluginTester({
  plugin: yourPlugin,
  tests: {
    /* Your test objects */
  }
});
```

> \[!TIP]
>
> Note how `pluginTester` does not appear inside any `test`/`it` block nor
> within any [hook functions][8]. For advanced use cases, `pluginTester` may
> appear within one or more `describe` blocks, though this is discouraged.

### Execute

In your terminal of choice:

```shell
# Prettier@3 requires --experimental-vm-modules for older Node versions
NODE_OPTIONS='--no-warnings --experimental-vm-modules' npx jest
```

### Configure

This section lists the options you can pass to babel-plugin-tester. They are all
optional with respect to the following:

- When testing a preset, the [`preset`][9] option is required.
- When testing a plugin, the [`plugin`][10] option is required.
- You must test either a preset or a plugin.
- You cannot use preset-specific options ([`preset`][9], [`presetName`][11],
  [`presetOptions`][12]) and plugin-specific options ([`plugin`][10],
  [`pluginName`][13], [`pluginOptions`][14]) at the same time.

#### `plugin`

This is used to provide the babel plugin under test. For example:

```javascript
/* file: test/unit.test.js */

import { pluginTester } from 'babel-plugin-tester';
import identifierReversePlugin from 'universe:identifier-reverse-plugin';

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

This is used as the [describe block name][15] and in your [tests' names][16]. If
`pluginName` can be inferred from the [`plugin`][10]'s [name][17], then it will
be and you do not need to provide this option. If it cannot be inferred for
whatever reason, `pluginName` defaults to `"unknown plugin"`.

Note that there is a small [caveat][18] when relying on `pluginName` inference.

#### `pluginOptions`

This is used to pass options into your plugin at transform time. If provided,
the object will be [`lodash.mergeWith`][lodash.mergewith]'d with each [test
object's `pluginOptions`][19]/[fixture's `pluginOptions`][20], with the latter
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

This is used as the [describe block name][15] and in your [tests' names][16].
Defaults to `"unknown preset"`.

#### `presetOptions`

This is used to pass options into your preset at transform time. If provided,
the object will be [`lodash.mergeWith`][lodash.mergewith]'d with each [test
object's `presetOptions`][21]/[fixture's `presetOptions`][22], with the latter
taking precedence. Note that arrays will be concatenated and explicitly
undefined values will unset previously defined values during merging.

#### `babel`

This is used to provide your own implementation of babel. This is particularly
useful if you want to use a different version of babel than what's required by
this package.

#### `babelOptions`

This is used to configure babel. If provided, the object will be
[`lodash.mergeWith`][lodash.mergewith]'d with the [defaults][23] and each [test
object's `babelOptions`][24]/[fixture's `babelOptions`][25], with the latter
taking precedence.

Be aware that arrays will be concatenated and explicitly undefined values will
unset previously defined values during merging.

> \[!IMPORTANT]
>
> For `babel-plugin-tester@>=12`, [duplicate entries][26] in
> [`babelOptions.plugins`][27] and [`babelOptions.presets`][28] are reduced,
> with latter entries _completely overwriting_ any that came before. In other
> words: the last duplicate plugin or preset configuration wins. **They are not
> merged.** This makes it easy to provide an alternative one-off configuration
> for a plugin or preset that is also used elsewhere, such as a project's root
> `babel.config.js` file.
>
> Attempting the same with `babel-plugin-tester@<12` will cause babel [to
> throw][26] since duplicate entries are technically not allowed.

Also note that [`babelOptions.babelrc`][29] and [`babelOptions.configFile`][30]
are set to `false` by default, which disables automatic babel configuration
loading. [This can be re-enabled if desired][31].

To simply reuse your project's [`babel.config.js`][32] or some other
configuration file, set `babelOptions` like so:

```javascript
// file: /repos/my-project/tests/unit-plugin.test.ts

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

By default, when you include a custom list of [plugins][33] or [presets][34] in
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
order][35]:

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
blocks][15], the first enclosing all [tests][36] (i.e. `describe(title, ...)`)
and the second enclosing all [fixtures][37] (i.e.
``describe(`${title} fixtures`, ...)``).

Explicitly setting this option will override any defaults or inferred values.
Set to `false` to prevent the creation of these enclosing describe blocks.
Otherwise, the title defaults to using [`pluginName`][13]/[`presetName`][11].

#### `filepath`

This is used to resolve relative paths provided by the [`fixtures`][37] option;
the test object properties [`codeFixture`][38], [`outputFixture`][39], and
[`execFixture`][40]; and [during configuration resolution for prettier][41].
That is: if the aforesaid properties are not absolute paths, they will be
[`path.join`][42]'d with the [directory name][43] of `filepath`.

`filepath` is also passed to `formatResult` if a more specific path is not
available, and it is used as the default value for `babelOptions.filename` in
[test objects][44].

This option defaults to the absolute path of the file that [invoked the
`pluginTester` function][45].

> \[!NOTE]
>
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

> \[!NOTE]
>
> When disabling line ending conversion, note that [Babel will always output
> LF][46] even if the input is CRLF.

#### `setup`

This function will be run before every test runs, including fixtures. It can
return a function which will be treated as a [`teardown`][47] function. It can
also return a promise. If that promise resolves to a function, that will be
treated as a [`teardown`][47] function.

See [here][48] for the complete run order.

#### `teardown`

This function will be run after every test runs, including fixtures. You can
define this via `teardown` or you can return it from the [`setup`][49] function.
This can likewise return a promise if it is asynchronous.

This function, if provided, will be run _after_ any teardown function returned
by [`setup`][49]. See [here][48] for the complete run order.

#### `formatResult`

This function is used to format all babel outputs, and defaults to a function
that invokes [prettier][50]. If a prettier configuration file is [found][51],
then that will be used. Otherwise, prettier will use its own default
configuration.

You can also [override or entirely disable formatting][41].

#### `snapshot`

Equivalent to [`snapshot`][52] but applied globally across all [test
objects][44].

#### `fixtureOutputName`

Equivalent to [`fixtureOutputName`][53] but applied globally across all
[fixtures][37].

#### `fixtureOutputExt`

Equivalent to [`fixtureOutputExt`][54] but applied globally across all
[fixtures][37].

#### `titleNumbering`

Determines which test titles are prefixed with a number when registering [test
blocks][16] (e.g. `` `1. ${title}` ``, `` `2. ${title}` ``, etc). Defaults to
`"all"`.

| Options           | Description                                         |
| ----------------- | --------------------------------------------------- |
| `"all"`           | All test object and fixtures tests will be numbered |
| `"tests-only"`    | Only test object tests will be numbered             |
| `"fixtures-only"` | Only fixtures tests will be numbered                |
| `false`           | Disable automatic numbering in titles entirely      |

#### `restartTitleNumbering`

Normally, multiple [invocations][45] of babel-plugin-tester in the same test
file will share the same [test title numbering][55]. For example:

```javascript
/* file: test/unit.test.js */

import { pluginTester } from 'babel-plugin-tester';
import yourPlugin from 'universe:your-plugin';

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

Will result in [test blocks][16] with names like:

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
import yourPlugin from 'universe:your-plugin';

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

Which will result in [test blocks][16] with names like:

```text
1. Test one
2. Test two
1. Test one
2. Test x
3. Test five
```

This option is `false` by default.

#### `fixtures`

There are two ways to create tests: using the [`tests`][36] option to provide
one or more [test objects][44] or using the `fixtures` option described here.
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

> \[!TIP]
>
> `.babelrc`, `.babelrc.json`, `.babelrc.js`, `.babelrc.cjs`, and `.babelrc.mjs`
> config files in fixture directories are supported out-of-the-box.

Assuming the `fixtures` directory is in the same directory as your test file,
you could use it with the following configuration:

```javascript
pluginTester({
  plugin,
  fixtures: path.join(__dirname, 'fixtures')
});
```

> \[!NOTE]
>
> If `fixtures` is not an absolute path, it will be [`path.join`][42]'d with the
> [directory name][43] of [`filepath`][56].

And it would run four tests, one for each directory in `fixtures` containing a
file starting with "code" or "exec".

##### `code.js`

This file's contents will be used as the source code input into babel at
transform time. Any file extension can be used, even a multi-part extension
(e.g. `.test.js` in `code.test.js`) as long as the file name starts with
`code.`; the [expected output file][57] will have the same file extension suffix
(i.e. `.js` in `code.test.js`) as this file unless changed with the
[`fixtureOutputExt`][54] option.

After being transformed by babel, the resulting output will have whitespace
trimmed, line endings [converted][58], and then get [formatted by prettier][41].

Note that this file cannot appear in the same directory as [`exec.js`][59]. If
more than one `code.*` file exists in a directory, the first one will be used
and the rest will be silently ignored.

##### `output.js`

This file, if provided, will have its contents compared with babel's output,
which is [`code.js`][60] transformed by babel and [formatted with prettier][41].
If this file is missing and neither [`throws`][61] nor [`exec.js`][59] are being
used, this file will be automatically generated from babel's output.
Additionally, the name and extension of this file can be changed with the
[`fixtureOutputName`][53] and [`fixtureOutputExt`][54] options.

Before being compared to babel's output, this file's contents will have
whitespace trimmed and line endings [converted][58].

Note that this file cannot appear in the same directory as [`exec.js`][59].

##### `exec.js`

This file's contents will be used as the input into babel at transform time just
like the [`code.js`][60] file, except the output will be _evaluated_ in the
[same _CJS_ context][62] as the test runner itself, meaning it supports features
like a/sync IIFEs, debugging breakpoints (!), and has access to mocked modules,
`expect`, `require`, `__dirname` and `__filename` (derived from this file's
path), and other globals/features provided by your test framework. However, the
context does not support _`import`, top-level await, or any other ESM syntax_.
Hence, while any file extension can be used (e.g. `.ts`, `.vue`, `.jsx`), this
file will always be evaluated as CJS.

The test will always pass unless an exception is thrown (e.g. when an `expect()`
fails).

Use this to make advanced assertions on the output. For example, to test that
[babel-plugin-proposal-throw-expressions][63] actually throws, your `exec.js`
file might contain:

```javascript
expect(() => throw new Error('throw expression')).toThrow('throw expression');
```

> \[!CAUTION]
>
> Keep in mind that, despite sharing a global context, execution will occur in a
> [separate realm][64], which means native/intrinsic types will be different.
> This can lead to unexpectedly failing tests. For example:
>
> ```javascript
> expect(require(`${__dirname}/imported-file.json`)).toStrictEqual({
>   data: 'imported'
> });
> ```
>
> This may fail in some test frameworks with the message "serializes to the same
> string". This is because the former object's `Object` prototype comes from a
> different realm than the second object's `Object` prototype, meaning the two
> objects are not technically _strictly_ equal. However, something like the
> following, which creates two objects in the same realm, will pass:
>
> ```javascript
> expect(
>   Object.fromEntries(
>     Object.entries(require(`${__dirname}/imported-file.json`))
>   )
> ).toStrictEqual({ data: 'imported' });
> ```
>
> Or use `JSON.stringify` + `toBe` (or your testing framework's equivalent):
>
> ```javascript
> expect(JSON.stringify(require(`${__dirname}/imported-file.json`))).toBe(
>   JSON.stringify({ data: 'imported' })
> );
> ```
>
> Or use `isEqual` (or your testing framework's equivalent):
>
> ```javascript
> expect(require(`${__dirname}/imported-file.json`)).toEqual({
>   data: 'imported'
> });
> ```

After being transformed by babel but before being evaluated, the babel output
will have whitespace trimmed, line endings [converted][58], and then get
[formatted by prettier][41].

Note that this file cannot appear in the same directory as [`code.js`][60] or
[`output.js`][57]. If more than one `exec.*` file exists in a directory, the
first one will be used and the rest will be silently ignored.

##### `options.json` (Or `options.js`)

For each fixture, the contents of the entirely optional `options.json` file are
[`lodash.mergeWith`][lodash.mergewith]'d with the options provided to
babel-plugin-tester, with the former taking precedence. Note that arrays will be
concatenated and explicitly undefined values will unset previously defined
values during merging.

For added flexibility, `options.json` can be specified as `options.js` instead
so long as a JSON object is exported via [`module.exports`][65]. If both files
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
([`lodash.mergeWith`][lodash.mergewith]) those from the [`babelOptions`][66]
option provided to babel-plugin-tester.

Note that arrays will be concatenated, explicitly undefined values will unset
previously defined values, and (as of `babel-plugin-tester@>=12`) duplicate
plugin/preset configurations will override each other (last configuration wins)
during merging.

###### `pluginOptions`

This is used to pass options into your plugin at transform time. Properties
specified here override ([`lodash.mergeWith`][lodash.mergewith]) those from the
[`pluginOptions`][14] option provided to babel-plugin-tester. Note that arrays
will be concatenated and explicitly undefined values will unset previously
defined values during merging.

Unlike with babel-plugin-tester's options, you can safely mix plugin-specific
properties (like `pluginOptions`) with preset-specific properties (like
[`presetOptions`][22]) in your options files.

###### `presetOptions`

This is used to pass options into your preset at transform time. Properties
specified here override ([`lodash.mergeWith`][lodash.mergewith]) those from the
[`presetOptions`][12] option provided to babel-plugin-tester. Note that arrays
will be concatenated and explicitly undefined values will unset previously
defined values during merging.

Unlike with babel-plugin-tester's options, you can safely mix plugin-specific
properties (like [`pluginOptions`][20]) with preset-specific properties (like
`presetOptions`) in your options files.

###### `title`

If provided, this will be used as the title of the test. Otherwise, the
directory name will be used as the title by default (with spaces replacing
dashes).

###### `only`

Use this to run only the specified fixture. Useful while developing to help
focus on a small number of fixtures. Can be used in multiple `options.json`
files.

> \[!IMPORTANT]
>
> Requires [Jest][67], an equivalent interface (like [Vitest][5]), or a
> manually-defined `it` object exposing an appropriate [`only`][68] method.

###### `skip`

Use this to skip running the specified fixture. Useful for when you are working
on a feature that is not yet supported. Can be used in multiple `options.json`
files.

> \[!IMPORTANT]
>
> Requires [Jest][67], an equivalent interface (like [Vitest][5]), or a
> manually-defined `it` object exposing an appropriate [`skip`][69] method.

###### `throws`

> \[!IMPORTANT]
>
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

> \[!CAUTION]
>
> Be careful using `instanceof` [across realms][70] as it can lead to [strange
> behavior][71] with [frontend frames/windows][72] and with tools that rely on
> [Node's VM module][73] (like Jest).

If the value of `throws` is a class, that class must [be a subtype of
`Error`][74] or the behavior of babel-plugin-tester is undefined.

Note that this property cannot be present when using an [`exec.js`][59] or
[`output.js`][57] file or when using the [`outputRaw`][75] option.

> \[!NOTE]
>
> For backwards compatibility reasons, `throws` is synonymous with `error`. They
> can be used interchangeably, with `throws` taking precedence.

###### `setup`

> \[!IMPORTANT]
>
> As it requires a function value, this property must be used in `options.js`
> instead of `options.json`.

This function will be run before a particular fixture's tests are run. It can
return a function which will be treated as a [`teardown`][76] function. It can
also return a promise. If that promise resolves to a function, that will be
treated as a [`teardown`][76] function.

This function, if provided, will run _after_ any [`setup`][49] function provided
as a babel-plugin-tester option. See [here][48] for the complete run order.

###### `teardown`

> \[!IMPORTANT]
>
> As it requires a function value, this property must be used in `options.js`
> instead of `options.json`.

This function will be run after a fixture's tests finish running. You can define
this via `teardown` or you can return it from the [`setup`][77] function. This
can likewise return a promise if it is asynchronous.

This function, if provided, will be run _after_ any teardown function returned
by the [`setup`][77] property, both of which will run _before_ any
[`teardown`][47] function provided as a babel-plugin-tester option. See
[here][48] for the complete run order.

###### `formatResult`

> \[!IMPORTANT]
>
> As it requires a function value, this property must be used in `options.js`
> instead of `options.json`.

This function is used to format all babel outputs, and defaults to a function
that invokes [prettier][50]. If a prettier configuration file is [found][51],
then that will be used. Otherwise, prettier will use its own default
configuration.

You can also [entirely disable formatting][41].

This will override the [`formatResult`][78] function provided to
babel-plugin-tester.

###### `outputRaw`

> \[!WARNING]
>
> This feature is only available in `babel-plugin-tester@>=12`.

> \[!IMPORTANT]
>
> As it requires a function value, this property must be used in `options.js`
> instead of `options.json`.

This option is similar in intent to [`output.js`][57] except it tests against
the _entire [`BabelFileResult`][79] object_ returned by [babel's `transform`
function][80] instead of only the `code` property of [`BabelFileResult`][79].

`outputRaw` must be a function with the following signature:

```typescript
outputRaw: (output: BabelFileResult) => void
```

Where the `output` parameter is an instance of [`BabelFileResult`][79]:

```typescript
interface BabelFileResult {
  ast?: Node | undefined;
  code?: string | undefined;
  ignored?: boolean | undefined;
  map?: object | undefined;
  metadata?: BabelFileMetadata | undefined;
}
```

So long as the `outputRaw` function does not throw, it will never cause the test
to fail. On the other hand, if the `outputRaw` function throws, such as when
`expect(output.metadata).toStrictEqual({ ... })` fails, the test will fail
regardless of other options.

The `output` parameter is not trimmed, converted, stripped, or modified at all.

Note that `outputRaw` does not _replace_ [`output.js`][57] etc, it only adds
additional (custom) expectations to your test. Further note that this option
_can_ appear alongside any other [`fixtures`][37] option except [`throws`][81].

###### `fixtureOutputName`

Use this to provide your own fixture output file name. Defaults to `"output"`.

###### `fixtureOutputExt`

Use this to provide your own fixture output file extension. Including the
leading period is optional; that is: if you want `output.jsx`,
`fixtureOutputExt` can be set to either `"jsx"` or `".jsx"`. If omitted, the
[input fixture][60]'s file extension will be used instead.

This is particularly useful if you are testing TypeScript input.

#### `tests`

There are two ways to create tests: using the [`fixtures`][37] option that
leverages the filesystem or using the `tests` option described here. Both can be
used simultaneously.

Using the `tests` option, you can provide [test objects][44] describing your
expected transformations. You can provide `tests` as an object of test objects
or an array of test objects. If you provide an object, the object's keys will be
used as the default title of each test. If you provide an array, each test's
default title will be derived from its index and
[`pluginName`][13]/[`presetName`][11].

See [the example][82] for more details.

##### Test Objects

A minimal test object can be:

1. A `string` representing [code][83].
2. An `object` with a [`code`][83] property.

What follows are the properties you may use if you provide an object, most of
which are optional:

###### `babelOptions`

This is used to configure babel. Properties specified here override
([`lodash.mergeWith`][lodash.mergewith]) those from the [`babelOptions`][66]
option provided to babel-plugin-tester.

Note that arrays will be concatenated, explicitly undefined values will unset
previously defined values, and (as of `babel-plugin-tester@>=12`) duplicate
plugin/preset configurations will override each other (last configuration wins)
during merging.

###### `pluginOptions`

This is used to pass options into your plugin at transform time. Properties
specified here override ([`lodash.mergeWith`][lodash.mergewith]) those from the
[`pluginOptions`][14] option provided to babel-plugin-tester. Note that arrays
will be concatenated and explicitly undefined values will unset previously
defined values during merging.

Unlike with babel-plugin-tester's options, you can safely mix plugin-specific
properties (like `pluginOptions`) with preset-specific properties (like
[`presetOptions`][21]) in your test objects.

###### `presetOptions`

This is used to pass options into your preset at transform time. Properties
specified here override ([`lodash.mergeWith`][lodash.mergewith]) those from the
[`presetOptions`][12] option provided to babel-plugin-tester. Note that arrays
will be concatenated and explicitly undefined values will unset previously
defined values during merging.

Unlike with babel-plugin-tester's options, you can safely mix plugin-specific
properties (like [`pluginOptions`][19]) with preset-specific properties (like
`presetOptions`) in your test objects.

###### `title`

If provided, this will be used as the title of the test. Otherwise, the title
will be determined from test object by default.

###### `only`

Use this to run only the specified test. Useful while developing to help focus
on a small number of tests. Can be used on multiple tests.

> \[!IMPORTANT]
>
> Requires [Jest][67], an equivalent interface (like [Vitest][5]), or a
> manually-defined `it` object exposing an appropriate [`only`][68] method.

###### `skip`

Use this to skip running the specified test. Useful for when you are working on
a feature that is not yet supported. Can be used on multiple tests.

> \[!IMPORTANT]
>
> Requires [Jest][67], an equivalent interface (like [Vitest][5]), or a
> manually-defined `it` object exposing an appropriate [`skip`][69] method.

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

> \[!CAUTION]
>
> Be careful using `instanceof` [across realms][70] as it can lead to [strange
> behavior][71] with [frontend frames/windows][72] and with tools that rely on
> [Node's VM module][73] (like Jest).

If the value of `throws` is a class, that class must [be a subtype of
`Error`][74] or the behavior of babel-plugin-tester is undefined.

Note that this property cannot be present when using the [`output`][84],
[`outputRaw`][85], [`outputFixture`][39], [`exec`][86], [`execFixture`][40], or
[`snapshot`][52] properties.

> \[!NOTE]
>
> For backwards compatibility reasons, `throws` is synonymous with `error`. They
> can be used interchangeably, with `throws` taking precedence.

###### `setup`

This function will be run before a particular test is run. It can return a
function which will be treated as a [`teardown`][87] function. It can also
return a promise. If that promise resolves to a function, that will be treated
as a [`teardown`][87] function.

This function, if provided, will run _after_ any [`setup`][49] function provided
as a babel-plugin-tester option. See [here][48] for the complete run order.

###### `teardown`

This function will be run after a test finishes running. You can define this via
`teardown` or you can return it from the [`setup`][88] function. This can
likewise return a promise if it is asynchronous.

This function, if provided, will be run _after_ any teardown function returned
by the [`setup`][88] property, both of which will run _before_ any
[`teardown`][47] function provided as a babel-plugin-tester option. See
[here][48] for the complete run order.

###### `formatResult`

This function is used to format all babel outputs, and defaults to a function
that invokes [prettier][50]. If a prettier configuration file is [found][51],
then that will be used. Otherwise, prettier will use its own default
configuration.

You can also [entirely disable formatting][41].

This will override the [`formatResult`][78] function provided to
babel-plugin-tester.

###### `snapshot`

If you would prefer to take a snapshot of babel's output rather than compare it
to something you provide manually, specify `snapshot: true`. This will cause
babel-plugin-tester to generate a snapshot containing both the [source code][83]
and babel's output.

Defaults to `false`.

Note that this property cannot appear in the same test object as the
[`output`][84], [`outputFixture`][39], [`exec`][86], [`execFixture`][40], or
[`throws`][81] properties. However, it _can_ be used with [`outputRaw`][85].

> \[!IMPORTANT]
>
> Requires [Jest][67], an [appropriate shim][89] or equivalent interface (like
> [Vitest][5]), or a manually-defined `expect` object exposing an appropriate
> [`toMatchSnapshot`][90] method.

###### `code`

The code that you want babel to transform using your plugin or preset. This must
be provided unless you are using the [`codeFixture`][38] or [`exec`][86]
properties instead. If you do not provide the [`output`][84] or
[`outputFixture`][39] properties, and [`snapshot`][52] is not truthy, then the
assertion is that this code is unchanged by the transformation.

Before being transformed by babel, any indentation will be stripped as a
convenience for template literals. After being transformed, the resulting output
will have whitespace trimmed, line endings [converted][58], and then get
[formatted by prettier][41].

Note that this property cannot appear in the same test object as the
[`codeFixture`][38], [`exec`][86], or [`execFixture`][40] properties.

###### `output`

The value of this property will be compared with the output from [babel's
`transform` function][80].

Before being compared to babel's output, this value will have whitespace
trimmed, line endings [converted][58], and any indentation stripped as a
convenience for template literals.

Note that this property cannot appear in the same test object as the
[`outputFixture`][39], [`exec`][86], [`execFixture`][40], [`throws`][81], or
[`snapshot`][52] properties. However, it _can_ be used with [`outputRaw`][85].

###### `outputRaw`

> \[!WARNING]
>
> This feature is only available in `babel-plugin-tester@>=12`.

This property is similar to [`output`][84] and related properties except it
tests against the _entire [`BabelFileResult`][79] object_ returned by [babel's
`transform` function][80] instead of only the `code` property of
[`BabelFileResult`][79].

`outputRaw` must be a function with the following signature:

```typescript
outputRaw: (output: BabelFileResult) => void
```

Where the `output` parameter is an instance of [`BabelFileResult`][79]:

```typescript
interface BabelFileResult {
  ast?: Node | undefined;
  code?: string | undefined;
  ignored?: boolean | undefined;
  map?: object | undefined;
  metadata?: BabelFileMetadata | undefined;
}
```

So long as the `outputRaw` function does not throw, this property will never
cause the test to fail. On the other hand, if the `outputRaw` function throws,
such as when `expect(output.metadata).toStrictEqual({ ... })` fails, the test
will fail regardless of other properties.

The `output` parameter is not trimmed, converted, stripped, or modified at all.

Note that `outputRaw` does not _replace_ [`output`][84] etc, it only adds
additional (custom) expectations to your test. Further note that `outputRaw`
_can_ appear in the same test object as any other property except
[`throws`][81].

###### `exec`

The provided source will be transformed just like the [`code`][83] property,
except the output will be _evaluated_ in the [same _CJS_ context][62] as the
test runner itself, meaning it supports features like a/sync IIFEs, debugging
breakpoints (!), and has access to mocked modules, `expect`, `require`,
`__dirname` and `__filename` (derived from available path info and falling back
on [`filepath`][56]), and other globals/features provided by your test
framework. However, the context does not support _`import`, top-level await, or
any other ESM syntax_. Hence, while any file extension can be used (e.g. `.ts`,
`.vue`, `.jsx`), this file will always be evaluated as CJS.

The test will always pass unless an exception is thrown (e.g. when an `expect()`
fails).

Use this to make advanced assertions on the output. For example, you can test
that [babel-plugin-proposal-throw-expressions][63] actually throws using the
following:

```javascript
{
  // ...
  exec: `
    expect(() => throw new Error('throw expression')).toThrow('throw expression');
  `;
}
```

> \[!CAUTION]
>
> Keep in mind that, despite sharing a global context, execution will occur in a
> [separate realm][64], which means native/intrinsic types will be different.
> This can lead to unexpectedly failing tests. For example:
>
> ```javascript
> expect(require(`${__dirname}/imported-file.json`)).toStrictEqual({
>   data: 'imported'
> });
> ```
>
> This may fail in some test frameworks with the message "serializes to the same
> string". This is because the former object's `Object` prototype comes from a
> different realm than the second object's `Object` prototype, meaning the two
> objects are not technically _strictly_ equal. However, something like the
> following, which creates two objects in the same realm, will pass:
>
> ```javascript
> expect(
>   Object.fromEntries(
>     Object.entries(require(`${__dirname}/imported-file.json`))
>   )
> ).toStrictEqual({ data: 'imported' });
> ```
>
> Or use `JSON.stringify` + `toBe` (or your testing framework's equivalent):
>
> ```javascript
> expect(JSON.stringify(require(`${__dirname}/imported-file.json`))).toBe(
>   JSON.stringify({ data: 'imported' })
> );
> ```
>
> Or use `isEqual` (or your testing framework's equivalent):
>
> ```javascript
> expect(require(`${__dirname}/imported-file.json`)).toEqual({
>   data: 'imported'
> });
> ```

After being transformed by babel but before being evaluated, the babel output
will have whitespace trimmed, line endings [converted][58], and then get
[formatted by prettier][41].

Note that this property cannot appear in the same test object as the
[`execFixture`][40], [`code`][83], [`codeFixture`][38], [`output`][84],
[`outputFixture`][39], [`throws`][81], or [`snapshot`][52] properties. However,
it _can_ be used with [`outputRaw`][85].

###### `codeFixture`

If you would rather put your [`code`][83] in a separate file, you can specify a
file path here instead. If it is an absolute path, then that's the file that
will be loaded. Otherwise, `codeFixture` will be [`path.join`][42]'d with the
[directory name][43] of [`filepath`][56].

After being transformed by babel, the resulting output will have whitespace
trimmed, line endings [converted][58], and then get [formatted by prettier][41].

Like [`code`][83], this property cannot appear in the same test object as the
[`exec`][86] or [`execFixture`][40] properties, nor the [`code`][83] property.

> \[!TIP]
>
> If you find you are using this property more than a couple of times, consider
> using [`fixtures`][37] instead.

> \[!NOTE]
>
> For backwards compatibility reasons, `codeFixture` is synonymous with
> `fixture`. They can be used interchangeably, though care must be taken not to
> confuse the test object property `fixture` with the babel-plugin-tester option
> [_`fixtures`_][37], the latter being plural.

###### `outputFixture`

If you would rather put your [`output`][84] in a separate file, you can specify
a file path here instead. If it is an absolute path, then that's the file that
will be loaded. Otherwise, `outputFixture` will be [`path.join`][42]'d with the
[directory name][43] of [`filepath`][56].

Before being compared to babel's output, this file's contents will have
whitespace trimmed and line endings [converted][58].

Like [`output`][84], this property cannot appear in the same test object as the
[`exec`][86], [`execFixture`][40], [`throws`][81], or [`snapshot`][52]
properties, nor the [`output`][84] property. However, it _can_ be used with
[`outputRaw`][85].

> \[!TIP]
>
> If you find you are using this property more than a couple of times, consider
> using [`fixtures`][37] instead.

###### `execFixture`

If you would rather put your [`exec`][86] in a separate file, you can specify a
file path here instead. If it is an absolute path, then that's the file that
will be loaded. Otherwise, `execFixture` will be [`path.join`][42]'d with the
[directory name][43] of [`filepath`][56].

After being transformed by babel but before being evaluated, the babel output
will have whitespace trimmed, line endings [converted][58], and then get
[formatted by prettier][41].

Like [`exec`][86], this property cannot appear in the same test object as the
[`code`][83], [`codeFixture`][38], [`output`][84], [`outputFixture`][39],
[`throws`][81], or [`snapshot`][52] properties, nor the [`exec`][86] property.
However, it _can_ be used with [`outputRaw`][85].

> \[!TIP]
>
> If you find you are using this property more than a couple of times, consider
> using [`fixtures`][37] instead.

## Examples

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
  // Defaults to false, but with this line we set the default to true across
  // *all* tests.
  snapshot: true,
  tests: [
    {
      code: "'hello';"
      // Snapshot should show that prettier has changed the single quotes to
      // double quotes (using prettier's default configuration).
    },
    {
      // This test will pass if and only if code has not changed.
      code: '"hello";'
      // To prevent false negatives (like with reckless use of `npx jest -u`),
      // snapshots of code that does not change are forbidden. Snapshots
      // succeed only when babel output !== code input.
      snapshot: false;
    },
    {
      code: 'var hello = "hi";',
      output: 'var olleh = "hi";',
      // You can't take a snapshot and also manually specify an output string.
      // It's either one or the other.
      snapshot: false
    },
    // A valid test can be a test object or a simple string.
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

  // Defaults to false but we're being explicit here: do not use snapshots
  // across all tests. Note that snapshots are only guaranteed to work with
  // Jest.
  snapshot: false,

  // Defaults to a function that formats with prettier.
  formatResult: customFormatFunction,

  // You can provide tests as an object:
  tests: {
    // The key is the title. The value is the code that is unchanged (because
    // snapshot === false across all tests). Test title will be: "1. does not
    // change code with no identifiers".
    'does not change code with no identifiers': '"hello";',

    // Test title will be: "2. changes this code".
    'changes this code': {
      // Input to the plugin.
      code: 'var hello = "hi";',
      // Expected output.
      output: 'var olleh = "hi";'
    }
  },

  // Alternatively, you can provide tests as an array:
  tests: [
    // Should be unchanged by the plugin (because snapshot === false across all
    // tests). Test title will be: "1. identifier reverse".
    '"hello";',
    {
      // Test title will be: "2. identifier reverse".
      code: 'var hello = "hi";',
      output: 'var olleh = "hi";'
    },
    {
      // Test title will be: "3. unchanged code".
      title: 'unchanged code',
      // Because this is an absolute path, the filepath option above will not
      // be used to resolve this path.
      codeFixture: path.join(
        __dirname,
        '..',
        'fixtures',
        'codeFixture-unchanging.js'
      )
      // No output, outputFixture, or snapshot, so the assertion will be that
      // the plugin does not change this code.
    },
    {
      // Because these are not absolute paths, they will be joined with the
      // directory of the filepath option provided above.
      codeFixture: path.join('..', 'fixtures', 'codeFixture.js'),
      // Because outputFixture is provided, the assertion will be that the
      // plugin will change the contents of "codeFixture.js" to the contents of
      // "outputFixture.js".
      outputFixture: path.join('..', 'fixtures', 'outputFixture.js')
    },
    {
      // As a convenience, this will have the indentation striped and it will
      // be trimmed.
      code: `
        function sayHi(person) {
          return 'Hello ' + person + '!';
        }
      `,
      // This will take a Jest snapshot, overwriting the default/global
      // settings (set above). The snapshot will contain both source code and
      // the transformed output, making the snapshot file easier to understand.
      snapshot: true
    },
    {
      code: 'var hello = "hi";',
      output: 'var olleh = "hi";',
      // This can be used to overwrite pluginOptions (set above).
      pluginOptions: {
        optionA: false
      }
      // This can be used to overwrite presetOptions (set above).
      //presetOptions: {
      //  optionB: true
      //}
    },
    {
      title: 'unchanged code',
      code: '"no change";',
      setup() {
        // Runs before this test.
        return function teardown() {
          // Runs after this tests.
        };
        // Can also return a promise.
      },
      teardown() {
        // Runs after this test.
        // Can return a promise.
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

### Fixtures Examples

See [`fixtures`][37] for an example directory layout or check out the use of
babel-plugin-tester fixtures in some of these other projects:

<!-- lint disable list-item-style -->

- [babel-plugin-transform-rewrite-imports][91]
- [babel-plugin-explicit-exports-references][92]
- [babel-plugin-transform-default-named-imports][93]

<!-- lint enable list-item-style -->
<!-- symbiote-template-region-start 5 -->

## Appendix

<!-- symbiote-template-region-end -->

Further documentation can be found under [`docs/`][x-repo-docs].

### Testing Framework Compatibility

This package was originally tested on and built to work with [Jest][1], but it
is also [tested][94] against [Vitest][5], [Mocha][2], [Jasmine][3], and
[`node:test`][4]. See below for details.

#### Jest

All babel-plugin-tester features work with Jest. No further action is necessary
🚀

#### Vitest

All babel-plugin-tester features work with Vitest, though Vitest does not
provide global APIs by default. You can either supply some interoperability code
(see Jasmine or `node:test` below for an example) or run Vitest with the
[`--globals` CLI option][95].

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

[`babelOptions.babelrc`][29] and [`babelOptions.configFile`][30] are set to
`false` by default. This way, you can [manually import (or provide an object
literal)][66] the exact configuration you want to apply rather than relying on
babel's [somewhat complex configuration loading rules][96]. However, if your
plugin, preset, or project relies on a complicated external setup to do its
work, and you do not mind the [default run order][97], you can leverage [babel's
automatic configuration loading][98] via the `babelOptions.babelrc` and/or
`babelOptions.configFile` options.

> \[!TIP]
>
> Fixtures provided via the [`fixtures`][37] option **do not** need to provide a
> separate `babelOptions.filename` since it will be set automatically. This
> section only applies to [test objects][44].

When relying on `babelOptions.babelrc`, you must also provide a
[`babelOptions.filename`][99] for each test object that does not include a
[`codeFixture`][38] or [`execFixture`][40] property. For example:

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
you want for `filename` as long as the `.babelrc` file is [resolved][100]
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

Inferring [`pluginName`][13] during testing requires invoking [the plugin][10]
_at least twice_: once outside of babel to check for the plugin's name and then
again when run by babel. This is irrelevant to babel-plugin-tester (even if your
plugin crashes when run outside of babel) and to the overwhelming majority of
babel plugins in existence. This only becomes a problem if your plugin is
_aggressively stateful_, which is against the [babel handbook on plugin
design][101].

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

By default, a [formatter][78] is used which formats all babel output with
[prettier][50]. It will [look for][51] a prettier configuration file relative to
[the file that's being tested][56] or the [current working directory][102]. If
it cannot find one, then it uses the default configuration for prettier.

This makes your snapshots easier to read and your expectations easier to write,
but if you would like to disable this feature, you can either use the [`pure`
import][103] to disable automatic formatting (along with snapshot serialization)
or you can override the `formatResult` option manually like so:

```javascript
pluginTester({
  // ...
  formatResult: (r) => r
  // ...
});
```

### Built-In Debugging Support

This package uses [debug][104] under the hood. To view all possible debugging
output, including the results of all babel transformations, set the
`DEBUG='babel-plugin-tester,babel-plugin-tester:*'` [environment variable][105]
when running your tests.

For example:

```bash
# Those using Windows (but not WSL) have to set environment variable differently
NODE_ENV='test' DEBUG='babel-plugin-tester,babel-plugin-tester:*' DEBUG_DEPTH='1' npx jest
```

#### Available Debug Namespaces

The following [debug namespaces][106] are available for activation:

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
    - `babel-plugin-tester:tester:finalize:order`
    - `babel-plugin-tester:tester:finalize:duplicates`

<!-- lint enable list-item-style -->

The `babel-plugin-tester:tester` namespace and its sub-namespaces each have an
additional `verbose` sub-namespace that can be activated or deactivated at will,
e.g. `babel-plugin-tester:tester:verbose` and
`babel-plugin-tester:tester:wrapper:verbose`.

For example, to view all debug output except verbose output:

```bash
# Those using Windows (but not WSL) have to set environment variable differently
NODE_ENV='test' DEBUG='babel-plugin-tester,babel-plugin-tester:*,-*:verbose' npx jest
```

### `TEST_ONLY`/`TEST_NUM_ONLY` and `TEST_SKIP`/`TEST_NUM_SKIP` Environment Variables

The optional `TEST_ONLY` and `TEST_SKIP` environment variables are recognized by
babel-plugin-tester, allowing you to control which tests are run in an adhoc
fashion without having to modify your test configuration code.

The values of these variables will be transformed into regular expressions via
`RegExp(value, 'u')` and matched against each test/fixture title (not including
[automatically assigned numbers][55] prefixed to titles). Tests with titles that
match `TEST_ONLY` will be run while all others are skipped. On the other hand,
tests with titles that match `TEST_SKIP` will be skipped while others are run.

For example, to skip the test titled "this is the name of a failing unit test":

```bash
TEST_SKIP='name of a failing' npx jest
```

Given both `TEST_ONLY` and `TEST_SKIP`, tests matched by `TEST_SKIP` will
_always_ be skipped, even if they are also matched by `TEST_ONLY`. These
environment variables also override both the fixture-specific
[`skip`][107]/[`only`][108] and test object [`skip`][109]/[`only`][110]
properties.

In addition to `TEST_ONLY` and `TEST_SKIP`, you can also target tests
specifically by their [automatically assigned number][55] using `TEST_NUM_ONLY`
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

`TEST_NUM_ONLY` and `TEST_NUM_SKIP` are meaningless if [`titleNumbering`][55] is
`false` or your tests are otherwise unnumbered, and may match multiple tests if
[automatic numbering is restarted][111].

### `setup` and `teardown` Run Order

For each test object and fixture test, setup and teardown functions are run in
the following order:

1. [Base `setup`][49].
2. [Test object `setup`][88] / [fixture `setup`][77].
3. _Test object / fixture test is run_.
4. Any function returned by test object `setup` / fixture `setup`.
5. [Test object `teardown`][87] / [fixture `teardown`][76].
6. Any function returned by base `setup`.
7. [Base `teardown`][47].

<!-- symbiote-template-region-start 6 -->

### Published Package Details

This is a [CJS2 package][x-pkg-cjs-mojito] with statically-analyzable exports
built by Babel for use in Node.js versions that are not end-of-life. For
TypeScript users, this package supports both `"Node10"` and `"Node16"` module
resolution strategies.

<!-- symbiote-template-region-end -->
<!-- TODO: optional additional details here -->
<!-- symbiote-template-region-start 7 -->

<details><summary>Expand details</summary>

That means both CJS2 (via `require(...)`) and ESM (via `import { ... } from ...`
or `await import(...)`) source will load this package from the same entry points
when using Node. This has several benefits, the foremost being: less code
shipped/smaller package size, avoiding [dual package
hazard][x-pkg-dual-package-hazard] entirely, distributables are not
packed/bundled/uglified, a drastically less complex build process, and CJS
consumers aren't shafted.

Each entry point (i.e. `ENTRY`) in [`package.json`'s
`exports[ENTRY]`][x-repo-package-json] object includes one or more [export
conditions][x-pkg-exports-conditions]. These entries may or may not include: an
[`exports[ENTRY].types`][x-pkg-exports-types-key] condition pointing to a type
declaration file for TypeScript and IDEs, a
[`exports[ENTRY].module`][x-pkg-exports-module-key] condition pointing to
(usually ESM) source for Webpack/Rollup, a `exports[ENTRY].node` and/or
`exports[ENTRY].default` condition pointing to (usually CJS2) source for Node.js
`require`/`import` and for browsers and other environments, and [other
conditions][x-pkg-exports-conditions] not enumerated here. Check the
[package.json][x-repo-package-json] file to see which export conditions are
supported.

Note that, regardless of the [`{ "type": "..." }`][x-pkg-type] specified in
[`package.json`][x-repo-package-json], any JavaScript files written in ESM
syntax (including distributables) will always have the `.mjs` extension. Note
also that [`package.json`][x-repo-package-json] may include the
[`sideEffects`][x-pkg-side-effects-key] key, which is almost always `false` for
optimal [tree shaking][x-pkg-tree-shaking] where appropriate.

<!-- symbiote-template-region-end -->
<!-- TODO: optional additional details here -->
<!-- symbiote-template-region-start 8 -->

</details>

### License

<!-- symbiote-template-region-end -->

See [LICENSE][x-repo-license].

<!-- symbiote-template-region-start 9 -->

## Contributing and Support

**[New issues][x-repo-choose-new-issue] and [pull requests][x-repo-pr-compare]
are always welcome and greatly appreciated! 🤩** Just as well, you can [star 🌟
this project][x-badge-repo-link] to let me know you found it useful! ✊🏿 Or [buy
me a beer][x-repo-sponsor], I'd appreciate it. Thank you!

See [CONTRIBUTING.md][x-repo-contributing] and [SUPPORT.md][x-repo-support] for
more information.

<!-- symbiote-template-region-end -->

### Inspiration

The API was inspired by:

- ESLint's [RuleTester][ruletester].
- [@thejameskyle][112]'s [tweet][jamestweet].
- Babel's own
  [`@babel/helper-plugin-test-runner`][@babel/helper-plugin-test-runner].

<!-- symbiote-template-region-start 10 -->

### Contributors

<!-- symbiote-template-region-end -->
<!-- symbiote-template-region-start root-package-only -->
<!-- remark-ignore-start -->
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-31-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->
<!-- remark-ignore-end -->

Thanks goes to these wonderful people ([emoji
key][x-repo-all-contributors-emojis]):

<!-- remark-ignore-start -->
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->

<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://kentcdodds.com"><img src="https://avatars.githubusercontent.com/u/1500684?v=3?s=100" width="100px;" alt="Kent C. Dodds"/><br /><sub><b>Kent C. Dodds</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kentcdodds" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kentcdodds" title="Documentation">📖</a> <a href="#infra-kentcdodds" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kentcdodds" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://xunn.io"><img src="https://avatars.githubusercontent.com/u/656017?v=4?s=100" width="100px;" alt="Bernard"/><br /><sub><b>Bernard</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=Xunnamius" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=Xunnamius" title="Tests">⚠️</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=Xunnamius" title="Documentation">📖</a> <a href="#infra-Xunnamius" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/babel-utils/babel-plugin-tester/pulls?q=is%3Apr+reviewed-by%3AXunnamius" title="Reviewed Pull Requests">👀</a> <a href="#maintenance-Xunnamius" title="Maintenance">🚧</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://thejameskyle.com/"><img src="https://avatars3.githubusercontent.com/u/952783?v=3?s=100" width="100px;" alt="james kyle"/><br /><sub><b>james kyle</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=jamiebuilds" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=jamiebuilds" title="Documentation">📖</a> <a href="https://github.com/babel-utils/babel-plugin-tester/pulls?q=is%3Apr+reviewed-by%3Ajamiebuilds" title="Reviewed Pull Requests">👀</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=jamiebuilds" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/bbohen"><img src="https://avatars1.githubusercontent.com/u/1894628?v=3?s=100" width="100px;" alt="Brad Bohen"/><br /><sub><b>Brad Bohen</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/issues?q=author%3Abbohen" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://www.krwelch.com"><img src="https://avatars0.githubusercontent.com/u/1295580?v=3?s=100" width="100px;" alt="Kyle Welch"/><br /><sub><b>Kyle Welch</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kwelch" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kwelch" title="Documentation">📖</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kwelch" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/kontrollanten"><img src="https://avatars3.githubusercontent.com/u/6680299?v=4?s=100" width="100px;" alt="kontrollanten"/><br /><sub><b>kontrollanten</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=kontrollanten" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/rubennorte"><img src="https://avatars3.githubusercontent.com/u/117921?v=4?s=100" width="100px;" alt="Rubén Norte"/><br /><sub><b>Rubén Norte</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=rubennorte" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=rubennorte" title="Tests">⚠️</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="http://andreneves.work"><img src="https://avatars2.githubusercontent.com/u/3869532?v=4?s=100" width="100px;" alt="André Neves"/><br /><sub><b>André Neves</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=andrefgneves" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=andrefgneves" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/merceyz"><img src="https://avatars0.githubusercontent.com/u/3842800?v=4?s=100" width="100px;" alt="Kristoffer K."/><br /><sub><b>Kristoffer K.</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=merceyz" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=merceyz" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lifeart"><img src="https://avatars2.githubusercontent.com/u/1360552?v=4?s=100" width="100px;" alt="Alex Kanunnikov"/><br /><sub><b>Alex Kanunnikov</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=lifeart" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=lifeart" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://solverfox.dev"><img src="https://avatars3.githubusercontent.com/u/12292047?v=4?s=100" width="100px;" alt="Sebastian Silbermann"/><br /><sub><b>Sebastian Silbermann</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=eps1lon" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://ololos.space/"><img src="https://avatars1.githubusercontent.com/u/3940079?v=4?s=100" width="100px;" alt="Andrey Los"/><br /><sub><b>Andrey Los</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/issues?q=author%3ARIP21" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/charlesbodman"><img src="https://avatars2.githubusercontent.com/u/231894?v=4?s=100" width="100px;" alt="Charles Bodman"/><br /><sub><b>Charles Bodman</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=charlesbodman" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://michaeldeboey.be"><img src="https://avatars3.githubusercontent.com/u/6643991?v=4?s=100" width="100px;" alt="Michaël De Boey"/><br /><sub><b>Michaël De Boey</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=MichaelDeBoey" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/yuyaryshev"><img src="https://avatars0.githubusercontent.com/u/18558421?v=4?s=100" width="100px;" alt="yuyaryshev"/><br /><sub><b>yuyaryshev</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=yuyaryshev" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/CzBuCHi"><img src="https://avatars0.githubusercontent.com/u/12444673?v=4?s=100" width="100px;" alt="Marek Buchar"/><br /><sub><b>Marek Buchar</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=CzBuCHi" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=CzBuCHi" title="Tests">⚠️</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=CzBuCHi" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://twitter.com/_jayphelps"><img src="https://avatars1.githubusercontent.com/u/762949?v=4?s=100" width="100px;" alt="Jay Phelps"/><br /><sub><b>Jay Phelps</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/pulls?q=is%3Apr+reviewed-by%3Ajayphelps" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.mathiassoeholm.com"><img src="https://avatars0.githubusercontent.com/u/1747242?v=4?s=100" width="100px;" alt="Mathias"/><br /><sub><b>Mathias</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=mathiassoeholm" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://go/moon"><img src="https://avatars.githubusercontent.com/u/40330875?v=4?s=100" width="100px;" alt="joe moon"/><br /><sub><b>joe moon</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=moon-stripe" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=moon-stripe" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/layershifter/"><img src="https://avatars.githubusercontent.com/u/14183168?v=4?s=100" width="100px;" alt="Oleksandr Fediashov"/><br /><sub><b>Oleksandr Fediashov</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/issues?q=author%3Alayershifter" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Andarist"><img src="https://avatars.githubusercontent.com/u/9800850?v=4?s=100" width="100px;" alt="Mateusz Burzyński"/><br /><sub><b>Mateusz Burzyński</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=Andarist" title="Code">💻</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/hulkish"><img src="https://avatars.githubusercontent.com/u/139332?v=4?s=100" width="100px;" alt="Steven Hargrove"/><br /><sub><b>Steven Hargrove</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=hulkish" title="Code">💻</a> <a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=hulkish" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/alexrhogue"><img src="https://avatars.githubusercontent.com/u/896170?v=4?s=100" width="100px;" alt="Alex R Hogue"/><br /><sub><b>Alex R Hogue</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=alexrhogue" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/infctr"><img src="https://avatars.githubusercontent.com/u/15550153?v=4?s=100" width="100px;" alt="Arthur Zahorski"/><br /><sub><b>Arthur Zahorski</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=infctr" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://egoist.dev/"><img src="https://avatars.githubusercontent.com/u/8784712?v=4?s=100" width="100px;" alt="EGOIST"/><br /><sub><b>EGOIST</b></sub></a><br /><a href="#infra-egoist" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://ifiokjr.com/"><img src="https://avatars.githubusercontent.com/u/1160934?v=4?s=100" width="100px;" alt="Ifiok Jr."/><br /><sub><b>Ifiok Jr.</b></sub></a><br /><a href="#platform-ifiokjr" title="Packaging/porting to new platform">📦</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://jan.buschtoens.me/"><img src="https://avatars.githubusercontent.com/u/834636?v=4?s=100" width="100px;" alt="Jan Buschtöns"/><br /><sub><b>Jan Buschtöns</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=buschtoens" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/malbernaz"><img src="https://avatars.githubusercontent.com/u/10574149?v=4?s=100" width="100px;" alt="Miguel Albernaz"/><br /><sub><b>Miguel Albernaz</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=malbernaz" title="Code">💻</a> <a href="#infra-malbernaz" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/peterlebrun"><img src="https://avatars.githubusercontent.com/u/1267171?v=4?s=100" width="100px;" alt="peterlebrun"/><br /><sub><b>peterlebrun</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/commits?author=peterlebrun" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/SimenB"><img src="https://avatars.githubusercontent.com/u/1404810?v=4?s=100" width="100px;" alt="Simen Bekkhus"/><br /><sub><b>Simen Bekkhus</b></sub></a><br /><a href="https://github.com/babel-utils/babel-plugin-tester/issues?q=author%3ASimenB" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ling1726"><img src="https://avatars.githubusercontent.com/u/20744592?v=4?s=100" width="100px;" alt="ling1726"/><br /><sub><b>ling1726</b></sub></a><br /><a href="#ideas-ling1726" title="Ideas, Planning, & Feedback">🤔</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->
<!-- remark-ignore-end -->

This project follows the [all-contributors][x-repo-all-contributors]
specification. Contributions of any kind welcome!

<!-- symbiote-template-region-end -->
<!-- symbiote-template-region-start workspace-package-only -->
<!-- (section elided by symbiote) -->
<!-- symbiote-template-region-end -->

[@babel/helper-plugin-test-runner]:
  https://github.com/babel/babel/tree/master/packages/babel-helper-plugin-test-runner
[jamestweet]: https://twitter.com/thejameskyle/status/864359438819262465
[lodash.mergewith]: https://lodash.com/docs/4.17.4#mergeWith
[ruletester]:
  http://eslint.org/docs/developer-guide/working-with-rules#rule-unit-tests
[x-badge-blm-image]: https://xunn.at/badge-blm 'Join the movement!'
[x-badge-blm-link]: https://xunn.at/donate-blm
[x-badge-codecov-image]:
  https://img.shields.io/codecov/c/github/babel-utils/babel-plugin-tester/main?style=flat-square&token=HWRIOBAAPW&flag=package.main_root
  'Is this package well-tested?'
[x-badge-codecov-link]: https://codecov.io/gh/babel-utils/babel-plugin-tester
[x-badge-downloads-image]:
  https://img.shields.io/npm/dm/babel-plugin-tester?style=flat-square
  'Number of times this package has been downloaded per month'
[x-badge-lastcommit-image]:
  https://img.shields.io/github/last-commit/babel-utils/babel-plugin-tester?style=flat-square
  'Latest commit timestamp'
[x-badge-license-image]:
  https://img.shields.io/npm/l/babel-plugin-tester?style=flat-square
  "This package's source license"
[x-badge-license-link]:
  https://github.com/babel-utils/babel-plugin-tester/blob/main/LICENSE
[x-badge-npm-image]:
  https://xunn.at/npm-pkg-version/babel-plugin-tester
  'Install this package using npm or yarn!'
[x-badge-npm-link]: https://npmtrends.com/babel-plugin-tester
[x-badge-repo-link]: https://github.com/babel-utils/babel-plugin-tester
[x-badge-semanticrelease-image]:
  https://xunn.at/badge-semantic-release
  'This repo practices continuous integration and deployment!'
[x-badge-semanticrelease-link]:
  https://github.com/semantic-release/semantic-release
[x-pkg-cjs-mojito]:
  https://dev.to/jakobjingleheimer/configuring-commonjs-es-modules-for-nodejs-12ed#publish-only-a-cjs-distribution-with-property-exports
[x-pkg-dual-package-hazard]:
  https://nodejs.org/api/packages.html#dual-package-hazard
[x-pkg-exports-conditions]:
  https://webpack.js.org/guides/package-exports#reference-syntax
[x-pkg-exports-module-key]:
  https://webpack.js.org/guides/package-exports#providing-commonjs-and-esm-version-stateless
[x-pkg-exports-types-key]:
  https://devblogs.microsoft.com/typescript/announcing-typescript-4-5-beta#packagejson-exports-imports-and-self-referencing
[x-pkg-side-effects-key]:
  https://webpack.js.org/guides/tree-shaking#mark-the-file-as-side-effect-free
[x-pkg-tree-shaking]: https://webpack.js.org/guides/tree-shaking
[x-pkg-type]:
  https://github.com/nodejs/node/blob/8d8e06a345043bec787e904edc9a2f5c5e9c275f/doc/api/packages.md#type
[x-repo-all-contributors]: https://github.com/all-contributors/all-contributors
[x-repo-all-contributors-emojis]: https://allcontributors.org/docs/en/emoji-key
[x-repo-choose-new-issue]:
  https://github.com/babel-utils/babel-plugin-tester/issues/new/choose
[x-repo-contributing]: /CONTRIBUTING.md
[x-repo-docs]: docs
[x-repo-license]: ./LICENSE
[x-repo-package-json]: package.json
[x-repo-pr-compare]: https://github.com/babel-utils/babel-plugin-tester/compare
[x-repo-sponsor]: https://github.com/sponsors/Xunnamius
[x-repo-support]: /.github/SUPPORT.md
[1]: https://jestjs.io
[2]: https://mochajs.org
[3]: https://jasmine.github.io
[4]: https://nodejs.org/api/test.html#test-runner
[5]: https://vitest.dev
[6]: #testing-framework-compatibility
[7]: https://www.npmjs.com/package/babel-plugin-tester?activeTab=versions
[8]: https://jestjs.io/docs/setup-teardown#one-time-setup
[9]: #preset
[10]: #plugin
[11]: #presetname
[12]: #presetoptions
[13]: #pluginname
[14]: #pluginoptions
[15]: https://jestjs.io/docs/api#describename-fn
[16]: https://jestjs.io/docs/api#testname-fn-timeout
[17]:
  https://github.com/DefinitelyTyped/DefinitelyTyped/blob/2b229cce80b334f673f1b26895007e9eca786366/types/babel-core/index.d.ts#L25
[18]: #pluginname-inference-caveat
[19]: #pluginoptions-2
[20]: #pluginoptions-1
[21]: #presetoptions-2
[22]: #presetoptions-1
[23]:
  https://github.com/babel-utils/babel-plugin-tester/blob/1b413417de0f8f07764ee31e6131cee3e16f1265/src/plugin-tester.ts#L24-L31
[24]: #babeloptions-2
[25]: #babeloptions-1
[26]:
  https://stackoverflow.com/questions/52798987/babel-7-fails-with-single-plugin-saying-duplicate-plugin-preset-detected
[27]: https://babeljs.io/docs/options#plugins
[28]: https://babeljs.io/docs/options#presets
[29]: https://babeljs.io/docs/en/options#babelrc
[30]: https://babeljs.io/docs/en/options#configfile
[31]: #using-babel-for-configuration-loading
[32]: https://babeljs.io/docs/en/configuration
[33]: https://babeljs.io/docs/en/options#plugins
[34]: https://babeljs.io/docs/en/presets
[35]: https://babeljs.io/docs/en/presets#preset-ordering
[36]: #tests
[37]: #fixtures
[38]: #codefixture
[39]: #outputfixture
[40]: #execfixture
[41]: #formatting-output-with-prettier
[42]: https://nodejs.org/api/path.html#pathjoinpaths
[43]: https://nodejs.org/api/path.html#pathdirnamepath
[44]: #test-objects
[45]: #invoke
[46]: https://github.com/babel/babel/issues/8921
[47]: #teardown
[48]: #setup-and-teardown-run-order
[49]: #setup
[50]: https://prettier.io
[51]: https://prettier.io/docs/en/configuration.html
[52]: #snapshot-1
[53]: #fixtureoutputname-1
[54]: #fixtureoutputext-1
[55]: #titlenumbering
[56]: #filepath
[57]: #outputjs
[58]: #endofline
[59]: #execjs
[60]: #codejs
[61]: #throws
[62]: https://nodejs.org/api/vm.html#vmruninthiscontextcode-options
[63]: https://babeljs.io/docs/en/babel-plugin-proposal-throw-expressions
[64]: https://weizman.github.io/page-what-is-a-realm-in-js
[65]: https://nodejs.org/api/modules.html#moduleexports
[66]: #babeloptions
[67]: https://jestjs.io/docs/snapshot-testing
[68]: https://jestjs.io/docs/api#testonlyname-fn-timeout
[69]: https://jestjs.io/docs/api#testskipname-fn
[70]:
  https://github.com/nodejs/node/blob/a03529d82858ed225f40837f14db71851ad5d885/lib/internal/util.js#L97-L99
[71]: https://github.com/facebook/jest/issues/2549
[72]:
  https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-instanceof-array.md
[73]: https://nodejs.org/api/vm.html#vm-executing-javascript
[74]: https://stackoverflow.com/a/32750746/1367414
[75]: #outputraw
[76]: #teardown-1
[77]: #setup-1
[78]: #formatresult
[79]:
  https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/babel-core/index.d.ts#L191-L197
[80]: https://babeljs.io/docs/babel-core#transform
[81]: #throws-1
[82]: #full-example
[83]: #code
[84]: #output
[85]: #outputraw-1
[86]: #exec
[87]: #teardown-2
[88]: #setup-2
[89]: https://www.npmjs.com/package/jest-snapshot
[90]: https://jestjs.io/docs/expect#tomatchsnapshotpropertymatchers-hint
[91]:
  https://github.com/Xunnamius/babel-plugin-transform-rewrite-imports/blob/main/test/unit-index.test.ts
[92]:
  https://github.com/Xunnamius/babel-plugin-explicit-exports-references/blob/main/test/unit-index.test.ts
[93]:
  https://github.com/Xunnamius/babel-plugin-transform-default-named-imports/blob/main/test/unit-index.test.ts
[94]: ./test/integration/integration-node-smoke.test.ts
[95]: https://vitest.dev/config#globals
[96]: https://babeljs.io/docs/en/options#config-loading-options
[97]: #custom-plugin-and-preset-run-order
[98]: https://babeljs.io/docs/en/config-files
[99]: https://babeljs.io/docs/en/options#filename
[100]: https://babeljs.io/docs/en/config-files#file-relative-configuration
[101]:
  https://github.com/jamiebuilds/babel-handbook/blob/c6828415127f27fedcc51299e98eaf47b3e26b5f/translations/en/plugin-handbook.md#state
[102]: https://nodejs.org/api/process.html#processcwd
[103]: #custom-snapshot-serialization
[104]: https://npm.im/debug
[105]: https://www.npmjs.com/package/debug#environment-variables
[106]: https://www.npmjs.com/package/debug#namespace-colors
[107]: #skip
[108]: #only
[109]: #skip-1
[110]: #only-1
[111]: #restarttitlenumbering
[112]: https://github.com/jamiebuilds
