# Changelog

All notable changes to this project will be documented in this auto-generated
file. The format is based on [Conventional Commits][1];
this project adheres to [Semantic Versioning][2].

<br />

## babel-plugin-tester[@12.0.0][3] (2025-06-14)

### 💥 BREAKING CHANGES 💥

- Minimum supported Node.js version is now 20.18.0

- Default exports are no longer available. See usage instructions for details on proper import syntax.

- `ResultFormatter` is no longer synchronous and can now return a `Promise`.

- Adoption of prettier\@3 requires some versions of Node to be executed with the `--experimental-vm-modules` option. E.g. `NODE_OPTIONS="--no-warnings --experimental-vm-modules" npx jest`.

- Attempting to install babel-plugin-tester alongside jest@<30 will cause NPM to fail with `ERESOLVE`. This is because only jest@>=30 (jest-snapshot) supports the prettier\@3 asynchronous interface.

### ✨ Features

- Allow testing entire babel transform result via `outputRaw` ([e9d5aa1][4]) <sup>see [#186][5]</sup>
- Support collapsing/overwriting technically-illegal duplicate plugin/preset `PluginItem`s ([bf0a088][6])
- Upgrade to prettier\@3 ([3334248][7])

### 🪄 Fixes

- **readme:** use proper codecov coverage badge ([1047e5c][8])

### ⚙️ Build System

- Adopt @-xun/symbiote ([89ec951][9])
- **deps:** bump core-js from 3.40.0 to 3.42.0 ([879dd6b][10])
- **deps:** bump core-js from 3.42.0 to 3.43.0 ([7590b87][11])
- **deps:** bump debug from 4.4.0 to 4.4.1 ([3c2538c][12])
- **deps:** bump prettier from 3.4.2 to 3.5.3 ([e0a29da][13])
- **deps:** bump pretty-format from 29.7.0 to 30.0.0 ([7ea13c3][14])
- **deps:** bump rejoinder from 1.2.5 to 2.0.1 ([76dcccd][15])
- **deps:** bump type-fest from 4.32.0 to 4.41.0 ([bcbb568][16])
- **package:** be more selective about which files are included during docs generation ([cbb4215][17])
- **package:** bump minimum supported node versions to maintained ([ee6f7da][18])
- **release:** add "master" branch to release branches ([03734ea][19])
- Upgrade typescript-babel toolchain to nodenext ([d0b722f][21])

### 🧙🏿 Refactored

- **src:** deprecated default exports are no longer available ([b02d4f0][22])

<br />

## babel-plugin-tester[@11.0.0][23] (2023-01-18)

### 💥 BREAKING CHANGES 💥

- **`error` no longer accepts arbitrary class constructors**

  `error` (aka `throws`) no longer accepts arbitrary class constructors. Any provided class constructor must extend `Error`, e.g. built-ins like `SyntaxError` or custom error classes like `class MyError extends Error`. Thanks to the nature of JavaScript, \*\*providing a class constructor that does not extend `Error` will lead to undefined behavior\*\*.

- **`error` only captures exceptions from Babel**

  `error` (aka `throws`) no longer potentially captures exceptions thrown by the `formatResult` function. If the `formatResult` function throws, the entire test will fail immediately.

- **`TypeError` for config error; `AssertionError` for test error**

  All configuration-related issues now throw `TypeError` instead of `AssertionError`. `AssertionError` is now exclusively used for failing tests. Additionally, the text of some error messages has been updated.

- **All test titles are now numbered**

  All test titles are now numbered (e.g. `"1. ..."`, `"2. ..."`, etc), including fixtures tests and tests with custom titles.

- **Built-in TypeScript support**

  TypeScript types are now included within the package itself, obviating the need to install a separate types package. Installing the old types package alongside this version of babel-plugin-tester will cause conflicts.

- **Fixture configuration schema is standardized**

  In previous versions of babel-plugin-tester, you could provide any key to `options.json` and it would be passed as-is to the plugin under test. This made it impossible to allow fixtures to be configured with the same flexibility as test objects. In this version of babel-plugin-tester, fixture `options.json` (and `options.js`) files must return a standard set of options. Non-standard properties are silently ignored. For instance: to pass options to the plugin under test, they must be provided via `pluginOptions`.

- **Global `describe` and `it` functions must be defined**

  Babel-plugin-tester will refuse to run if `describe`, `it`, `it.only`, or `it.skip` are not globally available.

- **Global `setup`/`teardown` no longer overwrites local versions**

  In previous versions of babel-plugin-tester, test-level `setup` and `teardown` functions overrode global `setup` and `teardown` functions. In this version of babel-plugin-tester, the global `setup` and `teardown` functions will be called alongside their test-level counterparts for each test and in a well-defined order (see documentation).

- **Implicit "global" options merging is no longer supported**

  In previous versions of babel-plugin-tester, any test object and fixture configuration option could be passed directly to babel-plugin-tester and apply "globally" across all test objects and fixtures. This was even the case for options that made no sense in a "global" context, such as `only`, `skip`, and `code`. In this version of babel-plugin-tester, only options explicitly listed in the documentation can be passed directly and applied globally. Unrecognized "rest" options are silently ignored.

- **Test/fixture configuration is resolved early and consistently**

  In previous versions of babel-plugin-tester, test object and fixture configuration options were resolved in various places, with some options getting finalized before `it(...)` and `describe(...)` were called and others being determined as Jest was executing the test. In this version, all configuration options are resolved and finalized before `it(...)` and `describe(...)` are called. This also means configurations are finalized \_before\_ hooks like `beforeAll` get called by the testing framework.

- `babelOptions.filename` is now set to `filepath` by default rather than `undefined`.

- In previous versions, the lodash.mergeWith customizer skipped source properties that resolved to `undefined`. With this version, the customizer now unsets these properties (sets them to `undefined`), allowing the end user to easily unset defaults (e.g. `filename`).

- Minimum recommended node version bumped from 10.13.0 to 14.20.0

- Plugin names are once again automatically determined by analyzing the return value of the plugin function. Though this is implemented in a backwards-compatible way, there is a \[small caveat]\([https://github.com/babel-utils/babel-plugin-tester#pluginname-inference-caveat][24]).

### ✨ Features

- Add support for testing presets ([73b90b3][25])
- Implement default filepath inference using Error stack trace ([9d1b321][26])
- **src:** add `exec`/`execFixture` support via Node's VM module ([4754f42][27])
- **src:** add support for "only", "skip", and "title" test options in fixtures ([#90][28]) ([89b58b5][29])
- **src:** add support for arbitrary run order of plugin under test ([#91][30]) ([8c8b858][31])
- **src:** add support for loading prettier configuration files in fixtures ([f54deda][32])
- **src:** add TEST\_SKIP/TEST\_NUM\_SKIP/TEST\_ONLY/TEST\_NUM\_ONLY env variable support ([13626d1][33])
- **src:** bring back (lightweight) plugin name inference ([#92][34]) ([f9ad903][35])
- **src:** implement `titleNumbering` and `restartTitleNumbering` options ([09e792d][36])
- **src:** implement standard `setup`/`teardown` run order ([4ea283f][37])
- **src:** provide debug output support via debug package ([4c7c6e7][38])
- Windows support ([f214995][39])

### 🪄 Fixes

- **src:** ensure test function errors are not swallowed by teardown function errors ([2acfe37][40])
- **src:** fix fixtureOutputExt being ignored in root options.json ([#89][41]) ([481be19][42])
- **src:** fix plugin run order for fixtures to match tests ([#88][43]) ([fbb6c19][44])

### ⚙️ Build System

- **deps:** bump prettier from 2.8.0 to 2.8.1 ([#98][45]) ([0bdb351][46])
- **package:** restore @babel/core\@7.11.6 as minimum supported version ([00712c0][47])
- Transmute codebase to TypeScript ([#96][48]) ([5f588e9][49])
- Update tooling ([d5b4d9c][50])

### 🧙🏿 Refactored

- Lodash.mergeWith customizer now allows unsetting options by setting them to `undefined` ([74af680][51])
- Reorganize source into unified extensible tester pipeline w/ first-class fixtures support ([0c44392][52])

<br />

### 🏗️ Patch babel-plugin-tester[@11.0.4][53] (2023-01-25)

#### 🪄 Fixes

- Ensure exec realm has access to context-sensitive versions of \_\_filename and \_\_dirname globals ([0306698][54])

<br />

### 🏗️ Patch babel-plugin-tester[@11.0.3][55] (2023-01-24)

#### 🪄 Fixes

- Pass full file path to prettier::resolveConfig, not just the dirname ([e9ebcdd][56])

<br />

### 🏗️ Patch babel-plugin-tester[@11.0.2][57] (2023-01-23)

#### 🪄 Fixes

- **src:** use cross-realm symbols ([330aa1e][58])
- Use node-util import compatible with node\@14 ([2c4cd84][59])

#### ⚙️ Build System

- **babel:** explicitly include polyfills for shipped proposals ([850d58c][60])

<br />

### 🏗️ Patch babel-plugin-tester[@11.0.1][61] (2023-01-18)

#### 🪄 Fixes

- **src:** ensure deprecated `config` option is still supported by `prettierFormatter` ([e48badf][62]) <sup>see [#139][63]</sup>

<br />

## babel-plugin-tester[@10.1.0][64] (2021-05-29)

### ✨ Features

- Use babel.transformAsync when it's available ([#84][65]) ([969be11][66])

<br />

## babel-plugin-tester[@10.0.0][67] (2020-10-02)

### 💥 BREAKING CHANGES 💥

- Plugin name inference is no longer supported

### 🪄 Fixes

- **pluginnameinference:** remove the inference. Default to "unknown plugin" ([#78][68]) ([91c22ec][69]) <sup>see [#60][70]</sup>

<br />

## babel-plugin-tester[@9.2.0][71] (2020-05-27)

### ✨ Features

- Add 'fixtureOutputExt' configuration option ([#73][72]) ([ae67eee][73])

<br />

## babel-plugin-tester[@9.1.0][74] (2020-05-20)

### ✨ Features

- Add types from definitely typed ([#70][75]) ([b5569f4][76])

<br />

## babel-plugin-tester[@9.0.0][77] (2020-03-23)

### 💥 BREAKING CHANGES 💥

- Requires Node >= 10.13.0

### 🪄 Fixes

- **node:** update to prettier\@2 and drop Node < 10.13 ([#66][78]) ([1e7ad06][79])

<br />

### 🏗️ Patch babel-plugin-tester[@9.0.1][80] (2020-04-10)

#### 🪄 Fixes

- Apply fix line endings to code and output in two spots ([#68][81]) ([f1c17ef][82])

<br />

## babel-plugin-tester[@8.0.0][83] (2019-11-15)

### 💥 BREAKING CHANGES 💥

- Your snapshots will probably need to be updated with these changes. If you don't like the changes, then take a look at the README about overriding the formatResult and disabling the un-string snapshot serializer

### ✨ Features

- Format result with prettier and unstring snapshots ([#55][84]) ([60e5c07][85])

<br />

### 🏗️ Patch babel-plugin-tester[@8.0.1][86] (2019-12-01)

#### 🪄 Fixes

- Avoid crash when importing without global expect ([#56][87]) ([a134785][88])

<br />

## babel-plugin-tester[@7.0.0][89] (2019-08-19)

### 💥 BREAKING CHANGES 💥

- Require Node 8

### ✨ Features

- Update all the things ([7c8296b][90])

<br />

### 🏗️ Patch babel-plugin-tester[@7.0.4][91] (2019-11-14)

#### 🪄 Fixes

- Set configFile to false by default ([7b97a6f][92])

<br />

### 🏗️ Patch babel-plugin-tester[@7.0.3][93] (2019-11-11)

#### 🪄 Fixes

- Support all babelrc files ([#54][94]) ([dd01d8b][95])

<br />

### 🏗️ Patch babel-plugin-tester[@7.0.2][96] (2019-11-09)

#### 🪄 Fixes

- Remove unnecessary packages ([#52][97]) ([9d1b8ff][98])

<br />

### 🏗️ Patch babel-plugin-tester[@7.0.1][99] (2019-08-19)

#### 🪄 Fixes

- Remove try/catch. ([523fc9a][100])

<br />

## babel-plugin-tester[@6.5.0][101] (2019-08-18)

### ✨ Features

- Jsx and tsx support ([#48][102]) ([9ea1783][103])

<br />

## babel-plugin-tester[@6.4.0][104] (2019-06-12)

### ✨ Features

- Control which linefeed character to use ([#45][105]) ([8c38231][106])

<br />

## babel-plugin-tester[@6.3.0][107] (2019-06-12)

### ✨ Features

- Concat arrays in `babelOptions` ([#43][108]) ([b63e8e1][109])

<br />

### 🏗️ Patch babel-plugin-tester[@6.3.1][110] (2019-06-12)

#### 🪄 Fixes

- Trim input and output correctly ([#44][111]) ([1d22086][112])

<br />

## babel-plugin-tester[@6.2.0][113] (2019-05-12)

### ✨ Features

- **fixtures:** get plugin options for fixtures from options.json ([#41][114]) ([7b9e76d][115])

<br />

### 🏗️ Patch babel-plugin-tester[@6.2.1][116] (2019-05-12)

#### 🪄 Fixes

- **fixtures:** get options from root options.json ([#42][117]) ([556ca0d][118])

<br />

## babel-plugin-tester[@6.1.0][119] (2019-05-04)

### ✨ Features

- **fixtures:** allow formatting fixtures results ([#39][120]) ([e6c219f][121])

<br />

## babel-plugin-tester[@6.0.0][122] (2019-02-14)

### 💥 BREAKING CHANGES 💥

- This upgrades to babel 7. You'll need to use babel 7 as well.

### ✨ Features

- Upgrade to babel 7 ([#37][123]) ([a174a76][124]) <sup>see [#23][125]</sup>

<br />

### 🏗️ Patch babel-plugin-tester[@6.0.1][126] (2019-03-14)

#### 🪄 Fixes

- Avoid returning values in describe blocks ([#38][127]) ([f3d7b5b][128])

<br />

## babel-plugin-tester[@5.5.0][129] (2018-08-05)

### ✨ Features

- Add typescript file extension support ([#32][130]) ([c8e49be][131])

<br />

### 🏗️ Patch babel-plugin-tester[@5.5.2][132] (2018-11-17)

#### 🪄 Fixes

- **output:** allow empty output ([#35][133]) ([0a8d279][134])

<br />

### 🏗️ Patch babel-plugin-tester[@5.5.1][135] (2018-08-17)

#### 🪄 Fixes

- Change babel-core import to optional require in default param ([#33][136]) ([2b33b36][137])

<br />

## babel-plugin-tester[@5.4.0][138] (2018-06-10)

### ✨ Features

- Read nested fixture directories ([#28][139]) ([1efc84a][140])

<br />

## babel-plugin-tester[@5.3.0][141] (2018-06-04)

### ✨ Features

- Create automatically fixtures output.js files for new tests ([#27][142]) ([d48a8fc][143])

<br />

## babel-plugin-tester[@5.2.0][144] (2018-06-04)

### ✨ Features

- Accept fixtureOutputName option for fixtures mode ([#26][145]) ([f3e1ad2][146])

<br />

## babel-plugin-tester[@5.1.0][147] (2018-06-02)

### ✨ Features

- Provide your own implementation of babel ([#25][148]) ([cb230ec][149])

<br />

## babel-plugin-tester[@5.0.0][150] (2017-11-25)

### 💥 BREAKING CHANGES 💥

- You'll have to install `babel-core` yourself now.

### 🪄 Fixes

- Move babel-core to peerDependencies & devDependencies ([#20][151]) ([46c70d1][152])

<br />

## babel-plugin-tester[@4.0.0][153] (2017-08-16)

### 💥 BREAKING CHANGES 💥

- Your snapshots will break (for the better). Just update them. Nothing else changed.

### ✨ Features

- **test-numbers:** only use numbers for tests without titles ([#19][154]) ([6cd36d1][155])

<br />

## babel-plugin-tester[@3.3.0][156] (2017-07-18)

### ✨ Features

- **formatresult:** add `formatResult` option ([#17][157]) ([6085c16][158])

<br />

## babel-plugin-tester[@3.2.0][159] (2017-06-30)

### ✨ Features

- **tests:** add setup/teardown functions ([#14][160]) ([9b30ca3][161])

<br />

### 🏗️ Patch babel-plugin-tester[@3.2.2][162] (2017-07-06)

#### 🪄 Fixes

- Exclude transform-regenerator ([#16][163]) ([10d2b4f][164])

<br />

### 🏗️ Patch babel-plugin-tester[@3.2.1][165] (2017-07-05)

#### 🪄 Fixes

- Assert should be (actual, expected) ([9fcb418][166])

<br />

## babel-plugin-tester[@3.1.0][167] (2017-06-12)

### ✨ Features

- Add ability to pass plugin options ([#13][168]) ([d7aa18a][169])

<br />

## babel-plugin-tester[@3.0.0][170] (2017-05-23)

### 💥 BREAKING CHANGES 💥

- Default parser options changed to remove recast

### 🪄 Fixes

- **release:** manually release a major version ([c78460b][171]) <sup>see [#11][172]</sup>

<br />

## babel-plugin-tester[@2.0.0][173] (2017-05-19)

### 💥 BREAKING CHANGES 💥

- `fixtures` has been repurposed. See the docs.

- `modifier` has been removed, use `only` and `skip` instead

### ✨ Features

- **errors:** add errors config ([#5][174]) ([c157316][175])
- **fixtures:** add `fixtures` directory ([#6][176]) ([6e1554d][177])
- **tests:** add `only` and `skip`, remove `modifier` ([#7][178]) ([ad1d1b1][179])

<br />

## babel-plugin-tester[@1.1.0][180] (2017-05-16)

### ✨ Features

- **tests:** add object API ([df54a40][181])

<br />

### 🏗️ Patch babel-plugin-tester[@1.1.1][182] (2017-05-16)

#### 🪄 Fixes

- Properly deindent and trim code and output ([eb60549][183])

<br />

## babel-plugin-tester[@1.0.0][184] (2017-05-16)

### ✨ Features

- **lib:** initial release ([fe80771][185])

[1]: https://conventionalcommits.org
[2]: https://semver.org
[3]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@11.0.4...babel-plugin-tester@12.0.0
[4]: https://github.com/babel-utils/babel-plugin-tester/commit/e9d5aa1569dd95c5196494e76cdee6570e6e466c
[5]: https://github.com/babel-utils/babel-plugin-tester/issues/186
[6]: https://github.com/babel-utils/babel-plugin-tester/commit/bf0a0885b43047ae273b049b665f5a3442642457
[7]: https://github.com/babel-utils/babel-plugin-tester/commit/333424833c62d33f640219c1e6726d85e27b3342
[8]: https://github.com/babel-utils/babel-plugin-tester/commit/1047e5c8ffbffc9f98f29840709b6169d60a4019
[9]: https://github.com/babel-utils/babel-plugin-tester/commit/89ec951ca008a24a6dc29ff58d7617446b2f584f
[10]: https://github.com/babel-utils/babel-plugin-tester/commit/879dd6bb142cb0cbf6cfaac45174412db94caccb
[11]: https://github.com/babel-utils/babel-plugin-tester/commit/7590b870f2f9229b155a775d3dbe16846961532c
[12]: https://github.com/babel-utils/babel-plugin-tester/commit/3c2538c424b966e0cd79ca24f7f3f37e078df418
[13]: https://github.com/babel-utils/babel-plugin-tester/commit/e0a29da28637f6f0b5af7aac780e12da9cd19476
[14]: https://github.com/babel-utils/babel-plugin-tester/commit/7ea13c3cfa3c36de7f4e89ff6edb7e39caca5bc8
[15]: https://github.com/babel-utils/babel-plugin-tester/commit/76dcccd4b17e5576aa127fb0ae8a4f90da61e3c0
[16]: https://github.com/babel-utils/babel-plugin-tester/commit/bcbb5680d1b9a27714ee12e53b48247da04d965d
[17]: https://github.com/babel-utils/babel-plugin-tester/commit/cbb421524410a755f3faf1f352f4c921416396d7
[18]: https://github.com/babel-utils/babel-plugin-tester/commit/ee6f7dafe1d5b9e6f06398fb26f7a80c843e236e
[19]: https://github.com/babel-utils/babel-plugin-tester/commit/03734eaa985470bea60d71fab1aa0d0dbdddae3c
[20]: https://github.com/babel-utils/babel-plugin-tester/commit/170248dfec838a274d45a92ac5a50952787e6261
[21]: https://github.com/babel-utils/babel-plugin-tester/commit/d0b722fcf8bf958271722ad92798d7b4e1e3a5d7
[22]: https://github.com/babel-utils/babel-plugin-tester/commit/b02d4f05f84c2a3efc302205c9c1cbb754396808
[23]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@10.1.0...babel-plugin-tester@11.0.0
[24]: https://github.com/babel-utils/babel-plugin-tester#pluginname-inference-caveat
[25]: https://github.com/babel-utils/babel-plugin-tester/commit/73b90b347051661ccc37d663419c1d89348dedfb
[26]: https://github.com/babel-utils/babel-plugin-tester/commit/9d1b321e162f337963faf84c2e7a9323c55c5155
[27]: https://github.com/babel-utils/babel-plugin-tester/commit/4754f42d0a6e66b9cd0c26f8ec7b4bc935ac79d4
[28]: https://github.com/babel-utils/babel-plugin-tester/issues/90
[29]: https://github.com/babel-utils/babel-plugin-tester/commit/89b58b5c39b2b43dff77fac7243e7a17c5297053
[30]: https://github.com/babel-utils/babel-plugin-tester/issues/91
[31]: https://github.com/babel-utils/babel-plugin-tester/commit/8c8b858eb8e73493616563552360fb8e7fe8c452
[32]: https://github.com/babel-utils/babel-plugin-tester/commit/f54dedaa9c1cf6f7546d2f1bceaa44407049dd6e
[33]: https://github.com/babel-utils/babel-plugin-tester/commit/13626d16b655a241bdffcb904b085ec62c79c6ec
[34]: https://github.com/babel-utils/babel-plugin-tester/issues/92
[35]: https://github.com/babel-utils/babel-plugin-tester/commit/f9ad9034e062c48ae0aeab85248ee0cefc991853
[36]: https://github.com/babel-utils/babel-plugin-tester/commit/09e792da2de0c5ac802c58096fb3dd03b7eb0b52
[37]: https://github.com/babel-utils/babel-plugin-tester/commit/4ea283f4e73d69b7e77abb982c76cf4ff0d6b0e4
[38]: https://github.com/babel-utils/babel-plugin-tester/commit/4c7c6e7094680d21ab59786b7f87fcfcfde332d2
[39]: https://github.com/babel-utils/babel-plugin-tester/commit/f214995024e8c86ada4f9fd4b2a927e1767920a7
[40]: https://github.com/babel-utils/babel-plugin-tester/commit/2acfe37996080c26d96504b9837bc2dc5284eaa2
[41]: https://github.com/babel-utils/babel-plugin-tester/issues/89
[42]: https://github.com/babel-utils/babel-plugin-tester/commit/481be191651b3b5d4a0fd550146a76a6e1e819c4
[43]: https://github.com/babel-utils/babel-plugin-tester/issues/88
[44]: https://github.com/babel-utils/babel-plugin-tester/commit/fbb6c1924f7f44d72ec12892cdce1df9aea09528
[45]: https://github.com/babel-utils/babel-plugin-tester/issues/98
[46]: https://github.com/babel-utils/babel-plugin-tester/commit/0bdb3515c69a0eaef2e9cb251772083e946e425a
[47]: https://github.com/babel-utils/babel-plugin-tester/commit/00712c067253599c37b43cdf648c232be414e0a9
[48]: https://github.com/babel-utils/babel-plugin-tester/issues/96
[49]: https://github.com/babel-utils/babel-plugin-tester/commit/5f588e9b8e38eb265037a8af54f442e42c302368
[50]: https://github.com/babel-utils/babel-plugin-tester/commit/d5b4d9c207c3499851025b06449114585f494d1f
[51]: https://github.com/babel-utils/babel-plugin-tester/commit/74af680467dbc663cb82a5cd9c6581d1b5216ae5
[52]: https://github.com/babel-utils/babel-plugin-tester/commit/0c4439292839da87508d027cbfbf2b7a96e7d6e7
[53]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@11.0.3...babel-plugin-tester@11.0.4
[54]: https://github.com/babel-utils/babel-plugin-tester/commit/03066985e981da21f3899cb6b1e0957295cdb996
[55]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@11.0.2...babel-plugin-tester@11.0.3
[56]: https://github.com/babel-utils/babel-plugin-tester/commit/e9ebcdd66f2957da540c86e34994a3a0c910c50d
[57]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@11.0.1...babel-plugin-tester@11.0.2
[58]: https://github.com/babel-utils/babel-plugin-tester/commit/330aa1e43c7f0205cec2aa37fc5eaf838d4880d5
[59]: https://github.com/babel-utils/babel-plugin-tester/commit/2c4cd8463146f28b9e42a8e0fd5deb0280c26b1e
[60]: https://github.com/babel-utils/babel-plugin-tester/commit/850d58cc747f0dfbb576b1117f4ed75117c48633
[61]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@11.0.0...babel-plugin-tester@11.0.1
[62]: https://github.com/babel-utils/babel-plugin-tester/commit/e48badf20a709c4b6c4c6fdc5600344af1095cf8
[63]: https://github.com/babel-utils/babel-plugin-tester/issues/139
[64]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@10.0.0...babel-plugin-tester@10.1.0
[65]: https://github.com/babel-utils/babel-plugin-tester/issues/84
[66]: https://github.com/babel-utils/babel-plugin-tester/commit/969be117ee279603244d0b413156c7995f403bd1
[67]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@9.2.0...babel-plugin-tester@10.0.0
[68]: https://github.com/babel-utils/babel-plugin-tester/issues/78
[69]: https://github.com/babel-utils/babel-plugin-tester/commit/91c22ecc29598db2a99b16df29d986087e9cd1b4
[70]: https://github.com/babel-utils/babel-plugin-tester/issues/60
[71]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@9.1.0...babel-plugin-tester@9.2.0
[72]: https://github.com/babel-utils/babel-plugin-tester/issues/73
[73]: https://github.com/babel-utils/babel-plugin-tester/commit/ae67eeee0c344f066ebb518ae61498383f2e9167
[74]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@9.0.1...babel-plugin-tester@9.1.0
[75]: https://github.com/babel-utils/babel-plugin-tester/issues/70
[76]: https://github.com/babel-utils/babel-plugin-tester/commit/b5569f48a90b3163ab7bdab8ab8d7f3bd50a49e8
[77]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@8.0.1...babel-plugin-tester@9.0.0
[78]: https://github.com/babel-utils/babel-plugin-tester/issues/66
[79]: https://github.com/babel-utils/babel-plugin-tester/commit/1e7ad06bd20c26d1f933867bada159ec5d52e94f
[80]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@9.0.0...babel-plugin-tester@9.0.1
[81]: https://github.com/babel-utils/babel-plugin-tester/issues/68
[82]: https://github.com/babel-utils/babel-plugin-tester/commit/f1c17ef49a3fc06cf030c34c9fa95c52a56ea929
[83]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@7.0.4...babel-plugin-tester@8.0.0
[84]: https://github.com/babel-utils/babel-plugin-tester/issues/55
[85]: https://github.com/babel-utils/babel-plugin-tester/commit/60e5c078cd6d60894dd3bc20cb062d09eae562af
[86]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@8.0.0...babel-plugin-tester@8.0.1
[87]: https://github.com/babel-utils/babel-plugin-tester/issues/56
[88]: https://github.com/babel-utils/babel-plugin-tester/commit/a13478519634702e87802ee5d761c88c04854098
[89]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@6.5.0...babel-plugin-tester@7.0.0
[90]: https://github.com/babel-utils/babel-plugin-tester/commit/7c8296b7e8f9af13de2c7879f8c3a0098c9a957b
[91]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@7.0.3...babel-plugin-tester@7.0.4
[92]: https://github.com/babel-utils/babel-plugin-tester/commit/7b97a6f3931bf1f13727b220c5dd6e468286f09b
[93]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@7.0.2...babel-plugin-tester@7.0.3
[94]: https://github.com/babel-utils/babel-plugin-tester/issues/54
[95]: https://github.com/babel-utils/babel-plugin-tester/commit/dd01d8bf5698b8517be7e1bbb9a273618a33d5ae
[96]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@7.0.1...babel-plugin-tester@7.0.2
[97]: https://github.com/babel-utils/babel-plugin-tester/issues/52
[98]: https://github.com/babel-utils/babel-plugin-tester/commit/9d1b8ff0e3145166639c27017da6bb935572fb2c
[99]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@7.0.0...babel-plugin-tester@7.0.1
[100]: https://github.com/babel-utils/babel-plugin-tester/commit/523fc9a0489d5a4edb4d21b305e6eb71335e273f
[101]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@6.4.0...babel-plugin-tester@6.5.0
[102]: https://github.com/babel-utils/babel-plugin-tester/issues/48
[103]: https://github.com/babel-utils/babel-plugin-tester/commit/9ea178305756496e1d5039665af6fddd4419630b
[104]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@6.3.1...babel-plugin-tester@6.4.0
[105]: https://github.com/babel-utils/babel-plugin-tester/issues/45
[106]: https://github.com/babel-utils/babel-plugin-tester/commit/8c382315912a2df755c17aa767c947f4538f5616
[107]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@6.2.1...babel-plugin-tester@6.3.0
[108]: https://github.com/babel-utils/babel-plugin-tester/issues/43
[109]: https://github.com/babel-utils/babel-plugin-tester/commit/b63e8e13208d6724494c1bbbe9ff8aefffb412ca
[110]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@6.3.0...babel-plugin-tester@6.3.1
[111]: https://github.com/babel-utils/babel-plugin-tester/issues/44
[112]: https://github.com/babel-utils/babel-plugin-tester/commit/1d220860c4b2f10c78592fbe0d87c53639b897aa
[113]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@6.1.0...babel-plugin-tester@6.2.0
[114]: https://github.com/babel-utils/babel-plugin-tester/issues/41
[115]: https://github.com/babel-utils/babel-plugin-tester/commit/7b9e76d1dc8f5dc2a787fd9897647613ccde2e37
[116]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@6.2.0...babel-plugin-tester@6.2.1
[117]: https://github.com/babel-utils/babel-plugin-tester/issues/42
[118]: https://github.com/babel-utils/babel-plugin-tester/commit/556ca0d37c753d9a0e0653fa956853f2299967e4
[119]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@6.0.1...babel-plugin-tester@6.1.0
[120]: https://github.com/babel-utils/babel-plugin-tester/issues/39
[121]: https://github.com/babel-utils/babel-plugin-tester/commit/e6c219f8ce1f57837e8bc3e17127c0f4e07843a6
[122]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@5.5.2...babel-plugin-tester@6.0.0
[123]: https://github.com/babel-utils/babel-plugin-tester/issues/37
[124]: https://github.com/babel-utils/babel-plugin-tester/commit/a174a762f4a20a08ea67816ca0040488156655d3
[125]: https://github.com/babel-utils/babel-plugin-tester/issues/23
[126]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@6.0.0...babel-plugin-tester@6.0.1
[127]: https://github.com/babel-utils/babel-plugin-tester/issues/38
[128]: https://github.com/babel-utils/babel-plugin-tester/commit/f3d7b5b4b7384e601233e1967764be5c91266991
[129]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@5.4.0...babel-plugin-tester@5.5.0
[130]: https://github.com/babel-utils/babel-plugin-tester/issues/32
[131]: https://github.com/babel-utils/babel-plugin-tester/commit/c8e49be56250c552c2d117305170d51e5febf389
[132]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@5.5.1...babel-plugin-tester@5.5.2
[133]: https://github.com/babel-utils/babel-plugin-tester/issues/35
[134]: https://github.com/babel-utils/babel-plugin-tester/commit/0a8d27909c6afd055d89f940c2cf3182491b4e6c
[135]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@5.5.0...babel-plugin-tester@5.5.1
[136]: https://github.com/babel-utils/babel-plugin-tester/issues/33
[137]: https://github.com/babel-utils/babel-plugin-tester/commit/2b33b362f5fff648a76265a96b54afb2958cf765
[138]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@5.3.0...babel-plugin-tester@5.4.0
[139]: https://github.com/babel-utils/babel-plugin-tester/issues/28
[140]: https://github.com/babel-utils/babel-plugin-tester/commit/1efc84a7fbe56973890d1398da59b459929c1b65
[141]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@5.2.0...babel-plugin-tester@5.3.0
[142]: https://github.com/babel-utils/babel-plugin-tester/issues/27
[143]: https://github.com/babel-utils/babel-plugin-tester/commit/d48a8fc2ea941dddf50dbcedaf136ab7d2618522
[144]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@5.1.0...babel-plugin-tester@5.2.0
[145]: https://github.com/babel-utils/babel-plugin-tester/issues/26
[146]: https://github.com/babel-utils/babel-plugin-tester/commit/f3e1ad2417a27560fb9ac4de1effdb0e4e57234d
[147]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@5.0.0...babel-plugin-tester@5.1.0
[148]: https://github.com/babel-utils/babel-plugin-tester/issues/25
[149]: https://github.com/babel-utils/babel-plugin-tester/commit/cb230ec291a18a7298451aec2128eceb15712abf
[150]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@4.0.0...babel-plugin-tester@5.0.0
[151]: https://github.com/babel-utils/babel-plugin-tester/issues/20
[152]: https://github.com/babel-utils/babel-plugin-tester/commit/46c70d1fd0fd3d1c683230b8a5639ee3759770a3
[153]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@3.3.0...babel-plugin-tester@4.0.0
[154]: https://github.com/babel-utils/babel-plugin-tester/issues/19
[155]: https://github.com/babel-utils/babel-plugin-tester/commit/6cd36d153598ba0356642cbdedc1c7ab5206d3b6
[156]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@3.2.2...babel-plugin-tester@3.3.0
[157]: https://github.com/babel-utils/babel-plugin-tester/issues/17
[158]: https://github.com/babel-utils/babel-plugin-tester/commit/6085c16ff6d15c2651b0ade26d536e42838d337f
[159]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@3.1.0...babel-plugin-tester@3.2.0
[160]: https://github.com/babel-utils/babel-plugin-tester/issues/14
[161]: https://github.com/babel-utils/babel-plugin-tester/commit/9b30ca31c4e165372aaa95bd5a8111d2b1e79207
[162]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@3.2.1...babel-plugin-tester@3.2.2
[163]: https://github.com/babel-utils/babel-plugin-tester/issues/16
[164]: https://github.com/babel-utils/babel-plugin-tester/commit/10d2b4f09750bf29454800becdd6224807dd4b97
[165]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@3.2.0...babel-plugin-tester@3.2.1
[166]: https://github.com/babel-utils/babel-plugin-tester/commit/9fcb41816267f360a04f040135c8965cb2c5affd
[167]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@3.0.0...babel-plugin-tester@3.1.0
[168]: https://github.com/babel-utils/babel-plugin-tester/issues/13
[169]: https://github.com/babel-utils/babel-plugin-tester/commit/d7aa18ac37fd19e74f6755143cf3152fcc6fa8f7
[170]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@2.0.0...babel-plugin-tester@3.0.0
[171]: https://github.com/babel-utils/babel-plugin-tester/commit/c78460bf77561c6b61c0a3191ccacb188f23fefc
[172]: https://github.com/babel-utils/babel-plugin-tester/issues/11
[173]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@1.1.1...babel-plugin-tester@2.0.0
[174]: https://github.com/babel-utils/babel-plugin-tester/issues/5
[175]: https://github.com/babel-utils/babel-plugin-tester/commit/c157316dd261ada775910e21b7a6eedbaf147582
[176]: https://github.com/babel-utils/babel-plugin-tester/issues/6
[177]: https://github.com/babel-utils/babel-plugin-tester/commit/6e1554d5036225bb31a211e9efd3929b5d5c8509
[178]: https://github.com/babel-utils/babel-plugin-tester/issues/7
[179]: https://github.com/babel-utils/babel-plugin-tester/commit/ad1d1b13ccb3f31d47c15360b8f80ccc742e74be
[180]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@1.0.0...babel-plugin-tester@1.1.0
[181]: https://github.com/babel-utils/babel-plugin-tester/commit/df54a4063df7b7ef9c73ddea2864dccff64ffbb8
[182]: https://github.com/babel-utils/babel-plugin-tester/compare/babel-plugin-tester@1.1.0...babel-plugin-tester@1.1.1
[183]: https://github.com/babel-utils/babel-plugin-tester/commit/eb60549ebfe9a520f3fe3ca6852d50ab84464831
[184]: https://github.com/babel-utils/babel-plugin-tester/compare/fe80771efd866473899de03d66fcf940236ac753...babel-plugin-tester@1.0.0
[185]: https://github.com/babel-utils/babel-plugin-tester/commit/fe80771efd866473899de03d66fcf940236ac753
