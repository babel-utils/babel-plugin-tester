# babel-plugin-tester

Utilities for testing babel plugins

[![Build Status][build-badge]][build]
[![Code Coverage][coverage-badge]][coverage]
[![Dependencies][dependencyci-badge]][dependencyci]
[![version][version-badge]][package]
[![downloads][downloads-badge]][npm-stat]
[![MIT License][license-badge]][license]

[![All Contributors](https://img.shields.io/badge/all_contributors-8-orange.svg?style=flat-square)](#contributors)
[![PRs Welcome][prs-badge]][prs]
[![Donate][donate-badge]][donate]
[![Code of Conduct][coc-badge]][coc]
[![Roadmap][roadmap-badge]][roadmap]
[![Examples][examples-badge]][examples]

[![Watch on GitHub][github-watch-badge]][github-watch]
[![Star on GitHub][github-star-badge]][github-star]
[![Tweet][twitter-badge]][twitter]

## The problem

You're writing a babel plugin and want to write tests for it.

## This solution

This is a fairly simple abstraction to help you write tests for your babel
plugin. It works with `jest` (my personal favorite) and most of it should also
work with `mocha` and `jasmine`.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Installation](#installation)
- [Usage](#usage)
  - [import](#import)
  - [Invoke](#invoke)
  - [options](#options)
  - [Test Objects](#test-objects)
- [Examples](#examples)
  - [Full Example + Docs](#full-example--docs)
  - [Simple Example](#simple-example)
- [Inspiration](#inspiration)
- [Other Solutions](#other-solutions)
- [Contributors](#contributors)
- [LICENSE](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

This module is distributed via [npm][npm] which is bundled with [node][node] and
should be installed as one of your project's `devDependencies`:

```
npm install --save-dev babel-plugin-tester
```

## Usage

### import

```javascript
import pluginTester from 'babel-plugin-tester'
// or
const pluginTester = require('babel-plugin-tester')
```

### Invoke

```javascript
import yourPlugin from '../your-plugin'

pluginTester({
  plugin: yourPlugin,
  tests: [
    /* your test objects */
  ],
})
```

### options

#### plugin

Your babel plugin. For example:

```javascript
pluginTester({
  plugin: identifierReversePlugin,
  tests: [
    /* your test objects */
  ],
})

// normally you would import this from your plugin module
function identifierReversePlugin() {
  return {
    name: 'identifier reverse',
    visitor: {
      Identifier(idPath) {
        idPath.node.name = idPath.node.name
          .split('')
          .reverse()
          .join('')
      },
    },
  }
}
```

#### pluginName

This is used for the `describe` title as well as the test titles. If it
can be inferred from the `plugin`'s `name` then it will be and you don't need
to provide this option.

#### pluginOptions

This can be used to pass options into your plugin at transform time. This option
can be overwritten using the test object.

##### babel.config.js

To use [babel.config.js](https://babeljs.io/docs/en/configuration) instead of
.babelrc, set babelOptions to the config object:

```
pluginTester({
  plugin: yourPlugin,
  ...
  babelOptions: require('./babel.config.js'),
  ...
  tests: [
    /* your test objects */
  ],
});

```

#### title

This can be used to specify a title for the describe block (rather than using
the `pluginName`).

#### filename

Relative paths from the other options will be relative to this. Normally you'll
provide this as `filename: __filename`. The only `options` property affected by
this value is `fixtures`. Test Object properties affected by this value are:
`fixture` and `outputFixture`. If those properties are not
absolute paths, then they will be `path.join`ed with `path.dirname` of the
`filename`.

#### fixtures

This is a path to a directory with this format:

```
__fixtures__
├── first-test # test title will be: "first test"
│   ├── code.js # required
│   └── output.js # required
└── second-test
    ├── .babelrc # optional
    ├── code.js
    └── output.js
```

With this you could make your test config like so:

```javascript
pluginTester({
  plugin,
  fixtures: path.join(__dirname, '__fixtures__'),
})
```

And it would run two tests. One for each directory in `__fixtures__`.

#### tests

You provide test objects as the `tests` option to `babel-plugin-tester`. You can
either provide the `tests` as an object of test objects or an array of test
objects.

If you provide the tests as an object, the key will be used as the title of the
test.

If you provide an array, the title will be derived from it's index and a
specified `title` property or the `pluginName`.

Read more about test objects below.

#### babel

Use this to provide your own implementation of babel. This is particularly
useful if you want to use a different version of babel than what's included
in this package.

#### ...rest

The rest of the options you provide will be [`lodash.merge`][lodash.merge]d
with each test object. Read more about those next!

### Test Objects

A minimal test object can be:

1. A `string` representing code
2. An `object` with a `code` property

Here are the available properties if you provide an object:

#### code

The code that you want to run through your babel plugin. This must be provided
unless you provide a `fixture` instead. If there's no `output` or `outputFixture`
and `snapshot` is not `true`, then the assertion is that this code is unchanged
by the plugin.

#### title

If provided, this will be used instead of the `pluginName`. If you're using the
object API, then the `key` of this object will be the title (see example below).

#### output

If this is provided, the result of the plugin will be compared with this output
for the assertion. It will have any indentation stripped and will be trimmed as
a convenience for template literals.

#### fixture

If you'd rather put your `code` in a separate file, you can specify a filename
here. If it's an absolute path, that's the file that will be loaded, otherwise,
this will be `path.join`ed with the `filename` path.

#### outputFixture

If you'd rather put your `output` in a separate file, you can specify this
instead (works the same as `fixture`).

#### only

To run only this test. Useful while developing to help focus on a single test.
Can be used on multiple tests.

#### skip

To skip running this test. Useful for when you're working on a feature that is
not yet supported.

#### snapshot

If you'd prefer to take a snapshot of your output rather than compare it to
something you hard-code, then specify `snapshot: true`. This will take a
snapshot with both the source code and the output, making the snapshot easier
to understand.

#### error

If a particular test case should be throwing an error, you can that using one
of the following:

```javascript
{
  // ...
  error: true,
  error: 'should have this exact message',
  error: /should pass this regex/,
  error: SyntaxError, // should be instance of this constructor
  error: err => {
    if (err instanceof SyntaxError && /message/.test(err.message)) {
      return true; // test will fail if function doesn't return `true`
    }
  },
}
```

#### setup

If you need something set up before a particular test is run, you can do this
with `setup`. This function will be run before the test runs. It can return
a function which will be treated as a `teardown` function. It can also return
a promise. If that promise resolves to a function, that will be treated as a
`teardown` function.

#### teardown

If you set up some state, it's quite possible you want to tear it down. You can
either define this as its own property, or you can return it from the `setup`
function. This can likewise return a promise if it's asynchronous.

#### formatResult

This is a function and if it's specified, it allows you to format the result
however you like. The use case for this originally was for testing codemods
and formatting their result with `prettier-eslint`.

## Examples

### Full Example + Docs

```javascript
import pluginTester from 'babel-plugin-tester'
import identifierReversePlugin from '../identifier-reverse-plugin'

// NOTE: you can use beforeAll, afterAll, beforeEach, and afterEach
// right here if you need

pluginTester({
  // required
  plugin: identifierReversePlugin,

  // unnecessary if it's returned with the plugin
  pluginName: 'identifier reverse',

  // defaults to the plugin name
  title: 'describe block title',

  // used to test specific plugin options
  pluginOptions: {
    optionA: true,
  },

  // only necessary if you use fixture or outputFixture in your tests
  filename: __filename,

  // these will be `lodash.merge`d with the test objects
  // below are the defaults:
  babelOptions: {
    parserOpts: {},
    generatorOpts: {},
    babelrc: false,
  },
  snapshot: false, // use jest snapshots (only works with jest)

  // tests as objects
  tests: {
    // the key is the title
    // the value is the code that is unchanged (because `snapshot: false`)
    // test title will be: `1. does not change code with no identifiers`
    'does not change code with no identifiers': '"hello";',

    // test title will be: `2. changes this code`
    'changes this code': {
      // input to the plugin
      code: 'var hello = "hi";',
      // expected output
      output: 'var olleh = "hi";',
    },
  },

  // tests as an array
  tests: [
    // should be unchanged by the plugin (because `snapshot: false`)
    // test title will be: `1. identifier reverse`
    '"hello";',
    {
      // test title will be: `2. identifier reverse`
      code: 'var hello = "hi";',
      output: 'var olleh = "hi";',
    },
    {
      // test title will be: `3. unchanged code`
      title: 'unchanged code',
      // because this is an absolute path, the `fixtures` above will not be
      // used to resolve this path.
      fixture: path.join(__dirname, 'some-path', 'unchanged.js'),
      // no output, outputFixture, or snapshot, so the assertion will be that
      // the plugin does not change this code.
    },
    {
      // because these are not absolute paths, they will be joined with the
      // `fixtures` path provided above
      fixture: '__fixtures__/changed.js',
      // because outputFixture is provided, the assertion will be that the
      // plugin will change the contents of `changed.js` to the contents of
      // `changed-output.js`
      outputFixture: '__fixtures__/changed-output.js',
    },
    {
      // as a convenience, this will have the indentation striped and it will
      // be trimmed.
      code: `
        function sayHi(person) {
          return 'Hello ' + person + '!'
        }
      `,
      // this will take a jest snapshot. The snapshot will have both the
      // source code and the transformed version to make the snapshot file
      // easier to understand.
      snapshot: true,
    },
    {
      code: 'var hello = "hi";',
      output: 'var olleh = "hi";',
      // this can be used to overwrite the setting set above
      pluginOptions: {
        optionA: false,
      },
    },
    {
      title: 'unchanged code',
      setup() {
        // runs before this test
        return function teardown() {
          // runs after this tests
        }
        // can also return a promise
      },
      teardown() {
        // runs after this test
        // can return a promise
      },
    },
  ],
})
```

### Simple Example

```javascript
import pluginTester from 'babel-plugin-tester'
import identifierReversePlugin from '../identifier-reverse-plugin'

pluginTester({
  plugin: identifierReversePlugin,
  snapshot: true,
  tests: [
    {code: '"hello";', snapshot: false},
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

## Inspiration

I've been thinking about this for a while. The API was inspired by:

- ESLint's [RuleTester][ruletester]
- [@thejameskyle][@thejameskyle]'s [tweet][jamestweet]

## Other Solutions

- [`@babel/helper-plugin-test-runner`][@babel/helper-plugin-test-runner]

## Contributors

Thanks goes to these people ([emoji key][emojis]):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
| [<img src="https://avatars.githubusercontent.com/u/1500684?v=3" width="100px;" alt="Kent C. Dodds"/><br /><sub><b>Kent C. Dodds</b></sub>](https://kentcdodds.com)<br />[💻](https://github.com/babel-utils/babel-plugin-tester/commits?author=kentcdodds "Code") [📖](https://github.com/babel-utils/babel-plugin-tester/commits?author=kentcdodds "Documentation") [🚇](#infra-kentcdodds "Infrastructure (Hosting, Build-Tools, etc)") [⚠️](https://github.com/babel-utils/babel-plugin-tester/commits?author=kentcdodds "Tests") | [<img src="https://avatars3.githubusercontent.com/u/952783?v=3" width="100px;" alt="james kyle"/><br /><sub><b>james kyle</b></sub>](http://thejameskyle.com/)<br />[💻](https://github.com/babel-utils/babel-plugin-tester/commits?author=thejameskyle "Code") [📖](https://github.com/babel-utils/babel-plugin-tester/commits?author=thejameskyle "Documentation") [👀](#review-thejameskyle "Reviewed Pull Requests") [⚠️](https://github.com/babel-utils/babel-plugin-tester/commits?author=thejameskyle "Tests") | [<img src="https://avatars1.githubusercontent.com/u/1894628?v=3" width="100px;" alt="Brad Bohen"/><br /><sub><b>Brad Bohen</b></sub>](https://github.com/bbohen)<br />[🐛](https://github.com/babel-utils/babel-plugin-tester/issues?q=author%3Abbohen "Bug reports") | [<img src="https://avatars0.githubusercontent.com/u/1295580?v=3" width="100px;" alt="Kyle Welch"/><br /><sub><b>Kyle Welch</b></sub>](http://www.krwelch.com)<br />[💻](https://github.com/babel-utils/babel-plugin-tester/commits?author=kwelch "Code") [📖](https://github.com/babel-utils/babel-plugin-tester/commits?author=kwelch "Documentation") [⚠️](https://github.com/babel-utils/babel-plugin-tester/commits?author=kwelch "Tests") | [<img src="https://avatars3.githubusercontent.com/u/6680299?v=4" width="100px;" alt="kontrollanten"/><br /><sub><b>kontrollanten</b></sub>](https://github.com/kontrollanten)<br />[💻](https://github.com/babel-utils/babel-plugin-tester/commits?author=kontrollanten "Code") | [<img src="https://avatars3.githubusercontent.com/u/117921?v=4" width="100px;" alt="Rubén Norte"/><br /><sub><b>Rubén Norte</b></sub>](https://github.com/rubennorte)<br />[💻](https://github.com/babel-utils/babel-plugin-tester/commits?author=rubennorte "Code") [⚠️](https://github.com/babel-utils/babel-plugin-tester/commits?author=rubennorte "Tests") | [<img src="https://avatars2.githubusercontent.com/u/3869532?v=4" width="100px;" alt="André Neves"/><br /><sub><b>André Neves</b></sub>](http://andreneves.work)<br />[💻](https://github.com/babel-utils/babel-plugin-tester/commits?author=andrefgneves "Code") [⚠️](https://github.com/babel-utils/babel-plugin-tester/commits?author=andrefgneves "Tests") |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| [<img src="https://avatars0.githubusercontent.com/u/3842800?v=4" width="100px;" alt="Kristoffer K."/><br /><sub><b>Kristoffer K.</b></sub>](https://github.com/merceyz)<br />[💻](https://github.com/babel-utils/babel-plugin-tester/commits?author=merceyz "Code") |
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors][all-contributors] specification.
Contributions of any kind welcome!

## LICENSE

MIT

[npm]: https://www.npmjs.com/
[node]: https://nodejs.org
[build-badge]: https://img.shields.io/travis/babel-utils/babel-plugin-tester.svg?style=flat-square
[build]: https://travis-ci.org/babel-utils/babel-plugin-tester
[coverage-badge]: https://img.shields.io/codecov/c/github/babel-utils/babel-plugin-tester.svg?style=flat-square
[coverage]: https://codecov.io/github/babel-utils/babel-plugin-tester
[dependencyci-badge]: https://dependencyci.com/github/babel-utils/babel-plugin-tester/badge?style=flat-square
[dependencyci]: https://dependencyci.com/github/babel-utils/babel-plugin-tester
[version-badge]: https://img.shields.io/npm/v/babel-plugin-tester.svg?style=flat-square
[package]: https://www.npmjs.com/package/babel-plugin-tester
[downloads-badge]: https://img.shields.io/npm/dm/babel-plugin-tester.svg?style=flat-square
[npm-stat]: http://npm-stat.com/charts.html?package=babel-plugin-tester&from=2016-04-01
[license-badge]: https://img.shields.io/npm/l/babel-plugin-tester.svg?style=flat-square
[license]: https://github.com/babel-utils/babel-plugin-tester/blob/master/other/LICENSE
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[donate-badge]: https://img.shields.io/badge/$-support-green.svg?style=flat-square
[donate]: http://kcd.im/donate
[coc-badge]: https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]: https://github.com/babel-utils/babel-plugin-tester/blob/master/other/CODE_OF_CONDUCT.md
[roadmap-badge]: https://img.shields.io/badge/%F0%9F%93%94-roadmap-CD9523.svg?style=flat-square
[roadmap]: https://github.com/babel-utils/babel-plugin-tester/blob/master/other/ROADMAP.md
[examples-badge]: https://img.shields.io/badge/%F0%9F%92%A1-examples-8C8E93.svg?style=flat-square
[examples]: https://github.com/babel-utils/babel-plugin-tester/blob/master/other/EXAMPLES.md
[github-watch-badge]: https://img.shields.io/github/watchers/babel-utils/babel-plugin-tester.svg?style=social
[github-watch]: https://github.com/babel-utils/babel-plugin-tester/watchers
[github-star-badge]: https://img.shields.io/github/stars/babel-utils/babel-plugin-tester.svg?style=social
[github-star]: https://github.com/babel-utils/babel-plugin-tester/stargazers
[twitter]: https://twitter.com/intent/tweet?text=Check%20out%20babel-plugin-tester!%20https://github.com/babel-utils/babel-plugin-tester%20%F0%9F%91%8D
[twitter-badge]: https://img.shields.io/twitter/url/https/github.com/babel-utils/babel-plugin-tester.svg?style=social
[emojis]: https://github.com/kentcdodds/all-contributors#emoji-key
[all-contributors]: https://github.com/kentcdodds/all-contributors
[lodash.merge]: https://lodash.com/docs/4.17.4#merge
[ruletester]: http://eslint.org/docs/developer-guide/working-with-rules#rule-unit-tests
[@thejameskyle]: https://github.com/thejameskyle
[jamestweet]: https://twitter.com/thejameskyle/status/864359438819262465
[@babel/helper-plugin-test-runner]: https://github.com/babel/babel/tree/master/packages/babel-helper-plugin-test-runner
