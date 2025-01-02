[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/setup](../README.md) / MockArgvOptions

# Type Alias: MockArgvOptions

> **MockArgvOptions**: `object`

Defined in: [test/setup.ts:29](https://github.com/Xunnamius/babel-plugin-tester/blob/91349cafb3cefac8248e86580feec53bd082321e/test/setup.ts#L29)

## Type declaration

### replace?

> `optional` **replace**: `boolean`

By default, the first two elements in `process.argv` are preserved. Setting
`replace` to `true` will cause the entire process.argv array to be replaced

#### Default

```ts
false
```
