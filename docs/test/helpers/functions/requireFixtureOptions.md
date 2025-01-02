[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/helpers](../README.md) / requireFixtureOptions

# Function: requireFixtureOptions()

> **requireFixtureOptions**(`fixture`): [`FixtureOptions`](../../../types/global/interfaces/FixtureOptions.md)

Defined in: test/helpers.ts:325

Returns the options object of the specified `fixture` path via `require()`.
The `fixture` path must be a relative path of a file within a subdirectory of
`test/fixtures`.

If a valid `options.js` file and a valid `options.json` file are both
present, the `options.js` file will be `require`'d and the `options.json`
file will be completely ignored.

## Parameters

### fixture

`string`

## Returns

[`FixtureOptions`](../../../types/global/interfaces/FixtureOptions.md)

## Example

```ts
requireFixtureContents('custom-title');
```
