[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/setup](../README.md) / MockEnvOptions

# Type Alias: MockEnvOptions

> **MockEnvOptions**: `object`

Defined in: [test/setup.ts:39](https://github.com/babel-utils/babel-plugin-tester/blob/fc3d21b0d5e00d8cddad4db323f3724c672066fd/test/setup.ts#L39)

## Type declaration

### replace?

> `optional` **replace**: `boolean`

By default, the `process.env` object is emptied and re-hydrated with
`newEnv`. Setting `replace` to `false` will cause `newEnv` to be appended
instead

#### Default

```ts
true
```
