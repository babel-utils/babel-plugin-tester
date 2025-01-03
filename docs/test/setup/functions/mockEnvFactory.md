[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/setup](../README.md) / mockEnvFactory

# Function: mockEnvFactory()

> **mockEnvFactory**(`factorySimulatedEnv`, `factoryOptions`): (`fn`, `simulatedEnv`, `options`?) => `Promise`\<`void`\>

Defined in: [test/setup.ts:251](https://github.com/babel-utils/babel-plugin-tester/blob/fc3d21b0d5e00d8cddad4db323f3724c672066fd/test/setup.ts#L251)

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
