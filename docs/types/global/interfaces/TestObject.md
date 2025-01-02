[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [types/global](../README.md) / TestObject

# Interface: TestObject

Defined in: types/global.ts:466

Options provided as properties of a test object for use with the `tests`
option.

## See

https://npm.im/babel-plugin-tester#test-objects

## Properties

### babelOptions?

> `optional` **babelOptions**: `Omit`\<`TransformOptions`, `"plugins"` \| `"presets"`\> & `object`

Defined in: types/global.ts:473

This is a `tests` object option used to configure babel, overriding the
`babelOptions` provided to babel-plugin-tester.

#### Type declaration

##### plugins?

> `optional` **plugins**: `null` \| (*typeof* [`runPluginUnderTestHere`](../../../src/plugin-tester/variables/runPluginUnderTestHere.md) \| `PluginItem`)[]

##### presets?

> `optional` **presets**: `null` \| (*typeof* [`runPresetUnderTestHere`](../../../src/plugin-tester/variables/runPresetUnderTestHere.md) \| `PluginItem`)[]

#### See

https://npm.im/babel-plugin-tester#babelOptions-2

***

### code?

> `optional` **code**: `string`

Defined in: types/global.ts:613

This is a `tests` object option providing the code that you want babel to
transform using your plugin or preset. This must be provided unless you're
using the `codeFixture` or `exec` properties instead. If you do not provide
the `output` or `outputFixture` properties and `snapshot` is not `true`,
then the assertion is that this code is unchanged by the transformation.

#### See

https://npm.im/babel-plugin-tester#code

***

### codeFixture?

> `optional` **codeFixture**: `string`

Defined in: types/global.ts:651

This is a `tests` object option for when you'd rather put your `code` in a
separate file. If an absolute file path is provided here, then that's the
file that will be loaded. Otherwise, `codeFixture` will be `path.join`'d
with the directory name of `filepath`.

If you find you're using this option more than a couple of times, consider
using _`fixtures`_ instead.

#### See

https://npm.im/babel-plugin-tester#codeFixture

***

### error?

> `optional` **error**: [`ErrorExpectation`](../type-aliases/ErrorExpectation.md)

Defined in: types/global.ts:566

This is a `tests` object option used to assert that this test should throw
an error during transformation. For example:

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

Note that this property is ignored when using the `exec` property.

For backwards compatibility reasons, `error` is synonymous with `throws`.
They can be used interchangeably.

#### See

https://npm.im/babel-plugin-tester#throws-1

***

### exec?

> `optional` **exec**: `string`

Defined in: types/global.ts:639

This is a `tests` object option that will be transformed just like the
`code` property, except the output will be _evaluated_ in the same context
as the the test runner itself, meaning it has access to `expect`,
`require`, etc. Use this to make advanced assertions on the output.

#### See

https://npm.im/babel-plugin-tester#exec

***

### execFixture?

> `optional` **execFixture**: `string`

Defined in: types/global.ts:680

This is a `tests` object option for when you'd rather put your `exec` in a
separate file. If an absolute file path is provided here, then that's the
file that will be loaded. Otherwise, `execFixture` will be `path.join`'d
with the directory name of `filepath`.

If you find you're using this option more than a couple of times, consider
using _`fixtures`_ instead.

#### See

https://npm.im/babel-plugin-tester#execFixture

***

### ~~fixture?~~

> `optional` **fixture**: `string`

Defined in: types/global.ts:656

#### Deprecated

Use `codeFixture` instead.

#### See

https://npm.im/babel-plugin-tester#codeFixture

***

### formatResult?

> `optional` **formatResult**: [`ResultFormatter`](../type-aliases/ResultFormatter.md)\<`Record`\<`string`, `unknown`\>\>

Defined in: types/global.ts:594

This is a `tests` object option used to provide a function that formats the
babel output yielded from transforming `code` _before_ it is compared to
`output`. Defaults to a function that uses prettier. If you have prettier
configured, then it will use your configuration. If you don't, then it will
use a default prettier configuration.

#### See

https://npm.im/babel-plugin-tester#formatResult-2

***

### only?

> `optional` **only**: `boolean`

Defined in: types/global.ts:504

This is a `tests` object option used to run only the specified test. Useful
while developing to help focus on a small number of tests. Can be used on
multiple tests.

#### See

https://npm.im/babel-plugin-tester#only-1

***

### output?

> `optional` **output**: `string`

Defined in: types/global.ts:621

This is a `tests` object option to which the result of the babel
transformation will be compared. `output` will have any indentation
stripped and will be trimmed as a convenience for template literals.

#### See

https://npm.im/babel-plugin-tester#output

***

### outputFixture?

> `optional` **outputFixture**: `string`

Defined in: types/global.ts:668

This is a `tests` object option for when you'd rather put your `output` in
a separate file. If an absolute file path is provided here, then that's the
file that will be loaded. Otherwise, `outputFixture` will be `path.join`'d
with the directory name of `filepath`.

If you find you're using this option more than a couple of times, consider
using _`fixtures`_ instead.

#### See

https://npm.im/babel-plugin-tester#outputFixture

***

### outputRaw?

> `optional` **outputRaw**: [`OutputTesterFunction`](../type-aliases/OutputTesterFunction.md)

Defined in: types/global.ts:630

This is a `tests` object option similar in intent to the `output` option
except it tests against the entire `BabelFileResult` object returned by
babel's `transform` function instead of only the `code` property of
`BabelFileResult`.

#### See

https://npm.im/babel-plugin-tester#outputRaw-1

***

### pluginOptions?

> `optional` **pluginOptions**: `PluginOptions`

Defined in: types/global.ts:481

This is a `tests` object option used to pass options into your plugin at
transform time, overriding the `pluginOptions` provided to
babel-plugin-tester.

#### See

https://npm.im/babel-plugin-tester#pluginOptions-2

***

### presetOptions?

> `optional` **presetOptions**: `PluginOptions`

Defined in: types/global.ts:489

This is a `tests` object option used to pass options into your preset at
transform time, overriding the `presetOptions` provided to
babel-plugin-tester.

#### See

https://npm.im/babel-plugin-tester#presetOptions-1

***

### setup?

> `optional` **setup**: [`SetupFunction`](../type-aliases/SetupFunction.md)

Defined in: types/global.ts:575

This is a `tests` object option to provide a setup function run before this
test. It can return a function which will be treated as a `teardown`
function. It can also return a promise. If that promise resolves to a
function, that will be treated as a `teardown` function.

#### See

https://npm.im/babel-plugin-tester#setup-2

***

### skip?

> `optional` **skip**: `boolean`

Defined in: types/global.ts:512

This is a `tests` object option used to skip running the specified test.
Useful for when you're working on a feature that is not yet supported. Can
be used on multiple tests.

#### See

https://npm.im/babel-plugin-tester#skip-1

***

### snapshot?

> `optional` **snapshot**: `boolean`

Defined in: types/global.ts:603

This is a `tests` object option for when you prefer to take a snapshot of
your output rather than compare it to something you hard-code. When `true`,
a snapshot containing both the source code and the output will be generated
for this test.

#### See

https://npm.im/babel-plugin-tester#snapshot-1

***

### teardown?

> `optional` **teardown**: [`TeardownFunction`](../type-aliases/TeardownFunction.md)

Defined in: types/global.ts:584

This is a `tests` object option to provide a teardown function run after
this test. You can either define this as its own property, or you can
return it from the `setup` function. This can likewise return a promise if
it's asynchronous.

#### See

https://npm.im/babel-plugin-tester#teardown-2

***

### throws?

> `optional` **throws**: [`ErrorExpectation`](../type-aliases/ErrorExpectation.md)

Defined in: types/global.ts:539

This is a `tests` object option used to assert that this test should throw
an error during transformation. For example:

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

Note that this property is ignored when using the `exec` property.

For backwards compatibility reasons, `error` is synonymous with `throws`.
They can be used interchangeably.

#### See

https://npm.im/babel-plugin-tester#throws-1

***

### title?

> `optional` **title**: `string`

Defined in: types/global.ts:496

This is a `tests` object option used as the title of the test (overriding
everything else).

#### See

https://npm.im/babel-plugin-tester#title-1
