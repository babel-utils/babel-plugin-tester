[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/setup](../README.md) / mockEnvFactory

# Function: mockEnvFactory()

> **mockEnvFactory**(`factorySimulatedEnv`, `factoryOptions`): (`fn`, `simulatedEnv`, `options`?) => `Promise`\<`void`\>

Defined in: [test/setup.ts:251](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/test/setup.ts#L251)

## Parameters

### factorySimulatedEnv

`Record`\<`string`, `string`\>

### factoryOptions

[`MockEnvOptions`](../type-aliases/MockEnvOptions.md) = `...`

## Returns

`Function`

### Parameters

#### fn

() => `Promisable`\<`void`\>

#### simulatedEnv

`Record`\<`string`, `string`\> = `{}`

#### options?

[`MockEnvOptions`](../type-aliases/MockEnvOptions.md)

### Returns

`Promise`\<`void`\>
