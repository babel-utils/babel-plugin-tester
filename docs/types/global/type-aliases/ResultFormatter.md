[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [types/global](../README.md) / ResultFormatter

# Type Alias: ResultFormatter()\<AdditionalOptions\>

> **ResultFormatter**\<`AdditionalOptions`\>: (`code`, `options`?) => `Promise`\<`string`\> \| `string`

Defined in: types/global.ts:689

The shape of a code formatter used to normalize the results of a babel
transformation.

## Type Parameters

• **AdditionalOptions** *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Parameters

### code

`string`

### options?

`object` & `Partial`\<`AdditionalOptions`\>

## Returns

`Promise`\<`string`\> \| `string`

## See

https://npm.im/babel-plugin-tester#prettier-formatter
