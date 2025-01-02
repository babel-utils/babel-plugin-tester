[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/helpers](../README.md) / getFixtureContents

# Function: getFixtureContents()

> **getFixtureContents**(`fixture`, `__namedParameters`): `string`

Defined in: test/helpers.ts:309

Returns the contents of the `fixture` file path. The `fixture` path must be a
relative path of a file within a subdirectory of `test/fixtures`.

## Parameters

### fixture

`string`

### \_\_namedParameters

#### trim

`boolean` = `true`

## Returns

`string`

## Example

```ts
getFixtureContents('creates-output-file/code.js');
```
