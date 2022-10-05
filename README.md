# babel-plugin-tester

Utilities for testing babel plugins and presets.

---

<!-- prettier-ignore-start -->
[![Build Status][build-badge]][build]
[![Code Coverage][coverage-badge]][coverage]
[![Version][version-badge]][package]
[![Downloads][downloads-badge]][npmtrends]
[![MIT License][license-badge]][license]

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-19-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->
[![PRs Welcome][prs-badge]][prs]
[![Code of Conduct][coc-badge]][coc]
<!-- prettier-ignore-end -->

## The Problem

You're writing a babel [plugin][3] or [preset][4] and want to write tests for it
too.

## This Solution

This is a fairly simple abstraction to help you write tests for your babel
plugin or preset. It was built to work with [Jest][5], but most of the
functionality should work with [Mocha][6], [Jasmine][7], and any other framework
that defines standard `it`/`describe`/`expect` globals.

<!-- prettier-ignore-start -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Installation][8]
- [Usage][9]
  - [Import][10]
  - [Invoke][11]
  - [Options][12]
- [Examples][13]
  - [Simple Example][14]
  - [Full Example][15]
- [Documentation][16]
  - [Using Babel For Configuration Loading][17]
  - [`pluginName` Inference Caveat][18]
  - [Un-string Snapshot Serializer][19]
  - [Prettier Formatter][20]
- [Inspiration][21]
- [Issues][22]
  - [🐛 Bugs][23]
  - [💡 Feature Requests][24]
- [Contributors ✨][1]
- [LICENSE][25]

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
<!-- prettier-ignore-end -->

## Installation

This module is distributed via [npm][npm] which is bundled with [node][node] and
should be installed as one of your project's `devDependencies`:

```Shell
npm install --save-dev babel-plugin-tester
```

## Usage

### import

ESM:

```JavaScript
import { pluginTester } from 'babel-plugin-tester';
```

CJS:

```JavaScript
const { pluginTester } = require('babel-plugin-tester');
```

> For backwards compatibility reasons, a default export is also available.

### Invoke

```JavaScript
/* file: test/unit.test.js */

import { pluginTester } from 'babel-plugin-tester'
import yourPlugin from '../src/your-plugin'

pluginTester({
  plugin: yourPlugin,
  tests: {
    /* Your test objects */
  },
})
```

> Note how `pluginTester` does not appear inside any `test`/`it`/`describe`
> block.

### Options

This section lists the options you can pass to babel-plugin-tester. They are all
optional with respect to the following:

- When testing a preset, the [`preset`][26] option is required.
- When testing a plugin, the [`plugin`][27] option is required.
- You must test either a preset or a plugin.
- You cannot use preset-specific options ([`preset`][26], [`presetName`][28],
  [`presetOptions`][29]) and plugin-specific options ([`plugin`][27],
  [`pluginName`][30], [`pluginOptions`][31]) at the same time.

#### plugin

This is used to provide the babel plugin under test. For example:

```JavaScript
/* file: test/unit.test.js */

import { pluginTester } from 'babel-plugin-tester'
import identifierReversePlugin from '../src/identifier-reverse-plugin'

pluginTester({
  plugin: identifierReversePlugin,
  tests: {
    /* Your test objects */
  },
})

/* file: src/identifier-reverse-plugin.js */

// Normally you would import this from your plugin module
function identifierReversePlugin() {
  return {
    name: 'identifier reverse',
    visitor: {
      Identifier(idPath) {
        idPath.node.name = idPath.node.name.split('').reverse().join('')
      },
    },
  }
}
```

#### pluginName

This is used as the [describe block name][32] and in your [tests' names][33]. If
`pluginName` can be inferred from the [`plugin`][27]'s [name][34], then it will
be and you don't need to provide this option. If it cannot be inferred for
whatever reason, `pluginName` defaults to `"unknown plugin"`.

Note that there is a small [caveat][18] when relying on `pluginName` inference.

#### pluginOptions

This is used to pass options into your plugin at transform time. This option can
be overwritten in a [test object][35] or [fixture options][36].

#### preset

This is used to provide the babel preset under test. For example:

```JavaScript
/* file: cool-new-babel-reset.test.js */

import { pluginTester } from 'babel-plugin-tester'
import coolNewBabelPreset from 'cool-new-babel-preset.js'

pluginTester({
  preset: coolNewBabelPreset,
  // A path to a directory containing your test fixtures
  fixtures: `${__dirname}/__fixtures__`,
})

/* file: cool-new-babel-preset.js */

function identifierReversePlugin() {
  return {
    name: 'identifier reverse',
    visitor: {
      Identifier(idPath) {
        idPath.node.name = idPath.node.name.split('').reverse().join('')
      },
    },
  }
}

function identifierAppendPlugin() {
  return {
    name: 'identifier append',
    visitor: {
      Identifier(idPath) {
        idPath.node.name = `${idPath.node.name}_appended`
      },
    },
  }
}

export function coolNewBabelPreset() {
  return {plugins: [identifierReversePlugin, identifierAppendPlugin]}
}
```

#### presetName

This is used as the [describe block name][32] and in your [tests' names][33].
Defaults to `"unknown preset"`.

#### presetOptions

This is used to pass options into your preset at transform time. This option can
be overwritten using [test object properties][35] or [fixture options][36].

#### babel

This is used to provide your own implementation of babel. This is particularly
useful if you want to use a different version of babel than what's included in
this package.

##### babel.config.js

This is used to configure babel. If provided, the object will be
[`lodash.mergewith`][lodash.mergewith]'d with the [defaults][15] and each test's
[test object][35]/[fixture options][36].

Note that [`babelOptions.babelrc`][37] and [`babelOptions.configFile`][38] are
set to `false` by default, which disables automatic babel configuration loading.
[This can be re-enabled if desired][17].

To simply reuse your project's [`babel.config.js`][39] or some other
configuration file, set `babelOptions` like so:

````JavaScript
import { pluginTester } from 'babel-plugin-tester'

pluginTester({
  plugin: yourPlugin,
  // ...
  babelOptions: require('../babel.config.js'),
  // ...
  tests: {
    /* Your test objects */
  },
});

##### Custom Plugin And Preset Run Order

By default, when you include a custom list of [plugins][40] or [presets][4] in
`babelOptions`, the plugin or preset under test will always be the final plugin
or preset to run.

For example, consider the `myPlugin` plugin:

```JavaScript
import { pluginTester } from 'babel-plugin-tester'

pluginTester({
  plugin: myPlugin,
  pluginName: 'my-plugin',
  babelOptions: {
    plugins: [
      ['@babel/plugin-syntax-decorators', {legacy: true}],
      ['@babel/plugin-proposal-class-properties', {loose: true}],
    ],
  },
})
````

By default, `myPlugin` will be invoked _after_ @babel/plugin-syntax-decorators
and @babel/plugin-proposal-class-properties.

It is possible to specify a custom ordering using the exported
`runPluginUnderTestHere` symbol. For instance, to run `myPlugin` _after_
@babel/plugin-syntax-decorators but _before_
@babel/plugin-proposal-class-properties:

```JavaScript
import { pluginTester, runPluginUnderTestHere } from 'babel-plugin-tester'

pluginTester({
  plugin: myPlugin,
  pluginName: 'my-plugin',
  babelOptions: {
    plugins: [
      ['@babel/plugin-syntax-decorators', {legacy: true}],
      runPluginUnderTestHere,
      ['@babel/plugin-proposal-class-properties', {loose: true}],
    ],
  },
})
```

Or to run `myPlugin` _before_ both @babel/plugin-syntax-decorators and
@babel/plugin-proposal-class-properties:

```JavaScript
import { pluginTester, runPluginUnderTestHere } from 'babel-plugin-tester'

pluginTester({
  plugin: myPlugin,
  pluginName: 'my-plugin',
  babelOptions: {
    plugins: [
      runPluginUnderTestHere,
      ['@babel/plugin-syntax-decorators', {legacy: true}],
      ['@babel/plugin-proposal-class-properties', {loose: true}],
    ],
  },
})
```

The same can be done when testing presets:

```JavaScript
import { pluginTester, runPresetUnderTestHere } from 'babel-plugin-tester'

pluginTester({
  preset: myPreset,
  presetName: 'my-preset',
  babelOptions: {
    presets: [
      '@babel/preset-typescript',
      ['@babel/preset-react', {pragma: 'dom'}],
      runPresetUnderTestHere,
    ],
  },
})
```

In this example, `myPreset` will run first instead of last since, unlike
plugins, [presets are run in reverse order][41].

#### title

This is used to specify a custom title for the describe block (overriding
everything else).

#### filepath

This is used to resolve relative paths provided by the [`fixtures`][42] option
and the two [test object][35] properties [`fixture`][43] and
[`outputFixture`][44]. If these are not absolute paths, they will be
[`path.join`][45]'d with the [directory name][46] of `filepath`.

`filepath` is also passed to [`formatResult` (fixture option)][47] and
[`formatResult` (test object property)][48].

Defaults to the absolute path of the file that [invoked the `pluginTester`
function][11].

> For backwards compatibility reasons, `filepath` is synonymous with `filename`.
> They can be used interchangeably, though care must be taken not to confuse
> `options.filename` with `babelOptions.filename`. They are NOT the same!

#### endOfLine

This is used to control which line endings the output from babel should have.

| Options    | Description                        |
| ---------- | ---------------------------------- |
| `lf`       | Unix - default                     |
| `crlf`     | Windows                            |
| `auto`     | Use the system default             |
| `preserve` | Use the line ending from the input |

#### fixtures

There are two ways to create tests: using the [`tests`][49] option to provide
one or more [test objects][35] or using the `fixtures` option described here.
Both can be used simultaneously.

The `fixtures` option must be a path to a directory with a structure similar to
the following:

    __fixtures__
    ├── first-test         # test title will be: "first test"
    │   ├── code.js        # required
    │   └── output.js      # required
    ├── second-test        # test title will be: "second test"
    │   ├── .babelrc       # optional
    │   ├── options.json   # optional
    │   ├── code.js        # required
    │   └── output.js      # required (unless using the `throws` option)
    └── nested
        ├── options.json   # optional
        ├── third-test     # test title will be: "nested > third test"
        │   ├── code.js    # required
        │   ├── output.js  # required (unless using the `throws` option)
        │   └── options.js # optional (overrides props in nested/options.json)
        └── fourth-test    # test title will be: "nested > fourth test"
            └── exec.js    # required (alternative to code/output structure)

Assuming the `__fixtures__` directory is in the same directory as your test
file, you could use it with the following configuration:

```JavaScript
pluginTester({
  plugin,
  fixtures: path.join(__dirname, '__fixtures__'),
})
```

> If `fixtures` is not an absolute path, it will be [`path.join`][45]'d with the
> [directory name][46] of [`filepath`][50].

And it would run four tests, one for each directory in `__fixtures__`.

##### `code.js`

This file's contents will be used as the input into babel at transform time.

##### `output.js`

This file, if provided, will have its contents compared with babel's output
after transforming [`code.js`][51]. It will have any indentation stripped and
will be trimmed as a convenience for template literals.

This file must be provided unless the [`throws`][52] property is present in
[`options.json`][36]. Additionally, the extension of the output file can be
changed with the [`fixtureOutputExt`][53] property.

##### `exec.js`

This file's contents will be used as the input into babel at transform time just
like the [`code.js`][51] file, except the output will be _evaluated_ in the
[same context][54] as the the test runner itself, meaning it has access to
`expect`, `require`, etc. Use this to make advanced assertions on the output.

For example, to test that [babel-plugin-proposal-throw-expressions][55] actually
throws, your `exec.js` file might contain:

```JavaScript
expect(() => throw new Error('throw expression')).toThrow('throw expression');
```

However, note that this file cannot appear in the same directory as
[`code.js`][51] or [`output.js`][56].

##### `options.json` (or `options.js`)

For each fixture, the contents of `options.json` are merged with
[`pluginOptions`][31]/[`presetOptions`][29] and passed to the plugin/preset
under test. For added flexibility, `options.json` can be specified as
`options.js` instead so long as you export a JSON object via
[`module.exports`][57]. If both files exist in the same directory, `options.js`
will take precedence and `options.json` will be ignored entirely.

Fixtures support deeply nested directory structures as well as shared "root"
`options.json` files. For example, placing an `options.json` file in the
`__fixtures__/nested` directory would make its contents the global configuration
for all fixtures under `__fixtures__/nested`; each fixture would merge these
global properties with [`pluginOptions`][31]/[`presetOptions`][29] and the
contents of their local `options.json` (or `options.js`) file if it exists.

What follows are the available properties. All of them are optional and will not
be passed to the plugin/preset under test:

###### fixtureOutputExt

Use this to provide your own fixture output file extension. This is particularly
useful if you are testing TypeScript input. If omitted, the fixture's input file
extension will be used instead. Defaults to `.js`.

###### only

Use this to run only the specified fixture. Useful while developing to help
focus on a small number of fixtures. Can be used in multiple `options.json`
files.

###### skip

Use this to skip running the specified fixture. Useful for when you're working
on a feature that is not yet supported. Can be used in multiple `options.json`
files.

###### title

If provided, this will be used as the title of the test (overriding the
directory name).

###### throws

> When using certain values, this option must be used in `options.js` instead of
> `options.json`.

Use this to assert that a particular `code.js` file should be throwing an error
during transformation. For example:

```JavaScript
{
  // ...
  throws: true,
  throws: 'should have this exact message',
  throws: /should pass this regex/,
  throws: SyntaxError, // Should be instance of this constructor
  throws: err => {
    if (err instanceof SyntaxError && /message/.test(err.message)) {
      return true; // Test will fail if this function doesn't return `true`
    }
  },
}
```

> For backwards compatibility reasons, `error` is synonymous with `throws`. They
> can be used interchangeably.

Note that this property is ignored when using an [`exec.js`][58] file.

###### setup

If you need something set up before a particular fixture's tests are run, you
can do this with `setup`. This function will be run before the fixture runs. It
can return a function which will be treated as a [`teardown`][59] function. It
can also return a promise. If that promise resolves to a function, that will be
treated as a [`teardown`][59] function.

###### teardown

If you set up some state, it's quite possible you want to tear it down. Use this
function to clean up after a fixture's tests finish running. You can either
define this as its own property, or you can return it from the [`setup`][60]
function. This can likewise return a promise if it's asynchronous.

###### formatResult

> As it requires a function value, this option must be used in `options.js`
> instead of `options.json`.

Use this to determine how your transformed code will be formatted before
comparison. See [this section][48] for further details.

#### tests

There are two ways to create tests: using the [`fixtures`][42] option that
leverages the filesystem or using the `tests` option described here. Both can be
used simultaneously.

Using the `tests` option, you can provide [test objects][35] describing your
expected transformations. You can provide `tests` as an object of test objects
or an array of test objects. If you provide an object, the object's keys will be
used as the title of each test. If you provide an array, each test's title will
be derived from its index and [`pluginName`][30]/[`presetName`][28].

See [the example][15] for more details.

##### Test Objects

A minimal test object can be:

1.  A `string` representing [code][61].
2.  An `object` with a [`code`][61] property.

Here are the available properties if you provide an object:

###### title

If provided, this will be used as the title of the test (overriding everything
else).

###### code

The code that you want to run through your plugin or preset. This must be
provided unless you're using the [`fixture`][43] or [`exec`][62] properties
instead. If you do not provide the [`output`][63] or [`outputFixture`][44]
properties and [`snapshot`][64] is not `true`, then the assertion is that this
code is unchanged by the transformation.

###### output

If provided, the result of the transformation will be compared with this output
for the assertion. It will have any indentation stripped and will be trimmed as
a convenience for template literals.

###### fixture

If you'd rather put your [`code`][61] in a separate file, you can specify a file
name here instead. If it's an absolute path, then that's the file that will be
loaded. Otherwise, `fixture` will be [`path.join`][45]'d with the [directory
name][46] of [`filepath`][50].

> If you find you're using this option more than a couple of times, consider
> using [_`fixtures`_][42] instead.

###### outputFixture

If you'd rather put your [`output`][63] in a separate file, you can specify a
file name here instead. If it's an absolute path, then that's the file that will
be loaded. Otherwise, `outputFixture` will be [`path.join`][45]'d with the
[directory name][46] of [`filepath`][50].

> If you find you're using this option more than a couple of times, consider
> using [_`fixtures`_][42] instead.

###### exec

The provided source will be transformed just like the [`code`][61] property,
except the output will be _evaluated_ in the same context as the the test runner
itself, meaning it has access to `expect`, `require`, etc. Use this to make
advanced assertions on the output.

For example, you can test that [babel-plugin-proposal-throw-expressions][55]
actually throws using the following:

```JavaScript
{
  // ...
  exec: `
    expect(() => throw new Error('throw expression')).toThrow('throw expression');
  `
}
```

However, this property cannot appear in the same test object as the
[`code`][61], [`output`][63], [`fixture`][43], or [`outputFixture`][65]
properties.

###### only

Use this to run only the specified test. Useful while developing to help focus
on a small number of tests. Can be used on multiple tests.

###### skip

Use this to skip running the specified test. Useful for when you're working on a
feature that is not yet supported. Can be used on multiple tests.

###### snapshot

If you'd prefer to take a snapshot of your output rather than compare it to
something you hard-code, then specify `snapshot: true`. This will take a
snapshot with both the source code and the output, making the snapshot easier to
understand.

###### throws

If a particular test case should be throwing an error, you can test that using
one of the following:

```JavaScript
{
  // ...
  throws: true,
  throws: 'should have this exact message',
  throws: /should pass this regex/,
  throws: SyntaxError, // Should be instance of this constructor
  throws: err => {
    if (err instanceof SyntaxError && /message/.test(err.message)) {
      return true; // Test will fail if this function doesn't return `true`
    }
  },
}
```

> For backwards compatibility reasons, `error` is synonymous with `throws`. They
> can be used interchangeably.

###### setup

If you need something set up before a particular test is run, you can do this
with `setup`. This function will be run before the test runs. It can return a
function which will be treated as a [`teardown`][66] function. It can also
return a promise. If that promise resolves to a function, that will be treated
as a [`teardown`][66] function.

###### teardown

If you set up some state, it's quite possible you want to tear it down. Use this
function to clean up after a test finishes running. You can either define this
as its own property, or you can return it from the [`setup`][67] function. This
can likewise return a promise if it's asynchronous.

###### formatResult

This defaults to a function which formats your code output with prettier. If you
have prettier configured, then it will use your configuration. If you don't then
it will use default configuration.

If you'd like to specify your own, then feel free to do so. Here's the API:

```JavaScript
function customFormatter(code, { filepath }) {
  // Your custom formatting happens here
  return formattedCode
}
```

Learn more about the built-in formatter [below][20].

> The use case for this originally was for testing transforms and formatting
> their result with `prettier-eslint`.

#### ...rest

The rest of the options you provide will be
[`lodash.mergewith`][lodash.mergewith]'d with each [test object][35]. These
options will _not_ be merged with [fixture options][36].

## Examples

### Simple Example

```JavaScript
import { pluginTester } from 'babel-plugin-tester'
import identifierReversePlugin from '../identifier-reverse-plugin'

// NOTE: you can use beforeAll, afterAll, beforeEach, and afterEach right here
// if you need

pluginTester({
  plugin: identifierReversePlugin,
  snapshot: true,
  tests: [
    {
      code: '"hello";',
      snapshot: false,
    },
    {
      code: 'var hello = "hi";',
      output: 'var olleh = "hi";',
    },
    `
      function sayHi(person) {
        return 'Hello ' + person + '!'
      }
      console.log(sayHi('Jenny'))
    `,
  ],
})
```

### Full Example

```JavaScript
import { pluginTester } from 'babel-plugin-tester'
import identifierReversePlugin from '../identifier-reverse-plugin'

pluginTester({
  // One (and ONLY ONE) of the two following lines MUST be included
  plugin: identifierReversePlugin,
  //preset: coolNewBabelPreset,

  // Usually unnecessary if returned with the plugin. This will default to
  // 'unknown plugin' if a name cannot otherwise be inferred
  pluginName: 'identifier reverse',
  // Unlike with pluginName, there is no presetName inference. This will default
  // to 'unknown preset' if a name is not provided
  //presetName: 'cool-new-babel-preset',

  // Used to test specific plugin options
  pluginOptions: {
    optionA: true,
  },
  //presetOptions: {
  //  optionB: false,
  //}

  // Defaults to the plugin name
  title: 'describe block title',

  // Only useful if you're using fixtures, fixture, or outputFixture options.
  // Defaults to the absolute path of the file the pluginTester function was
  // invoked in, which is equivalent to the following line:
  filepath: __filename,

  // These are the defaults that will be lodash.mergeWith'd with the provided
  // babelOptions option
  babelOptions: {
    parserOpts: {},
    generatorOpts: {},
    babelrc: false,
    configFile: false,
  },

  // Use Jest snapshots (only works with Jest)
  snapshot: false,

  // Defaults to a function that formats with prettier
  formatResult: customFormatFunction,

  // Tests as an object
  tests: {
    // The key is the title. The value is the code that is unchanged (because
    // snapshot == false). Test title will be: "1. does not change code with no
    // identifiers"
    'does not change code with no identifiers': '"hello";',

    // Test title will be: "2. changes this code"
    'changes this code': {
      // Input to the plugin
      code: 'var hello = "hi";',
      // Expected output
      output: 'var olleh = "hi";',
    },
  },

  // Tests as an array
  tests: [
    // Should be unchanged by the plugin (because snapshot == false). Test title
    // will be: "1. identifier reverse"
    '"hello";',
    {
      // Test title will be: "2. identifier reverse"
      code: 'var hello = "hi";',
      output: 'var olleh = "hi";',
    },
    {
      // Test title will be: "3. unchanged code"
      title: 'unchanged code',
      // Because this is an absolute path, the filepath option above will not
      // be used to resolve this path
      fixture: path.join(__dirname, 'some-path', 'unchanged.js'),
      // No output, outputFixture, or snapshot, so the assertion will be that
      // the plugin does not change this code
    },
    {
      // Because these are not absolute paths, they will be joined with the
      // directory of the filepath option provided above
      fixture: '__fixtures__/changed.js',
      // Because outputFixture is provided, the assertion will be that the
      // plugin will change the contents of "changed.js" to the contents of
      // "changed-output.js"
      outputFixture: '__fixtures__/changed-output.js',
    },
    {
      // As a convenience, this will have the indentation striped and it will
      // be trimmed
      code: `
        function sayHi(person) {
          return 'Hello ' + person + '!';
        }
      `,
      // This will take a Jest snapshot. The snapshot will have both the source
      // code and the transformed version to make the snapshot file easier to
      // understand
      snapshot: true,
    },
    {
      code: 'var hello = "hi";',
      output: 'var olleh = "hi";',
      // This can be used to overwrite pluginOptions (set above)
      pluginOptions: {
        optionA: false,
      },
    },
    {
      title: 'unchanged code',
      code: "'no change';",
      setup() {
        // Runs before this test
        return function teardown() {
          // Runs after this tests
        }
        // Can also return a promise
      },
      teardown() {
        // Runs after this test
        // Can return a promise
      },
    },
    {
      // This source will be transformed just like the code property, except the
      // produced code will be evaluated in the same context as the the test
      // runner. Use this to make more advanced assertions on the output.
      exec: `
        const hello = "hi";
        // The plugin will reverse ALL identifiers, even globals like "expect"!
        tcepxe(hello)['toBe']("hi");
      `,
    },
  ],
})
```

## Documentation

### Using Babel For Configuration Loading

[`babelOptions.babelrc`][37] and [`babelOptions.configFile`][38] are set to
`false` [by default][68]. This way, you can [manually import (or provide an
object literal)][68] the exact configuration you want to apply rather than
relying on babel's [somewhat complex configuration loading rules][69]. However,
if your plugin, preset, or project relies on a complicated external setup to do
its work, and you don't mind the [default run order][70], you can leverage
[babel's automatic configuration loading][71] via the `babelOptions.babelrc`
and/or `babelOptions.configFile` options.

When relying on `babelOptions.babelrc`, you must also provide a
[`babelOptions.filename`][72] for each test object that doesn't include a
[`fixture`][43] property. For example:

```JavaScript
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

> Fixtures provided via the [`fixtures`][42] option do not need to provide a
> `filename`.

This file doesn't actually have to exist either, so you can use whatever value
you want for `filename` as long as the `.babelrc` file is [resolved][73]
properly. Hence, the above example could be simplified further:

```JavaScript
pluginTester({
  plugin,
  // This configuration applies to *all* tests!
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

### `pluginName` Inference Caveat

Inferring [`pluginName`][30] during testing requires invoking [the plugin][27]
_at least twice_: once outside of babel to check for the plugin's name and then
again when run by babel. This is irrelevant to babel-plugin-tester (even if your
plugin crashes when run outside of babel) and to the overwhelming majority of
babel plugins in existence. This only becomes a problem if your plugin is
_aggressively stateful_, which is against the [babel handbook on plugin
design][74].

For example, the following plugin which replaces an import specifier using a
regular expression will exhibit strange behavior due to being invoked twice:

```JavaScript
/*  -*-*-  BAD CODE DO NOT USE  -*-*-  */

let source
// vvv When first invoked outside of babel, all passed arguments are mocks vvv
function badNotGoodPlugin({assertVersion, types: t}) {
  // ^^^ Which means assertVersion is mocked and t is undefined ^^^
  assertVersion(7)

  // vvv So don't memoize `t` here (which among other things is poor design) vvv
  if (!source) {
    source = (value, original, replacement) => {
      return t.stringLiteral(value.replace(original, replacement))
    }
  }

  return {
    name: 'bad-bad-not-good',
    visitor: {
      ImportDeclaration(path, state) {
        path.node.source = source(
          path.node.source.value,
          state.opts.originalRegExp,
          state.opts.replacementString,
        )
      },
    },
  }
}

pluginTester({
  plugin: badNotGoodPlugin,
  pluginOptions: {originalRegExp: /^y$/, replacementString: 'z'},
  tests: [{code: 'import { x } from "y";', output: 'import { x } from "z";'}],
})

// Result: error!
// TypeError: Cannot read properties of undefined (reading 'stringLiteral')
```

If you still want to use global state despite the handbook's advice, either
initialize global state within your visitor:

```JavaScript
let source
function okayPlugin({assertVersion, types: t}) {
  assertVersion(7)

  return {
    name: 'okay',
    visitor: {
      Program: {
        enter() {
          // vvv Initialize global state in a safe place vvv
          if (!source) {
            source = (value, original, replacement) => {
              return t.stringLiteral(value.replace(original, replacement))
            }
          }
        },
      },
      ImportDeclaration(path, state) {
        path.node.source = source(
          path.node.source.value,
          state.opts.originalRegExp,
          state.opts.replacementString,
        )
      },
    },
  }
}

pluginTester({
  plugin: okayPlugin,
  pluginOptions: {originalRegExp: /^y$/, replacementString: 'z'},
  tests: [{code: 'import { x } from "y";', output: 'import { x } from "z";'}],
})

// Result: works!
```

Or do things the proper way and just use local state instead:

```JavaScript
function betterPlugin({assertVersion, types: t}) {
  assertVersion(7)

  // vvv Use local state instead so t is memoized properly vvv
  const source = (value, original, replacement) => {
    return t.stringLiteral(value.replace(original, replacement))
  }

  return {
    name: 'better',
    visitor: {
      ImportDeclaration(path, state) {
        path.node.source = source(
          path.node.source.value,
          state.opts.originalRegExp,
          state.opts.replacementString,
        )
      },
    },
  }
}

pluginTester({
  plugin: betterPlugin,
  pluginOptions: {originalRegExp: /^y$/, replacementString: 'z'},
  tests: [{code: 'import { x } from "y";', output: 'import { x } from "z";'}],
})

// Result: works!
```

### Un-string Snapshot Serializer

If you're using Jest and snapshots, then the snapshot output could have a bunch
of bothersome `\"` to escape quotes because when Jest serializes a string, it
will wrap everything in double quotes. This isn't a huge deal, but it makes the
snapshots harder to read. So we automatically add a snapshot serializer for you
to remove those.

If you don't like that, then do this:

```diff
- import { pluginTester } from 'babel-plugin-tester'
+ import { pluginTester } from 'babel-plugin-tester/pure'
```

### Prettier formatter

By default, a formatter is included which formats your results with
[prettier][75]. It will look for a prettier configuration relative to the file
that's being tested or the current working directory. If it can't find one, then
it uses the default configuration for prettier.

This makes your snapshots easier to read. But if you'd like to not have that,
then you can either import the `pure` file (as shown [above][19]) or you can
override the `formatResult` option:

```JavaScript
pluginTester({
  // ...
  formatResult: r => r,
  // ...
})
```

## Inspiration

I've been thinking about this for a while. The API was inspired by:

- ESLint's [RuleTester][ruletester]
- [@thejameskyle][@thejameskyle]'s [tweet][jamestweet]
- Babel's own
  [`@babel/helper-plugin-test-runner`][@babel/helper-plugin-test-runner]

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

This project follows the [all-contributors][all-contributors] specification.
Contributions of any kind welcome!

## LICENSE

MIT

[npm]: https://www.npmjs.com
[node]: https://nodejs.org
[build-badge]:
  https://img.shields.io/travis/babel-utils/babel-plugin-tester.svg?style=flat-square
[build]: https://travis-ci.org/babel-utils/babel-plugin-tester
[coverage-badge]:
  https://img.shields.io/codecov/c/github/babel-utils/babel-plugin-tester.svg?style=flat-square
[coverage]: https://codecov.io/github/babel-utils/babel-plugin-tester
[version-badge]:
  https://img.shields.io/npm/v/babel-plugin-tester.svg?style=flat-square
[package]: https://www.npmjs.com/package/babel-plugin-tester
[downloads-badge]:
  https://img.shields.io/npm/dm/babel-plugin-tester.svg?style=flat-square
[npmtrends]: https://www.npmtrends.com/babel-plugin-tester
[license-badge]:
  https://img.shields.io/npm/l/babel-plugin-tester.svg?style=flat-square
[license]:
  https://github.com/babel-utils/babel-plugin-tester/blob/master/LICENSE
[prs-badge]:
  https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[coc-badge]:
  https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]:
  https://github.com/babel-utils/babel-plugin-tester/blob/master/.github/CODE_OF_CONDUCT.md
[emojis]: https://github.com/all-contributors/all-contributors#emoji-key
[all-contributors]: https://github.com/all-contributors/all-contributors
[@babel/helper-plugin-test-runner]:
  https://github.com/babel/babel/tree/master/packages/babel-helper-plugin-test-runner
[@thejameskyle]: https://github.com/thejameskyle
[jamestweet]: https://twitter.com/thejameskyle/status/864359438819262465
[lodash.mergewith]: https://lodash.com/docs/4.17.4#mergeWith
[ruletester]:
  http://eslint.org/docs/developer-guide/working-with-rules#rule-unit-tests
[good-first-issue]:
  https://github.com/babel-utils/babel-plugin-tester/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22
[bugs]:
  https://github.com/babel-utils/babel-plugin-tester/issues?q=is%3Aissue+is%3Aopen+label%3A%22bug%22
[requests]:
  https://github.com/babel-utils/babel-plugin-tester/issues?q=is%3Aissue+is%3Aopen+label%3A%22enhancement%22
[1]: #contributors-
[3]: https://babeljs.io/docs/en/plugins
[4]: https://babeljs.io/docs/en/presets
[5]: https://jestjs.io/
[6]: https://mochajs.org/
[7]: https://jasmine.github.io/
[8]: #installation
[9]: #usage
[10]: #import
[11]: #invoke
[12]: #options
[13]: #examples
[14]: #simple-example
[15]: #full-example
[16]: #documentation
[17]: #using-babel-for-configuration-loading
[18]: #pluginname-inference-caveat
[19]: #un-string-snapshot-serializer
[20]: #prettier-formatter
[21]: #inspiration
[22]: #issues
[23]: #-bugs
[24]: #-feature-requests
[25]: #license
[26]: #preset
[27]: #plugin
[28]: #presetname
[29]: #presetoptions
[30]: #pluginname
[31]: #pluginoptions
[32]: https://jestjs.io/docs/api#describename-fn
[33]: https://jestjs.io/docs/api#testname-fn-timeout
[34]:
  https://github.com/DefinitelyTyped/DefinitelyTyped/blob/2b229cce80b334f673f1b26895007e9eca786366/types/babel-core/index.d.ts#L25
[35]: #test-objects
[36]: #optionsjson-or-optionsjs
[37]: https://babeljs.io/docs/en/options#babelrc
[38]: https://babeljs.io/docs/en/options#configfile
[39]: https://babeljs.io/docs/en/configuration
[40]: https://babeljs.io/docs/en/options#plugins
[41]: https://babeljs.io/docs/en/presets#preset-ordering
[42]: #fixtures
[43]: #fixture
[44]: #outputfixture
[45]: https://nodejs.org/api/path.html#pathjoinpaths
[46]: https://nodejs.org/api/path.html#pathdirnamepath
[47]: #formatresult
[48]: #formatresult-1
[49]: #tests
[50]: #filepath
[51]: #codejs
[52]: #throws
[53]: #fixtureOutputExt
[54]: https://nodejs.org/api/vm.html#vmruninthiscontextcode-options
[55]: https://babeljs.io/docs/en/babel-plugin-proposal-throw-expressions
[56]: #outputjs
[57]: https://nodejs.org/api/modules.html#moduleexports
[58]: #execjs
[59]: #teardown
[60]: #setup
[61]: #code
[62]: #exec
[63]: #output
[64]: #snapshot
[65]: #outputFixture
[66]: #teardown-1
[67]: #setup-1
[68]: #babeloptions
[69]: https://babeljs.io/docs/en/options#config-loading-options
[70]: #custom-plugin-and-preset-run-order
[71]: https://babeljs.io/docs/en/config-files
[72]: https://babeljs.io/docs/en/options#filename
[73]: https://babeljs.io/docs/en/config-files#file-relative-configuration
[74]:
  https://github.com/jamiebuilds/babel-handbook/blob/c6828415127f27fedcc51299e98eaf47b3e26b5f/translations/en/plugin-handbook.md#state
[75]: https://prettier.io
