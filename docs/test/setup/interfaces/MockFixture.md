[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/setup](../README.md) / MockFixture

# Interface: MockFixture\<Context\>

Defined in: [test/setup.ts:502](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/test/setup.ts#L502)

## Type Parameters

• **Context** = [`FixtureContext`](FixtureContext.md)

## Properties

### description

> **description**: `string` \| [`ReturnsString`](../type-aliases/ReturnsString.md)\<`Context`\>

Defined in: [test/setup.ts:506](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/test/setup.ts#L506)

***

### name

> **name**: `string` \| `symbol` \| [`ReturnsString`](../type-aliases/ReturnsString.md)\<`Context`\>

Defined in: [test/setup.ts:505](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/test/setup.ts#L505)

***

### setup?

> `optional` **setup**: [`FixtureAction`](../type-aliases/FixtureAction.md)\<`Context`\>

Defined in: [test/setup.ts:507](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/test/setup.ts#L507)

***

### teardown?

> `optional` **teardown**: [`FixtureAction`](../type-aliases/FixtureAction.md)\<`Context`\>

Defined in: [test/setup.ts:508](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/test/setup.ts#L508)
