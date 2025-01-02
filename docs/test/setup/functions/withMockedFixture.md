[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/setup](../README.md) / withMockedFixture

# Function: withMockedFixture()

> **withMockedFixture**\<`CustomOptions`, `CustomContext`\>(`__namedParameters`): `Promise`\<`void`\>

Defined in: [test/setup.ts:900](https://github.com/Xunnamius/babel-plugin-tester/blob/91349cafb3cefac8248e86580feec53bd082321e/test/setup.ts#L900)

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
