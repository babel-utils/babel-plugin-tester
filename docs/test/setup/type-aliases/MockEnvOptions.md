[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/setup](../README.md) / MockEnvOptions

# Type Alias: MockEnvOptions

> **MockEnvOptions**: `object`

Defined in: [test/setup.ts:39](https://github.com/Xunnamius/babel-plugin-tester/blob/91349cafb3cefac8248e86580feec53bd082321e/test/setup.ts#L39)

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
