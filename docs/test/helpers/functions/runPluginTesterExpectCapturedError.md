[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/helpers](../README.md) / runPluginTesterExpectCapturedError

# Function: runPluginTesterExpectCapturedError()

> **runPluginTesterExpectCapturedError**(`__namedParameters`): `Promise`\<`void`\>

Defined in: test/helpers.ts:220

This is a sugar function wrapping `runPluginTester` that accepts an
`error`/`throws` option. The dummy babel plugin provided with this function
will always throw the same `SyntaxError`.

Tests both `tests` (`simpleTest`) and `fixtures` (standard).

## Parameters

### \_\_namedParameters

#### overrides

[`PluginTesterOptions`](../../../types/global/interfaces/PluginTesterOptions.md)

#### throws

[`ErrorExpectation`](../../../types/global/type-aliases/ErrorExpectation.md)

## Returns

`Promise`\<`void`\>
