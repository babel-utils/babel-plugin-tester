[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/setup](../README.md) / withMockedFixture

# Function: withMockedFixture()

> **withMockedFixture**\<`CustomOptions`, `CustomContext`\>(`__namedParameters`): `Promise`\<`void`\>

Defined in: [test/setup.ts:900](https://github.com/babel-utils/babel-plugin-tester/blob/fc3d21b0d5e00d8cddad4db323f3724c672066fd/test/setup.ts#L900)

## Type Parameters

• **CustomOptions** *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

• **CustomContext** *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Parameters

### \_\_namedParameters

#### fn

[`FixtureAction`](../type-aliases/FixtureAction.md)\<[`FixtureContext`](../interfaces/FixtureContext.md)\<[`FixtureOptions`](../interfaces/FixtureOptions.md) & `Partial`\<`Record`\<`string`, `unknown`\> & `CustomOptions`\>\> & `CustomContext`\>

#### options

`Partial`\<[`FixtureOptions`](../interfaces/FixtureOptions.md) & `CustomOptions`\>

#### testIdentifier

`string`

## Returns

`Promise`\<`void`\>
