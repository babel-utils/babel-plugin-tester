[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [types/global](../README.md) / FixtureOptions

# Interface: FixtureOptions

Defined in: [types/global.ts:287](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/types/global.ts#L287)

Options provided as properties of an `options.json` file, or returned by an
`options.js` file, for use with fixtures specified by the `fixtures` option.

## See

https://npm.im/babel-plugin-tester#fixtures

## Properties

### babelOptions?

> `optional` **babelOptions**: `Omit`\<`TransformOptions`, `"plugins"` \| `"presets"`\> & `object`

Defined in: [types/global.ts:294](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/types/global.ts#L294)

This is a `fixtures` option used to configure babel, overriding the
`babelOptions` provided to babel-plugin-tester.

#### Type declaration

##### plugins?

> `optional` **plugins**: `null` \| (*typeof* [`runPluginUnderTestHere`](../../../src/plugin-tester/variables/runPluginUnderTestHere.md) \| `PluginItem`)[]

##### presets?

> `optional` **presets**: `null` \| (*typeof* [`runPresetUnderTestHere`](../../../src/plugin-tester/variables/runPresetUnderTestHere.md) \| `PluginItem`)[]

#### See

https://npm.im/babel-plugin-tester#babelOptions-1

***

### error?

> `optional` **error**: [`ErrorExpectation`](../type-aliases/ErrorExpectation.md)

Defined in: [types/global.ts:391](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/types/global.ts#L391)

This is a `fixtures` option used to assert that this fixture's test should
throw an error during transformation. For example:

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

When using certain values, this option must be used in `options.js` instead
of `options.json`. Also, note that this property is ignored when using an
`exec.js` file.

For backwards compatibility reasons, `error` is synonymous with `throws`.
They can be used interchangeably.

#### See

https://npm.im/babel-plugin-tester#throws

***

### fixtureOutputExt?

> `optional` **fixtureOutputExt**: `string`

Defined in: [types/global.ts:457](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/types/global.ts#L457)

This is a `fixtures` option used to provide your own fixture output file
extension. This is particularly useful if you are testing TypeScript input.
If omitted, the fixture's input file extension (e.g. the `js` in `code.js`)
will be used instead.

#### See

https://npm.im/babel-plugin-tester#fixtureOutputExt-1

***

### fixtureOutputName?

> `optional` **fixtureOutputName**: `string`

Defined in: [types/global.ts:448](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/types/global.ts#L448)

This is a `fixtures` option used to provide your own fixture output file
name. Defaults to `"output"`.

#### See

https://npm.im/babel-plugin-tester#fixtureOutputName-1

#### Default

```ts
"output"
```

***

### formatResult?

> `optional` **formatResult**: [`ResultFormatter`](../type-aliases/ResultFormatter.md)\<`Record`\<`string`, `unknown`\>\>

Defined in: [types/global.ts:428](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/types/global.ts#L428)

This is a `fixtures` option used to provide a function that formats the
babel output yielded from transforming `code.js` _before_ it is compared to
`output.js`. Defaults to a function that uses prettier. If you have
prettier configured, then it will use your configuration. If you don't,
then it will use a default prettier configuration.

As it requires a function value, this option must be used in `options.js`
instead of `options.json`.

#### See

https://npm.im/babel-plugin-tester#formatResult-1

***

### only?

> `optional` **only**: `boolean`

Defined in: [types/global.ts:325](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/types/global.ts#L325)

This is a `fixtures` option used to run only the specified fixture. Useful
while developing to help focus on a small number of fixtures. Can be used
in multiple `options.json` files.

#### See

https://npm.im/babel-plugin-tester#only

***

### outputRaw?

> `optional` **outputRaw**: [`OutputTesterFunction`](../type-aliases/OutputTesterFunction.md)

Defined in: [types/global.ts:440](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/types/global.ts#L440)

This is a `fixtures` option similar in intent to `output.js` except it
tests against the entire `BabelFileResult` object returned by babel's
`transform` function instead of only the `code` property of
`BabelFileResult`.

As it requires a function value, this option must be used in `options.js`
instead of `options.json`.

#### See

https://npm.im/babel-plugin-tester#outputRaw

***

### pluginOptions?

> `optional` **pluginOptions**: `PluginOptions`

Defined in: [types/global.ts:302](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/types/global.ts#L302)

This is a `fixtures` option used to pass options into your plugin at
transform time, overriding the `pluginOptions` provided to
babel-plugin-tester.

#### See

https://npm.im/babel-plugin-tester#pluginOptions-1

***

### presetOptions?

> `optional` **presetOptions**: `PluginOptions`

Defined in: [types/global.ts:310](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/types/global.ts#L310)

This is a `fixtures` option used to pass options into your preset at
transform time, overriding the `presetOptions` provided to
babel-plugin-tester.

#### See

https://npm.im/babel-plugin-tester#presetOptions-1

***

### setup?

> `optional` **setup**: [`SetupFunction`](../type-aliases/SetupFunction.md)

Defined in: [types/global.ts:403](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/types/global.ts#L403)

This is a `fixtures` option to provide a setup function run before this
fixture's test. It can return a function which will be treated as a
`teardown` function. It can also return a promise. If that promise resolves
to a function, that will be treated as a `teardown` function.

As it requires a function value, this option must be used in `options.js`
instead of `options.json`.

#### See

https://npm.im/babel-plugin-tester#setup-1

***

### skip?

> `optional` **skip**: `boolean`

Defined in: [types/global.ts:333](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/types/global.ts#L333)

This is a `fixtures` option used to skip running the specified fixture.
Useful for when you're working on a feature that is not yet supported. Can
be used in multiple `options.json` files.

#### See

https://npm.im/babel-plugin-tester#skip

***

### teardown?

> `optional` **teardown**: [`TeardownFunction`](../type-aliases/TeardownFunction.md)

Defined in: [types/global.ts:415](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/types/global.ts#L415)

This is a `fixtures` option to provide a teardown function run after this
fixture's test. You can either define this as its own property, or you can
return it from the `setup` function. This can likewise return a promise if
it's asynchronous.

As it requires a function value, this option must be used in `options.js`
instead of `options.json`.

#### See

https://npm.im/babel-plugin-tester#teardown-1

***

### throws?

> `optional` **throws**: [`ErrorExpectation`](../type-aliases/ErrorExpectation.md)

Defined in: [types/global.ts:362](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/types/global.ts#L362)

This is a `fixtures` option used to assert that this fixture's test should
throw an error during transformation. For example:

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

When using certain values, this option must be used in `options.js` instead
of `options.json`. Also, note that this property is ignored when using an
`exec.js` file.

For backwards compatibility reasons, `error` is synonymous with `throws`.
They can be used interchangeably.

#### See

https://npm.im/babel-plugin-tester#throws

***

### title?

> `optional` **title**: `string`

Defined in: [types/global.ts:317](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/types/global.ts#L317)

This is a `fixtures` option used as the title of the test (overriding the
directory name).

#### See

https://npm.im/babel-plugin-tester#title-1
