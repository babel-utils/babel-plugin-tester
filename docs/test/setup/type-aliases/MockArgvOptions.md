[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/setup](../README.md) / MockArgvOptions

# Type Alias: MockArgvOptions

> **MockArgvOptions**: `object`

Defined in: [test/setup.ts:29](https://github.com/babel-utils/babel-plugin-tester/blob/fc3d21b0d5e00d8cddad4db323f3724c672066fd/test/setup.ts#L29)

## Type declaration

### replace?

> `optional` **replace**: `boolean`

By default, the first two elements in `process.argv` are preserved. Setting
`replace` to `true` will cause the entire process.argv array to be replaced

#### Default

```ts
false
```
