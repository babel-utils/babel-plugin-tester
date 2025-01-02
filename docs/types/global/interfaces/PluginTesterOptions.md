[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [types/global](../README.md) / PluginTesterOptions

# Interface: PluginTesterOptions

Defined in: types/global.ts:59

Options passed as parameters to the `pluginTester` function.

## See

https://npm.im/babel-plugin-tester#options

## Properties

### babel?

> `optional` **babel**: `object`

Defined in: types/global.ts:116

This is a `pluginTester` option used to provide your own implementation of
babel. This is particularly useful if you want to use a different version
of babel than what's included in this package.

#### transform()

> **transform**: (`code`, `callback`) => `void`(`code`, `opts`, `callback`) => `void`(`code`, `opts`?) => `BabelFileResult` \| `null`

Transforms the passed in code. Calling a callback with an object with the generated code, source map, and AST.

##### Parameters

###### code

`string`

###### callback

`FileResultCallback`

##### Returns

`void`

Transforms the passed in code. Calling a callback with an object with the generated code, source map, and AST.

##### Parameters

###### code

`string`

###### opts

`undefined` | `TransformOptions`

###### callback

`FileResultCallback`

##### Returns

`void`

Here for backward-compatibility. Ideally use `transformSync` if you want a synchronous API.

##### Parameters

###### code

`string`

###### opts?

`TransformOptions`

##### Returns

`BabelFileResult` \| `null`

#### transformAsync()?

> `optional` **transformAsync**: (`code`, `opts`?) => `Promise`\<`BabelFileResult` \| `null`\>

Transforms the passed in code. Calling a callback with an object with the generated code, source map, and AST.

##### Parameters

###### code

`string`

###### opts?

`TransformOptions`

##### Returns

`Promise`\<`BabelFileResult` \| `null`\>

#### See

https://npm.im/babel-plugin-tester#babel

***

### babelOptions?

> `optional` **babelOptions**: `Omit`\<`TransformOptions`, `"plugins"` \| `"presets"`\> & `object`

Defined in: types/global.ts:128

This is a `pluginTester` option used to configure babel.

Note that `babelOptions.babelrc` and `babelOptions.configFile` are set to
`false` by default, which disables automatic babel configuration loading.

#### Type declaration

##### plugins?

> `optional` **plugins**: `null` \| (*typeof* [`runPluginUnderTestHere`](../../../src/plugin-tester/variables/runPluginUnderTestHere.md) \| `PluginItem`)[]

##### presets?

> `optional` **presets**: `null` \| (*typeof* [`runPresetUnderTestHere`](../../../src/plugin-tester/variables/runPresetUnderTestHere.md) \| `PluginItem`)[]

#### See

https://npm.im/babel-plugin-tester#babelOptions

***

### endOfLine?

> `optional` **endOfLine**: `false` \| `"lf"` \| `"crlf"` \| `"auto"` \| `"preserve"`

Defined in: types/global.ts:187

This is a `pluginTester` option used to control which line endings both the
actual output from babel and the expected output will be converted to.
Defaults to `"lf"`.

| Options      | Description                             |
| ------------ | --------------------------------------- |
| `"lf"`       | Unix                                    |
| `"crlf"`     | Windows                                 |
| `"auto"`     | Use the system default                  |
| `"preserve"` | Use the line ending from the input      |
| `false`      | Disable line ending conversion entirely |

#### Default

```ts
"lf"
```

#### See

https://npm.im/babel-plugin-tester#endOfLine

***

### ~~filename?~~

> `optional` **filename**: `string`

Defined in: types/global.ts:170

#### Deprecated

Use `filepath` instead.

#### See

https://npm.im/babel-plugin-tester#filepath

***

### filepath?

> `optional` **filepath**: `string`

Defined in: types/global.ts:165

This is a `pluginTester` option used to resolve relative paths provided by
the `fixtures` option and the two test object properties `codeFixture` and
`outputFixture`. If these are not absolute paths, they will be
`path.join`'d with the directory name of `filepath`.

`filepath` is also passed to `formatResult` (fixture option) and
`formatResult` (test object property).

Defaults to the absolute path of the file that invoked the `pluginTester`
function.

#### See

https://npm.im/babel-plugin-tester#filepath

***

### fixtureOutputExt?

> `optional` **fixtureOutputExt**: `string`

Defined in: types/global.ts:242

This is a `pluginTester` option used to provide a new default output file
extension for all fixtures. This is particularly useful if you are testing
TypeScript input. If omitted, the fixture's input file extension (e.g. the
`js` in `code.js`) will be used instead.

#### See

https://npm.im/babel-plugin-tester#fixtureOutputExt

***

### fixtureOutputName?

> `optional` **fixtureOutputName**: `string`

Defined in: types/global.ts:233

This is a `pluginTester` option used to provide a new default output file
name for all fixtures. Defaults to `"output"`.

#### See

https://npm.im/babel-plugin-tester#fixtureOutputName

#### Default

```ts
"output"
```

***

### fixtures?

> `optional` **fixtures**: `string`

Defined in: types/global.ts:272

This is a `pluginTester` option used to specify a path to a directory
containing tests.

#### See

https://npm.im/babel-plugin-tester#fixtures

***

### formatResult?

> `optional` **formatResult**: [`ResultFormatter`](../type-aliases/ResultFormatter.md)\<`Record`\<`string`, `unknown`\>\>

Defined in: types/global.ts:216

This is a `pluginTester` option used to provide a function that formats
actual babel outputs before they are compared to expected outputs, and
defaults to a function using prettier. If you have prettier configured,
then it will use your configuration. If you don't, then it will use a
default prettier configuration.

#### See

https://npm.im/babel-plugin-tester#formatResult

***

### plugin()?

> `optional` **plugin**: (...`args`) => `PluginObj`\<`any`\>

Defined in: types/global.ts:67

This is a `pluginTester` option used to provide the babel plugin under
test.

#### Parameters

##### args

...`any`[]

#### Returns

`PluginObj`\<`any`\>

#### See

https://npm.im/babel-plugin-tester#plugin

***

### pluginName?

> `optional` **pluginName**: `string`

Defined in: types/global.ts:76

This is a `pluginTester` option used as the describe block name and in your
tests' names. If `pluginName` can be inferred from the `plugin`'s name,
then it will be and you don't need to provide this option. If it cannot be
inferred for whatever reason, `pluginName` defaults to `"unknown plugin"`.

#### See

https://npm.im/babel-plugin-tester#pluginName

***

### pluginOptions?

> `optional` **pluginOptions**: `PluginOptions`

Defined in: types/global.ts:84

This is a `pluginTester` option used to pass options into your plugin at
transform time. This option can be overwritten in a test object or fixture
options.

#### See

https://npm.im/babel-plugin-tester#pluginOptions

***

### preset()?

> `optional` **preset**: (...`args`) => `TransformOptions`

Defined in: types/global.ts:92

This is a `pluginTester` option used to provide the babel preset under
test.

#### Parameters

##### args

...`any`[]

#### Returns

`TransformOptions`

#### See

https://npm.im/babel-plugin-tester#preset

***

### presetName?

> `optional` **presetName**: `string`

Defined in: types/global.ts:100

This is a `pluginTester` option used as the describe block name and in your
tests' names. Defaults to `"unknown preset"`.

#### See

https://npm.im/babel-plugin-tester#presetName

#### Default

```ts
"unknown preset"
```

***

### presetOptions?

> `optional` **presetOptions**: `PluginOptions`

Defined in: types/global.ts:108

This is a `pluginTester` option used to pass options into your preset at
transform time. This option can be overwritten using test object properties
or fixture options.

#### See

https://npm.im/babel-plugin-tester#presetOptions

***

### restartTitleNumbering?

> `optional` **restartTitleNumbering**: `boolean`

Defined in: types/global.ts:265

This is a `pluginTester` option used to restart test title numbering. Set
this value to `true` to restart automatic title numbering at 1.

#### Default

```ts
false
```

#### See

https://npm.im/babel-plugin-tester#restartTitleNumbering

***

### setup?

> `optional` **setup**: [`SetupFunction`](../type-aliases/SetupFunction.md)

Defined in: types/global.ts:196

This is a `pluginTester` option to provide a setup function run before each
test runs. It can return a function which will be treated as a `teardown`
function. It can also return a promise. If that promise resolves to a
function, that will be treated as a `teardown` function.

#### See

https://npm.im/babel-plugin-tester#setup

***

### snapshot?

> `optional` **snapshot**: `boolean`

Defined in: types/global.ts:225

This is a `pluginTester` option for when you prefer to take a snapshot of
all test object outputs rather than compare it to something you hard-code.
When `true`, a snapshot containing both the source code and the output will
be generated for all test object tests.

#### See

https://npm.im/babel-plugin-tester#snapshot

***

### teardown?

> `optional` **teardown**: [`TeardownFunction`](../type-aliases/TeardownFunction.md)

Defined in: types/global.ts:206

This is a `pluginTester` option to provide a teardown function run after
each test runs. Use this function to clean up after tests finish running.
You can either define this as its own property, or you can return it from
the `setup` function. This can likewise return a promise if it's
asynchronous.

#### See

https://npm.im/babel-plugin-tester#teardown

***

### tests?

> `optional` **tests**: (`string` \| [`TestObject`](TestObject.md))[] \| `Record`\<`string`, `string` \| [`TestObject`](TestObject.md)\>

Defined in: types/global.ts:278

This is a `pluginTester` option used to create tests.

#### See

https://npm.im/babel-plugin-tester#tests

***

### title?

> `optional` **title**: `string` \| `false`

Defined in: types/global.ts:150

This is a `pluginTester` option used to specify a custom title for the
describe block (overriding everything else). Set to `false` to prevent the
creation of such an enclosing describe block. Otherwise, the title defaults
to `pluginName`.

#### See

https://npm.im/babel-plugin-tester#title

***

### titleNumbering?

> `optional` **titleNumbering**: `false` \| `"all"` \| `"tests-only"` \| `"fixtures-only"`

Defined in: types/global.ts:257

This is a `pluginTester` option used to determines which test titles are
prefixed with a number when output. Defaults to `"all"`.

| Options           | Description                                         |
| ----------------- | --------------------------------------------------- |
| `"all"`           | All test object and fixtures tests will be numbered |
| `"tests-only"`    | Only test object tests will be numbered             |
| `"fixtures-only"` | Only fixtures tests will be numbered                |
| `false`           | Disable automatic numbering in titles entirely      |

#### Default

```ts
"all"
```

#### See

https://npm.im/babel-plugin-tester#titleNumbering
