[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/setup](../README.md) / FixtureContext

# Interface: FixtureContext\<CustomOptions\>

Defined in: [test/setup.ts:463](https://github.com/babel-utils/babel-plugin-tester/blob/fc3d21b0d5e00d8cddad4db323f3724c672066fd/test/setup.ts#L463)

## Extends

- `Partial`\<[`TestResultProvider`](TestResultProvider.md)\>.`Partial`\<[`TreeOutputProvider`](TreeOutputProvider.md)\>

## Type Parameters

• **CustomOptions** *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Properties

### debug

> **debug**: `Debugger`

Defined in: [test/setup.ts:473](https://github.com/babel-utils/babel-plugin-tester/blob/fc3d21b0d5e00d8cddad4db323f3724c672066fd/test/setup.ts#L473)

***

### fileContents

> **fileContents**: `object`

Defined in: [test/setup.ts:472](https://github.com/babel-utils/babel-plugin-tester/blob/fc3d21b0d5e00d8cddad4db323f3724c672066fd/test/setup.ts#L472)

#### Index Signature

\[`filePath`: `string`\]: `string`

***

### options

> **options**: [`FixtureOptions`](FixtureOptions.md) & `CustomOptions`

Defined in: [test/setup.ts:470](https://github.com/babel-utils/babel-plugin-tester/blob/fc3d21b0d5e00d8cddad4db323f3724c672066fd/test/setup.ts#L470)

***

### root

> **root**: `string`

Defined in: [test/setup.ts:468](https://github.com/babel-utils/babel-plugin-tester/blob/fc3d21b0d5e00d8cddad4db323f3724c672066fd/test/setup.ts#L468)

***

### testIdentifier

> **testIdentifier**: `string`

Defined in: [test/setup.ts:469](https://github.com/babel-utils/babel-plugin-tester/blob/fc3d21b0d5e00d8cddad4db323f3724c672066fd/test/setup.ts#L469)

***

### testResult?

> `optional` **testResult**: `object`

Defined in: [test/setup.ts:478](https://github.com/babel-utils/babel-plugin-tester/blob/fc3d21b0d5e00d8cddad4db323f3724c672066fd/test/setup.ts#L478)

#### code

> **code**: `number`

#### stderr

> **stderr**: `string`

#### stdout

> **stdout**: `string`

#### Inherited from

`Partial.testResult`

***

### treeOutput?

> `optional` **treeOutput**: `string`

Defined in: [test/setup.ts:483](https://github.com/babel-utils/babel-plugin-tester/blob/fc3d21b0d5e00d8cddad4db323f3724c672066fd/test/setup.ts#L483)

#### Inherited from

`Partial.treeOutput`

***

### using

> **using**: [`MockFixture`](MockFixture.md)[]

Defined in: [test/setup.ts:471](https://github.com/babel-utils/babel-plugin-tester/blob/fc3d21b0d5e00d8cddad4db323f3724c672066fd/test/setup.ts#L471)
