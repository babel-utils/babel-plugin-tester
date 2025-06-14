[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [src/types](../README.md) / ResultFormatter

# Type Alias: ResultFormatter()\<AdditionalOptions\>

> **ResultFormatter**\<`AdditionalOptions`\> = (`code`, `options?`) => `Promise`\<`string`\> \| `string`

Defined in: [src/types.ts:688](https://github.com/babel-utils/babel-plugin-tester/blob/4d4ff268cbd4a3f5ae326c51e5487f07121f5c9d/src/types.ts#L688)

The shape of a code formatter used to normalize the results of a babel
transformation.

## Type Parameters

### AdditionalOptions

`AdditionalOptions` *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Parameters

### code

`string`

### options?

`object` & `Partial`\<`AdditionalOptions`\>

## Returns

`Promise`\<`string`\> \| `string`

## See

https://npm.im/babel-plugin-tester#prettier-formatter
