[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/setup](../README.md) / MockArgvOptions

# Type Alias: MockArgvOptions

> **MockArgvOptions**: `object`

Defined in: [test/setup.ts:29](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/test/setup.ts#L29)

## Type declaration

### replace?

> `optional` **replace**: `boolean`

By default, the first two elements in `process.argv` are preserved. Setting
`replace` to `true` will cause the entire process.argv array to be replaced

#### Default

```ts
false
```
