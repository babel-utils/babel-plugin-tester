[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/helpers](../README.md) / addRunnableJestTest

# Function: addRunnableJestTest()

> **addRunnableJestTest**(`testName`, `testFn`): `void`

Defined in: test/helpers.ts:72

Since babel-plugin-tester uses Jest globals (like `it` and `describe`) under
the hood, and we're using Jest to test babel-plugin-tester, we mock those
globals before `pluginTester` is invoked.

This function is used by those mocks to keep track of the tests that
babel-plugin-tester passes to functions like `it`.

## Parameters

### testName

`string`

### testFn

`undefined` | `ProvidesCallback`

## Returns

`void`
