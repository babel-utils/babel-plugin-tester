[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/setup](../README.md) / mockEnvFactory

# Function: mockEnvFactory()

> **mockEnvFactory**(`factorySimulatedEnv`, `factoryOptions`): (`fn`, `simulatedEnv`, `options`?) => `Promise`\<`void`\>

Defined in: [test/setup.ts:251](https://github.com/Xunnamius/babel-plugin-tester/blob/91349cafb3cefac8248e86580feec53bd082321e/test/setup.ts#L251)

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
