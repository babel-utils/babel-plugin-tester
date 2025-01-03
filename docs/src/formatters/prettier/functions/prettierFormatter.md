[**babel-plugin-tester**](../../../../README.md)

***

[babel-plugin-tester](../../../../README.md) / [src/formatters/prettier](../README.md) / prettierFormatter

# Function: prettierFormatter()

> **prettierFormatter**(`code`, `options`?): `string` \| `Promise`\<`string`\>

Defined in: [src/formatters/prettier.ts:24](https://github.com/babel-utils/babel-plugin-tester/blob/fc3d21b0d5e00d8cddad4db323f3724c672066fd/src/formatters/prettier.ts#L24)

A prettier-based formatter used to normalize babel output.

If no `filepath` is given, it will be set to `${cwd}/dummy.js` by
default. This is useful to leverage prettier's extension-based parser
inference (which usually ends up triggering babel).

## Parameters

### code

`string`

The result of a babel transformation that should be formatted.

### options?

`object` & `Partial`\<\{ `config`: `MaybePrettierOptions`; `prettierOptions`: `MaybePrettierOptions`; \}\>

Options expected by the ResultFormatter interface.

## Returns

`string` \| `Promise`\<`string`\>

## See

https://prettier.io/docs/en/options.html#file-path
