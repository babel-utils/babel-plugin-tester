# babel-plugin-tester

Utilities for testing babel plugins

[![Build Status][build-badge]][build]
[![Code Coverage][coverage-badge]][coverage]
[![Dependencies][dependencyci-badge]][dependencyci]
[![version][version-badge]][package]
[![downloads][downloads-badge]][npm-stat]
[![MIT License][license-badge]][LICENSE]

[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors)
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
        idPath.node.name = idPath.node.name.split('').reverse().join('')
      },
    },
  }
}
```

#### pluginName

This is used for the `describe` title as well as the test titles. If it
can be inferred from the `plugin`'s `name` then it will be and you don't need
to provide this option.

#### title

This can be used to specify a title for the describe block (rather than using
the `pluginName`).

#### fixtures

This is used in combination with the test object's `fixture` and `outputFixture`
options. This is used as the base directory with which to resolve relative
paths for those options.

Note: you really only need to specify this option if one of your test objects
uses `fixture` or `outputFixture` without absolute paths.

#### tests

You provide test objects as the `tests` option to `babel-plugin-tester`. You can
either provide the `tests` as an object of test objects or an array of test
objects.

If you provide the tests as an object, the key will be used as the title of the
test.

If you provide an array, the title will be derived from it's index and a
specified `title` property or the `pluginName`.

Read more about test objects below.

#### ...rest

The rest of the options you provide will be [`lodash.merge`][lodash-merge]d
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
this will be `path.join`ed with the `fixtures` path.

#### outputFixture

If you'd rather put your `output` in a separate file, you can specify this
instead (works the same as `fixture`).

#### snapshot

If you'd prefer to take a snapshot of your output rather than compare it to
something you hard-code, then specify `snapshot: true`. This will take a
snapshot with both the source code and the output, making the snapshot easier
to understand.

## Examples

### Full Example + Docs

```javascript
import pluginTester from 'babel-plugin-tester'
import identifierReversePlugin from '../identifier-reverse-plugin'

pluginTester({
  // required
  plugin: identifierReversePlugin,

  // unnecessary if it's returned with the plugin
  pluginName: 'identifier reverse',

  // defaults to the plugin name
  title: 'describe block title',

  // only necessary if you use fixture or outputFixture in your tests
  fixtures: path.join(__dirname, '__fixtures__'),

  // these will be `lodash.merge`d with the test objects
  // below are the defaults:
  babelOptions: {
    parserOpts: {parser: recast.parse},
    generatorOpts: {generator: recast.print, lineTerminator: '\n'},
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
      fixture: 'changed.js',
      // because outputFixture is provided, the assertion will be that the
      // plugin will change the contents of `changed.js` to the contents of
      // `changed-output.js`
      outputFixture: 'changed-output.js',
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

- ESLint's [RuleTester][RuleTester]
- [@thejameskyle][@thejameskyle]'s [tweet][jamestweet]

## Other Solutions

I'm not aware of any, if you are please [make a pull request][prs] and add it
here!

## Contributors

Thanks goes to these people ([emoji key][emojis]):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
| [<img src="https://avatars.githubusercontent.com/u/1500684?v=3" width="100px;"/><br /><sub>Kent C. Dodds</sub>](https://kentcdodds.com)<br />[💻](https://github.com/kentcdodds/babel-plugin-tester/commits?author=kentcdodds) [📖](https://github.com/kentcdodds/babel-plugin-tester/commits?author=kentcdodds) 🚇 [⚠️](https://github.com/kentcdodds/babel-plugin-tester/commits?author=kentcdodds) |
| :---: |
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors][all-contributors] specification.
Contributions of any kind welcome!

## LICENSE

MIT

[npm]: https://www.npmjs.com/
[node]: https://nodejs.org
[build-badge]: https://img.shields.io/travis/kentcdodds/babel-plugin-tester.svg?style=flat-square
[build]: https://travis-ci.org/kentcdodds/babel-plugin-tester
[coverage-badge]: https://img.shields.io/codecov/c/github/kentcdodds/babel-plugin-tester.svg?style=flat-square
[coverage]: https://codecov.io/github/kentcdodds/babel-plugin-tester
[dependencyci-badge]: https://dependencyci.com/github/kentcdodds/babel-plugin-tester/badge?style=flat-square
[dependencyci]: https://dependencyci.com/github/kentcdodds/babel-plugin-tester
[version-badge]: https://img.shields.io/npm/v/babel-plugin-tester.svg?style=flat-square
[package]: https://www.npmjs.com/package/babel-plugin-tester
[downloads-badge]: https://img.shields.io/npm/dm/babel-plugin-tester.svg?style=flat-square
[npm-stat]: http://npm-stat.com/charts.html?package=babel-plugin-tester&from=2016-04-01
[license-badge]: https://img.shields.io/npm/l/babel-plugin-tester.svg?style=flat-square
[license]: https://github.com/kentcdodds/babel-plugin-tester/blob/master/other/LICENSE
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[donate-badge]: https://img.shields.io/badge/$-support-green.svg?style=flat-square
[donate]: http://kcd.im/donate
[coc-badge]: https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]: https://github.com/kentcdodds/babel-plugin-tester/blob/master/other/CODE_OF_CONDUCT.md
[roadmap-badge]: https://img.shields.io/badge/%F0%9F%93%94-roadmap-CD9523.svg?style=flat-square
[roadmap]: https://github.com/kentcdodds/babel-plugin-tester/blob/master/other/ROADMAP.md
[examples-badge]: https://img.shields.io/badge/%F0%9F%92%A1-examples-8C8E93.svg?style=flat-square
[examples]: https://github.com/kentcdodds/babel-plugin-tester/blob/master/other/EXAMPLES.md
[github-watch-badge]: https://img.shields.io/github/watchers/kentcdodds/babel-plugin-tester.svg?style=social
[github-watch]: https://github.com/kentcdodds/babel-plugin-tester/watchers
[github-star-badge]: https://img.shields.io/github/stars/kentcdodds/babel-plugin-tester.svg?style=social
[github-star]: https://github.com/kentcdodds/babel-plugin-tester/stargazers
[twitter]: https://twitter.com/intent/tweet?text=Check%20out%20babel-plugin-tester!%20https://github.com/kentcdodds/babel-plugin-tester%20%F0%9F%91%8D
[twitter-badge]: https://img.shields.io/twitter/url/https/github.com/kentcdodds/babel-plugin-tester.svg?style=social
[emojis]: https://github.com/kentcdodds/all-contributors#emoji-key
[all-contributors]: https://github.com/kentcdodds/all-contributors
[lodash.merge]: https://lodash.com/docs/4.17.4#merge
[RuleTester]: http://eslint.org/docs/developer-guide/working-with-rules#rule-unit-tests
[@thejameskyle]: https://github.com/thejameskyle
[jamestweet]: https://twitter.com/thejameskyle/status/864359438819262465
