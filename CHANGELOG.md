# Changelog

All notable changes to this project will be documented in this auto-generated
file. The format is based on [Conventional Commits][1];
this project adheres to [Semantic Versioning][2].

<br />

## babel-plugin-tester\@12.0.0-Canary.1 (2025-01-02)

### 💥 Breaking Changes 💥

- `babelOptions.filename` is now set to `filepath` by default rather than `undefined`.

- `error` no longer accepts arbitrary class constructors

`error` (aka `throws`) no longer accepts arbitrary class constructors. Any provided class constructor must extend `Error`, e.g. built-ins like `SyntaxError` or custom error classes like `class MyError extends Error`. Thanks to the nature of JavaScript, **providing a class constructor that does not extend `Error` will lead to undefined behavior**.

- `error` only captures exceptions from Babel

`error` (aka `throws`) no longer potentially captures exceptions thrown by the `formatResult` function. If the `formatResult` function throws, the entire test will fail immediately.

- `fixtures` has been repurposed. See the docs.

- `modifier` has been removed, use `only` and `skip` instead

- `TypeError` for config error; `AssertionError` for test error

All configuration-related issues now throw `TypeError` instead of `AssertionError`. `AssertionError` is now exclusively used for failing tests. Additionally, the text of some error messages has been updated.

- Adoption of prettier\@3 requires some versions of Node to be executed with the `--experimental-vm-modules` option. E.g. `NODE_OPTIONS="--no-warnings --experimental-vm-modules" npx jest`.

- All test titles are now numbered

All test titles are now numbered (e.g. `"1. ..."`, `"2. ..."`, etc), including fixtures tests and tests with custom titles.

- Attempting to install babel-plugin-tester alongside jest@<30 will cause NPM to fail with `ERESOLVE`. This is because only jest@>=30 (jest-snapshot) supports the prettier\@3 asynchronous interface.

- Built-in TypeScript support

TypeScript types are now included within the package itself, obviating the need to install a separate types package. Installing the old types package alongside this version of babel-plugin-tester will cause conflicts.

- Default exports are no longer available. See usage instructions for details on proper import syntax.

- Default parser options changed to remove recast

- Due to prettier\@3 forcing downstream adoption of their asynchronous interface, `ResultFormatter` is no longer synchronous and can now return a `Promise`.

- Fixture configuration schema is standardized

In previous versions of babel-plugin-tester, you could provide any key to `options.json` and it would be passed as-is to the plugin under test. This made it impossible to allow fixtures to be configured with the same flexibility as test objects. In this version of babel-plugin-tester, fixture `options.json` (and `options.js`) files must return a standard set of options. Non-standard properties are silently ignored. For instance: to pass options to the plugin under test, they must be provided via `pluginOptions`.

- Global `describe` and `it` functions must be defined

Babel-plugin-tester will refuse to run if `describe`, `it`, `it.only`, or `it.skip` are not globally available.

- Global `setup`/`teardown` no longer overwrites local versions

In previous versions of babel-plugin-tester, test-level `setup` and `teardown` functions overrode global `setup` and `teardown` functions. In this version of babel-plugin-tester, the global `setup` and `teardown` functions will be called alongside their test-level counterparts for each test and in a well-defined order (see documentation).

- Implicit "global" options merging is no longer supported

In previous versions of babel-plugin-tester, any test object and fixture configuration option could be passed directly to babel-plugin-tester and apply "globally" across all test objects and fixtures. This was even the case for options that made no sense in a "global" context, such as `only`, `skip`, and `code`. In this version of babel-plugin-tester, only options explicitly listed in the documentation can be passed directly and applied globally. Unrecognized "rest" options are silently ignored.

- In previous versions, the lodash.mergeWith customizer skipped source properties that resolved to `undefined`. With this version, the customizer now unsets these properties (sets them to `undefined`), allowing the end user to easily unset defaults (e.g. `filename`).

- Minimum recommended node version bumped from 10.13.0 to 14.20.0

- Minimum supported Node.js version is now 20.18.0

- Plugin name inference is no longer supported

- Plugin names are once again automatically determined by analyzing the return value of the plugin function. Though this is implemented in a backwards-compatible way, there is a [small caveat][3].

- Require Node 8

- Requires Node >= 10.13.0

- Test/fixture configuration is resolved early and consistently

In previous versions of babel-plugin-tester, test object and fixture configuration options were resolved in various places, with some options getting finalized before `it(...)` and `describe(...)` were called and others being determined as Jest was executing the test. In this version, all configuration options are resolved and finalized before `it(...)` and `describe(...)` are called. This also means configurations are finalized _before_ hooks like `beforeAll` get called by the testing framework.

- This upgrades to babel 7. You'll need to use babel 7 as well.

- You'll have to install `babel-core` yourself now.

- Your snapshots will break (for the better). Just update them. Nothing else changed.

- Your snapshots will probably need to be updated with these changes. If you don't like the changes, then take a look at the README about overriding the formatResult and disabling the un-string snapshot serializer

### ✨ Features

- Accept fixtureOutputName option for fixtures mode ([#26][4]) ([f3e1ad2][5])
- Add 'fixtureOutputExt' configuration option ([#73][6]) ([ae67eee][7])
- Add ability to pass plugin options ([#13][8]) ([d7aa18a][9])
- Add support for testing presets ([73b90b3][10])
- Add types from definitely typed ([#70][11]) ([b5569f4][12])
- Add typescript file extension support ([#32][13]) ([c8e49be][14])
- Allow testing entire babel transform result via `outputRaw` ([e9d5aa1][15]) <sup>see [#186][16]</sup>
- Concat arrays in `babelOptions` ([#43][17]) ([b63e8e1][18])
- Control which linefeed character to use ([#45][19]) ([8c38231][20])
- Create automatically fixtures output.js files for new tests ([#27][21]) ([d48a8fc][22])
- **errors:** add errors config ([#5][23]) ([c157316][24])
- **fixtures:** add `fixtures` directory ([#6][25]) ([6e1554d][26])
- **fixtures:** allow formatting fixtures results ([#39][27]) ([e6c219f][28])
- **fixtures:** get plugin options for fixtures from options.json ([#41][29]) ([7b9e76d][30])
- Format result with prettier and unstring snapshots ([#55][31]) ([60e5c07][32])
- **formatresult:** add `formatResult` option ([#17][33]) ([6085c16][34])
- Implement default filepath inference using Error stack trace ([9d1b321][35])
- Jsx and tsx support ([#48][36]) ([9ea1783][37])
- **lib:** initial release ([fe80771][38])
- Provide your own implementation of babel ([#25][39]) ([cb230ec][40])
- Read nested fixture directories ([#28][41]) ([1efc84a][42])
- **src:** add `exec`/`execFixture` support via Node's VM module ([4754f42][43])
- **src:** add support for "only", "skip", and "title" test options in fixtures ([#90][44]) ([89b58b5][45])
- **src:** add support for arbitrary run order of plugin under test ([#91][46]) ([8c8b858][47])
- **src:** add support for loading prettier configuration files in fixtures ([f54deda][48])
- **src:** add TEST\_SKIP/TEST\_NUM\_SKIP/TEST\_ONLY/TEST\_NUM\_ONLY env variable support ([13626d1][49])
- **src:** bring back (lightweight) plugin name inference ([#92][50]) ([f9ad903][51])
- **src:** implement `titleNumbering` and `restartTitleNumbering` options ([09e792d][52])
- **src:** implement standard `setup`/`teardown` run order ([4ea283f][53])
- **src:** provide debug output support via debug package ([4c7c6e7][54])
- **test-numbers:** only use numbers for tests without titles ([#19][55]) ([6cd36d1][56])
- **tests:** add `only` and `skip`, remove `modifier` ([#7][57]) ([ad1d1b1][58])
- **tests:** add object API ([df54a40][59])
- **tests:** add setup/teardown functions ([#14][60]) ([9b30ca3][61])
- Update all the things ([7c8296b][62])
- Upgrade to babel 7 ([#37][63]) ([a174a76][64]) <sup>see [#23][65]</sup>
- Upgrade to prettier\@3 ([3334248][66])
- Use babel.transformAsync when it's available ([#84][67]) ([969be11][68])
- Windows support ([f214995][69])

### 🪄 Fixes

- Apply fix line endings to code and output in two spots ([#68][70]) ([f1c17ef][71])
- Assert should be (actual, expected) ([9fcb418][72])
- Avoid crash when importing without global expect ([#56][73]) ([a134785][74])
- Avoid returning values in describe blocks ([#38][75]) ([f3d7b5b][76])
- Change babel-core import to optional require in default param ([#33][77]) ([2b33b36][78])
- Ensure exec realm has access to context-sensitive versions of \_\_filename and \_\_dirname globals ([0306698][79])
- Exclude transform-regenerator ([#16][80]) ([10d2b4f][81])
- **fixtures:** get options from root options.json ([#42][82]) ([556ca0d][83])
- Move babel-core to peerDependencies & devDependencies ([#20][84]) ([46c70d1][85])
- **node:** update to prettier\@2 and drop Node < 10.13 ([#66][86]) ([1e7ad06][87])
- **output:** allow empty output ([#35][88]) ([0a8d279][89])
- Pass full file path to prettier::resolveConfig, not just the dirname ([e9ebcdd][90])
- **pluginnameinference:** remove the inference. Default to "unknown plugin" ([#78][91]) ([91c22ec][92]) <sup>see [#60][93]</sup>
- Properly deindent and trim code and output ([eb60549][94])
- **readme:** use proper codecov coverage badge ([1047e5c][95])
- **release:** manually release a major version ([c78460b][96]) <sup>see [#11][97]</sup>
- Remove try/catch. ([523fc9a][98])
- Remove unnecessary packages ([#52][99]) ([9d1b8ff][100])
- Set configFile to false by default ([7b97a6f][101])
- **src:** ensure deprecated `config` option is still supported by `prettierFormatter` ([e48badf][102]) <sup>see [#139][103]</sup>
- **src:** ensure test function errors are not swallowed by teardown function errors ([2acfe37][104])
- **src:** fix fixtureOutputExt being ignored in root options.json ([#89][105]) ([481be19][106])
- **src:** fix plugin run order for fixtures to match tests ([#88][107]) ([fbb6c19][108])
- **src:** use cross-realm symbols ([330aa1e][109])
- Support all babelrc files ([#54][110]) ([dd01d8b][111])
- Trim input and output correctly ([#44][112]) ([1d22086][113])
- Use node-util import compatible with node\@14 ([2c4cd84][114])

### ⚙️ Build System

- **babel:** explicitly include polyfills for shipped proposals ([850d58c][115])
- **deps:** bump prettier from 2.8.0 to 2.8.1 ([#98][116]) ([0bdb351][117])
- **package:** bump minimum supported node versions to maintained ([ee6f7da][118])
- **package:** restore @babel/core\@7.11.6 as minimum supported version ([00712c0][119])
- Transmute codebase to TypeScript ([#96][120]) ([5f588e9][121])
- Update core-js to 3.33 ([170248d][122])
- Update tooling ([d5b4d9c][123])
- Upgrade typescript-babel toolchain to nodenext ([d0b722f][124])

### 🧙🏿 Refactored

- Lodash.mergeWith customizer now allows unsetting options by setting them to `undefined` ([74af680][125])
- Reorganize source into unified extensible tester pipeline w/ first-class fixtures support ([0c44392][126])
- **src:** deprecated default exports are no longer available ([b02d4f0][127])

[1]: https://conventionalcommits.org
[2]: https://semver.org
[3]: https://github.com/babel-utils/babel-plugin-tester#pluginname-inference-caveat
[4]: https://github.com/babel-utils/babel-plugin-tester/issues/26
[5]: https://github.com/babel-utils/babel-plugin-tester/commit/f3e1ad2417a27560fb9ac4de1effdb0e4e57234d
[6]: https://github.com/babel-utils/babel-plugin-tester/issues/73
[7]: https://github.com/babel-utils/babel-plugin-tester/commit/ae67eeee0c344f066ebb518ae61498383f2e9167
[8]: https://github.com/babel-utils/babel-plugin-tester/issues/13
[9]: https://github.com/babel-utils/babel-plugin-tester/commit/d7aa18ac37fd19e74f6755143cf3152fcc6fa8f7
[10]: https://github.com/babel-utils/babel-plugin-tester/commit/73b90b347051661ccc37d663419c1d89348dedfb
[11]: https://github.com/babel-utils/babel-plugin-tester/issues/70
[12]: https://github.com/babel-utils/babel-plugin-tester/commit/b5569f48a90b3163ab7bdab8ab8d7f3bd50a49e8
[13]: https://github.com/babel-utils/babel-plugin-tester/issues/32
[14]: https://github.com/babel-utils/babel-plugin-tester/commit/c8e49be56250c552c2d117305170d51e5febf389
[15]: https://github.com/babel-utils/babel-plugin-tester/commit/e9d5aa1569dd95c5196494e76cdee6570e6e466c
[16]: https://github.com/babel-utils/babel-plugin-tester/issues/186
[17]: https://github.com/babel-utils/babel-plugin-tester/issues/43
[18]: https://github.com/babel-utils/babel-plugin-tester/commit/b63e8e13208d6724494c1bbbe9ff8aefffb412ca
[19]: https://github.com/babel-utils/babel-plugin-tester/issues/45
[20]: https://github.com/babel-utils/babel-plugin-tester/commit/8c382315912a2df755c17aa767c947f4538f5616
[21]: https://github.com/babel-utils/babel-plugin-tester/issues/27
[22]: https://github.com/babel-utils/babel-plugin-tester/commit/d48a8fc2ea941dddf50dbcedaf136ab7d2618522
[23]: https://github.com/babel-utils/babel-plugin-tester/issues/5
[24]: https://github.com/babel-utils/babel-plugin-tester/commit/c157316dd261ada775910e21b7a6eedbaf147582
[25]: https://github.com/babel-utils/babel-plugin-tester/issues/6
[26]: https://github.com/babel-utils/babel-plugin-tester/commit/6e1554d5036225bb31a211e9efd3929b5d5c8509
[27]: https://github.com/babel-utils/babel-plugin-tester/issues/39
[28]: https://github.com/babel-utils/babel-plugin-tester/commit/e6c219f8ce1f57837e8bc3e17127c0f4e07843a6
[29]: https://github.com/babel-utils/babel-plugin-tester/issues/41
[30]: https://github.com/babel-utils/babel-plugin-tester/commit/7b9e76d1dc8f5dc2a787fd9897647613ccde2e37
[31]: https://github.com/babel-utils/babel-plugin-tester/issues/55
[32]: https://github.com/babel-utils/babel-plugin-tester/commit/60e5c078cd6d60894dd3bc20cb062d09eae562af
[33]: https://github.com/babel-utils/babel-plugin-tester/issues/17
[34]: https://github.com/babel-utils/babel-plugin-tester/commit/6085c16ff6d15c2651b0ade26d536e42838d337f
[35]: https://github.com/babel-utils/babel-plugin-tester/commit/9d1b321e162f337963faf84c2e7a9323c55c5155
[36]: https://github.com/babel-utils/babel-plugin-tester/issues/48
[37]: https://github.com/babel-utils/babel-plugin-tester/commit/9ea178305756496e1d5039665af6fddd4419630b
[38]: https://github.com/babel-utils/babel-plugin-tester/commit/fe80771efd866473899de03d66fcf940236ac753
[39]: https://github.com/babel-utils/babel-plugin-tester/issues/25
[40]: https://github.com/babel-utils/babel-plugin-tester/commit/cb230ec291a18a7298451aec2128eceb15712abf
[41]: https://github.com/babel-utils/babel-plugin-tester/issues/28
[42]: https://github.com/babel-utils/babel-plugin-tester/commit/1efc84a7fbe56973890d1398da59b459929c1b65
[43]: https://github.com/babel-utils/babel-plugin-tester/commit/4754f42d0a6e66b9cd0c26f8ec7b4bc935ac79d4
[44]: https://github.com/babel-utils/babel-plugin-tester/issues/90
[45]: https://github.com/babel-utils/babel-plugin-tester/commit/89b58b5c39b2b43dff77fac7243e7a17c5297053
[46]: https://github.com/babel-utils/babel-plugin-tester/issues/91
[47]: https://github.com/babel-utils/babel-plugin-tester/commit/8c8b858eb8e73493616563552360fb8e7fe8c452
[48]: https://github.com/babel-utils/babel-plugin-tester/commit/f54dedaa9c1cf6f7546d2f1bceaa44407049dd6e
[49]: https://github.com/babel-utils/babel-plugin-tester/commit/13626d16b655a241bdffcb904b085ec62c79c6ec
[50]: https://github.com/babel-utils/babel-plugin-tester/issues/92
[51]: https://github.com/babel-utils/babel-plugin-tester/commit/f9ad9034e062c48ae0aeab85248ee0cefc991853
[52]: https://github.com/babel-utils/babel-plugin-tester/commit/09e792da2de0c5ac802c58096fb3dd03b7eb0b52
[53]: https://github.com/babel-utils/babel-plugin-tester/commit/4ea283f4e73d69b7e77abb982c76cf4ff0d6b0e4
[54]: https://github.com/babel-utils/babel-plugin-tester/commit/4c7c6e7094680d21ab59786b7f87fcfcfde332d2
[55]: https://github.com/babel-utils/babel-plugin-tester/issues/19
[56]: https://github.com/babel-utils/babel-plugin-tester/commit/6cd36d153598ba0356642cbdedc1c7ab5206d3b6
[57]: https://github.com/babel-utils/babel-plugin-tester/issues/7
[58]: https://github.com/babel-utils/babel-plugin-tester/commit/ad1d1b13ccb3f31d47c15360b8f80ccc742e74be
[59]: https://github.com/babel-utils/babel-plugin-tester/commit/df54a4063df7b7ef9c73ddea2864dccff64ffbb8
[60]: https://github.com/babel-utils/babel-plugin-tester/issues/14
[61]: https://github.com/babel-utils/babel-plugin-tester/commit/9b30ca31c4e165372aaa95bd5a8111d2b1e79207
[62]: https://github.com/babel-utils/babel-plugin-tester/commit/7c8296b7e8f9af13de2c7879f8c3a0098c9a957b
[63]: https://github.com/babel-utils/babel-plugin-tester/issues/37
[64]: https://github.com/babel-utils/babel-plugin-tester/commit/a174a762f4a20a08ea67816ca0040488156655d3
[65]: https://github.com/babel-utils/babel-plugin-tester/issues/23
[66]: https://github.com/babel-utils/babel-plugin-tester/commit/333424833c62d33f640219c1e6726d85e27b3342
[67]: https://github.com/babel-utils/babel-plugin-tester/issues/84
[68]: https://github.com/babel-utils/babel-plugin-tester/commit/969be117ee279603244d0b413156c7995f403bd1
[69]: https://github.com/babel-utils/babel-plugin-tester/commit/f214995024e8c86ada4f9fd4b2a927e1767920a7
[70]: https://github.com/babel-utils/babel-plugin-tester/issues/68
[71]: https://github.com/babel-utils/babel-plugin-tester/commit/f1c17ef49a3fc06cf030c34c9fa95c52a56ea929
[72]: https://github.com/babel-utils/babel-plugin-tester/commit/9fcb41816267f360a04f040135c8965cb2c5affd
[73]: https://github.com/babel-utils/babel-plugin-tester/issues/56
[74]: https://github.com/babel-utils/babel-plugin-tester/commit/a13478519634702e87802ee5d761c88c04854098
[75]: https://github.com/babel-utils/babel-plugin-tester/issues/38
[76]: https://github.com/babel-utils/babel-plugin-tester/commit/f3d7b5b4b7384e601233e1967764be5c91266991
[77]: https://github.com/babel-utils/babel-plugin-tester/issues/33
[78]: https://github.com/babel-utils/babel-plugin-tester/commit/2b33b362f5fff648a76265a96b54afb2958cf765
[79]: https://github.com/babel-utils/babel-plugin-tester/commit/03066985e981da21f3899cb6b1e0957295cdb996
[80]: https://github.com/babel-utils/babel-plugin-tester/issues/16
[81]: https://github.com/babel-utils/babel-plugin-tester/commit/10d2b4f09750bf29454800becdd6224807dd4b97
[82]: https://github.com/babel-utils/babel-plugin-tester/issues/42
[83]: https://github.com/babel-utils/babel-plugin-tester/commit/556ca0d37c753d9a0e0653fa956853f2299967e4
[84]: https://github.com/babel-utils/babel-plugin-tester/issues/20
[85]: https://github.com/babel-utils/babel-plugin-tester/commit/46c70d1fd0fd3d1c683230b8a5639ee3759770a3
[86]: https://github.com/babel-utils/babel-plugin-tester/issues/66
[87]: https://github.com/babel-utils/babel-plugin-tester/commit/1e7ad06bd20c26d1f933867bada159ec5d52e94f
[88]: https://github.com/babel-utils/babel-plugin-tester/issues/35
[89]: https://github.com/babel-utils/babel-plugin-tester/commit/0a8d27909c6afd055d89f940c2cf3182491b4e6c
[90]: https://github.com/babel-utils/babel-plugin-tester/commit/e9ebcdd66f2957da540c86e34994a3a0c910c50d
[91]: https://github.com/babel-utils/babel-plugin-tester/issues/78
[92]: https://github.com/babel-utils/babel-plugin-tester/commit/91c22ecc29598db2a99b16df29d986087e9cd1b4
[93]: https://github.com/babel-utils/babel-plugin-tester/issues/60
[94]: https://github.com/babel-utils/babel-plugin-tester/commit/eb60549ebfe9a520f3fe3ca6852d50ab84464831
[95]: https://github.com/babel-utils/babel-plugin-tester/commit/1047e5c8ffbffc9f98f29840709b6169d60a4019
[96]: https://github.com/babel-utils/babel-plugin-tester/commit/c78460bf77561c6b61c0a3191ccacb188f23fefc
[97]: https://github.com/babel-utils/babel-plugin-tester/issues/11
[98]: https://github.com/babel-utils/babel-plugin-tester/commit/523fc9a0489d5a4edb4d21b305e6eb71335e273f
[99]: https://github.com/babel-utils/babel-plugin-tester/issues/52
[100]: https://github.com/babel-utils/babel-plugin-tester/commit/9d1b8ff0e3145166639c27017da6bb935572fb2c
[101]: https://github.com/babel-utils/babel-plugin-tester/commit/7b97a6f3931bf1f13727b220c5dd6e468286f09b
[102]: https://github.com/babel-utils/babel-plugin-tester/commit/e48badf20a709c4b6c4c6fdc5600344af1095cf8
[103]: https://github.com/babel-utils/babel-plugin-tester/issues/139
[104]: https://github.com/babel-utils/babel-plugin-tester/commit/2acfe37996080c26d96504b9837bc2dc5284eaa2
[105]: https://github.com/babel-utils/babel-plugin-tester/issues/89
[106]: https://github.com/babel-utils/babel-plugin-tester/commit/481be191651b3b5d4a0fd550146a76a6e1e819c4
[107]: https://github.com/babel-utils/babel-plugin-tester/issues/88
[108]: https://github.com/babel-utils/babel-plugin-tester/commit/fbb6c1924f7f44d72ec12892cdce1df9aea09528
[109]: https://github.com/babel-utils/babel-plugin-tester/commit/330aa1e43c7f0205cec2aa37fc5eaf838d4880d5
[110]: https://github.com/babel-utils/babel-plugin-tester/issues/54
[111]: https://github.com/babel-utils/babel-plugin-tester/commit/dd01d8bf5698b8517be7e1bbb9a273618a33d5ae
[112]: https://github.com/babel-utils/babel-plugin-tester/issues/44
[113]: https://github.com/babel-utils/babel-plugin-tester/commit/1d220860c4b2f10c78592fbe0d87c53639b897aa
[114]: https://github.com/babel-utils/babel-plugin-tester/commit/2c4cd8463146f28b9e42a8e0fd5deb0280c26b1e
[115]: https://github.com/babel-utils/babel-plugin-tester/commit/850d58cc747f0dfbb576b1117f4ed75117c48633
[116]: https://github.com/babel-utils/babel-plugin-tester/issues/98
[117]: https://github.com/babel-utils/babel-plugin-tester/commit/0bdb3515c69a0eaef2e9cb251772083e946e425a
[118]: https://github.com/babel-utils/babel-plugin-tester/commit/ee6f7dafe1d5b9e6f06398fb26f7a80c843e236e
[119]: https://github.com/babel-utils/babel-plugin-tester/commit/00712c067253599c37b43cdf648c232be414e0a9
[120]: https://github.com/babel-utils/babel-plugin-tester/issues/96
[121]: https://github.com/babel-utils/babel-plugin-tester/commit/5f588e9b8e38eb265037a8af54f442e42c302368
[122]: https://github.com/babel-utils/babel-plugin-tester/commit/170248dfec838a274d45a92ac5a50952787e6261
[123]: https://github.com/babel-utils/babel-plugin-tester/commit/d5b4d9c207c3499851025b06449114585f494d1f
[124]: https://github.com/babel-utils/babel-plugin-tester/commit/d0b722fcf8bf958271722ad92798d7b4e1e3a5d7
[125]: https://github.com/babel-utils/babel-plugin-tester/commit/74af680467dbc663cb82a5cd9c6581d1b5216ae5
[126]: https://github.com/babel-utils/babel-plugin-tester/commit/0c4439292839da87508d027cbfbf2b7a96e7d6e7
[127]: https://github.com/babel-utils/babel-plugin-tester/commit/b02d4f05f84c2a3efc302205c9c1cbb754396808
