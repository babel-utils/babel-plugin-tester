[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/helpers](../README.md) / runPluginTesterExpectThrownExceptionWhenCapturingError

# Function: runPluginTesterExpectThrownExceptionWhenCapturingError()

> **runPluginTesterExpectThrownExceptionWhenCapturingError**(`__namedParameters`): `Promise`\<`void`\>

Defined in: test/helpers.ts:257

This function combines the functionality of
`runPluginTesterExpectCapturedError` and that of
`runPluginTesterExpectThrownException` together in a single function.

## Parameters

### \_\_namedParameters

#### expectedError

`NonNullable`\<`undefined` \| `string` \| `RegExp` \| `Error` \| `Constructable`\>

#### overrides

[`PluginTesterOptions`](../../../types/global/interfaces/PluginTesterOptions.md)

#### throws

[`ErrorExpectation`](../../../types/global/type-aliases/ErrorExpectation.md)

## Returns

`Promise`\<`void`\>
