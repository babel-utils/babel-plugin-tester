[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/setup](../README.md) / mockFixtureFactory

# Function: mockFixtureFactory()

> **mockFixtureFactory**\<`CustomOptions`, `CustomContext`\>(`testIdentifier`, `options`?): (`fn`) => `Promise`\<`void`\>

Defined in: [test/setup.ts:1015](https://github.com/Xunnamius/babel-plugin-tester/blob/91349cafb3cefac8248e86580feec53bd082321e/test/setup.ts#L1015)

## Type Parameters

• **CustomOptions** *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

• **CustomContext** *extends* `Record`\<`string`, `unknown`\> = `Record`\<`string`, `unknown`\>

## Parameters

### testIdentifier

`string`

### options?

`Partial`\<[`FixtureOptions`](../interfaces/FixtureOptions.md) & `CustomOptions`\>

## Returns

`Function`

### Parameters

#### fn

[`FixtureAction`](../type-aliases/FixtureAction.md)\<[`FixtureContext`](../interfaces/FixtureContext.md)\<[`FixtureOptions`](../interfaces/FixtureOptions.md) & `Partial`\<`Record`\<`string`, `unknown`\> & `CustomOptions`\>\> & `CustomContext`\>

### Returns

`Promise`\<`void`\>
