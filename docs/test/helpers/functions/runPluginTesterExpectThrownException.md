[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/helpers](../README.md) / runPluginTesterExpectThrownException

# Function: runPluginTesterExpectThrownException()

> **runPluginTesterExpectThrownException**(`__namedParameters`): `Promise`\<`void`\>

Defined in: test/helpers.ts:201

This function wraps `runPluginTester`, but expects `runPluginTester` to throw
an error.

## Parameters

### \_\_namedParameters

#### customExpectFn

`Expect` = `expect`

#### expectedError

`NonNullable`\<`undefined` \| `string` \| `RegExp` \| `Error` \| `Constructable`\>

#### options

[`PluginTesterOptions`](../../../types/global/interfaces/PluginTesterOptions.md)

## Returns

`Promise`\<`void`\>
