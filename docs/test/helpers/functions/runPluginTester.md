[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/helpers](../README.md) / runPluginTester

# Function: runPluginTester()

> **runPluginTester**(`options`?): `Promise`\<`void`\>

Defined in: test/helpers.ts:173

Since babel-plugin-tester uses Jest globals (like `it` and `describe`) under
the hood, and we're also using Jest to test babel-plugin-tester, we mock
those globals before `pluginTester` is invoked.

This function wraps `pluginTester`, ensuring the tests that it passes to
functions like `it` are **sequentially run** and their results awaited. In
the event of an exception, the remaining tests run to completion. Either way,
in the end, the queue is cleared.

## Parameters

### options?

[`PluginTesterOptions`](../../../types/global/interfaces/PluginTesterOptions.md)

## Returns

`Promise`\<`void`\>
