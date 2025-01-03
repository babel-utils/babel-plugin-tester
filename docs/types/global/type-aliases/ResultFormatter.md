[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [types/global](../README.md) / ResultFormatter

# Type Alias: ResultFormatter()\<AdditionalOptions\>

> **ResultFormatter**\<`AdditionalOptions`\>: (`code`, `options`?) => `Promise`\<`string`\> \| `string`

Defined in: [types/global.ts:689](https://github.com/babel-utils/babel-plugin-tester/blob/fc3d21b0d5e00d8cddad4db323f3724c672066fd/types/global.ts#L689)

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
