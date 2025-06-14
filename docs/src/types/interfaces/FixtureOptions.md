[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [src/types](../README.md) / FixtureOptions

# Interface: FixtureOptions

Defined in: [src/types.ts:286](https://github.com/babel-utils/babel-plugin-tester/blob/4d4ff268cbd4a3f5ae326c51e5487f07121f5c9d/src/types.ts#L286)

Options provided as properties of an `options.json` file, or returned by an
`options.js` file, for use with fixtures specified by the `fixtures` option.

## See

https://npm.im/babel-plugin-tester#fixtures

## Properties

### babelOptions?

> `optional` **babelOptions**: `Omit`\<`TransformOptions`, `"plugins"` \| `"presets"`\> & `object`

Defined in: [src/types.ts:293](https://github.com/babel-utils/babel-plugin-tester/blob/4d4ff268cbd4a3f5ae326c51e5487f07121f5c9d/src/types.ts#L293)

This is a `fixtures` option used to configure babel, overriding the
`babelOptions` provided to babel-plugin-tester.

#### Type declaration

##### plugins?

> `optional` **plugins**: `null` \| (`PluginItem` \| *typeof* [`runPluginUnderTestHere`](../../plugin-tester/variables/runPluginUnderTestHere.md))[]

##### presets?

> `optional` **presets**: `null` \| (`PluginItem` \| *typeof* [`runPresetUnderTestHere`](../../plugin-tester/variables/runPresetUnderTestHere.md))[]

#### See

https://npm.im/babel-plugin-tester#babelOptions-1

***

### error?

> `optional` **error**: [`ErrorExpectation`](../type-aliases/ErrorExpectation.md)

Defined in: [src/types.ts:390](https://github.com/babel-utils/babel-plugin-tester/blob/4d4ff268cbd4a3f5ae326c51e5487f07121f5c9d/src/types.ts#L390)

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

Defined in: [src/types.ts:456](https://github.com/babel-utils/babel-plugin-tester/blob/4d4ff268cbd4a3f5ae326c51e5487f07121f5c9d/src/types.ts#L456)

This is a `fixtures` option used to provide your own fixture output file
extension. This is particularly useful if you are testing TypeScript input.
If omitted, the fixture's input file extension (e.g. the `js` in `code.js`)
will be used instead.

#### See

https://npm.im/babel-plugin-tester#fixtureOutputExt-1

***

### fixtureOutputName?

> `optional` **fixtureOutputName**: `string`

Defined in: [src/types.ts:447](https://github.com/babel-utils/babel-plugin-tester/blob/4d4ff268cbd4a3f5ae326c51e5487f07121f5c9d/src/types.ts#L447)

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

Defined in: [src/types.ts:427](https://github.com/babel-utils/babel-plugin-tester/blob/4d4ff268cbd4a3f5ae326c51e5487f07121f5c9d/src/types.ts#L427)

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

Defined in: [src/types.ts:324](https://github.com/babel-utils/babel-plugin-tester/blob/4d4ff268cbd4a3f5ae326c51e5487f07121f5c9d/src/types.ts#L324)

This is a `fixtures` option used to run only the specified fixture. Useful
while developing to help focus on a small number of fixtures. Can be used
in multiple `options.json` files.

#### See

https://npm.im/babel-plugin-tester#only

***

### outputRaw?

> `optional` **outputRaw**: [`OutputTesterFunction`](../type-aliases/OutputTesterFunction.md)

Defined in: [src/types.ts:439](https://github.com/babel-utils/babel-plugin-tester/blob/4d4ff268cbd4a3f5ae326c51e5487f07121f5c9d/src/types.ts#L439)

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

Defined in: [src/types.ts:301](https://github.com/babel-utils/babel-plugin-tester/blob/4d4ff268cbd4a3f5ae326c51e5487f07121f5c9d/src/types.ts#L301)

This is a `fixtures` option used to pass options into your plugin at
transform time, overriding the `pluginOptions` provided to
babel-plugin-tester.

#### See

https://npm.im/babel-plugin-tester#pluginOptions-1

***

### presetOptions?

> `optional` **presetOptions**: `PluginOptions`

Defined in: [src/types.ts:309](https://github.com/babel-utils/babel-plugin-tester/blob/4d4ff268cbd4a3f5ae326c51e5487f07121f5c9d/src/types.ts#L309)

This is a `fixtures` option used to pass options into your preset at
transform time, overriding the `presetOptions` provided to
babel-plugin-tester.

#### See

https://npm.im/babel-plugin-tester#presetOptions-1

***

### setup?

> `optional` **setup**: [`SetupFunction`](../type-aliases/SetupFunction.md)

Defined in: [src/types.ts:402](https://github.com/babel-utils/babel-plugin-tester/blob/4d4ff268cbd4a3f5ae326c51e5487f07121f5c9d/src/types.ts#L402)

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

Defined in: [src/types.ts:332](https://github.com/babel-utils/babel-plugin-tester/blob/4d4ff268cbd4a3f5ae326c51e5487f07121f5c9d/src/types.ts#L332)

This is a `fixtures` option used to skip running the specified fixture.
Useful for when you're working on a feature that is not yet supported. Can
be used in multiple `options.json` files.

#### See

https://npm.im/babel-plugin-tester#skip

***

### teardown?

> `optional` **teardown**: [`TeardownFunction`](../type-aliases/TeardownFunction.md)

Defined in: [src/types.ts:414](https://github.com/babel-utils/babel-plugin-tester/blob/4d4ff268cbd4a3f5ae326c51e5487f07121f5c9d/src/types.ts#L414)

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

Defined in: [src/types.ts:361](https://github.com/babel-utils/babel-plugin-tester/blob/4d4ff268cbd4a3f5ae326c51e5487f07121f5c9d/src/types.ts#L361)

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

Defined in: [src/types.ts:316](https://github.com/babel-utils/babel-plugin-tester/blob/4d4ff268cbd4a3f5ae326c51e5487f07121f5c9d/src/types.ts#L316)

This is a `fixtures` option used as the title of the test (overriding the
directory name).

#### See

https://npm.im/babel-plugin-tester#title-1
