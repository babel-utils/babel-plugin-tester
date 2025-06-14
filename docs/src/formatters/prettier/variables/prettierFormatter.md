[**babel-plugin-tester**](../../../../README.md)

***

[babel-plugin-tester](../../../../README.md) / [src/formatters/prettier](../README.md) / prettierFormatter

# Variable: prettierFormatter

> `const` **prettierFormatter**: [`ResultFormatter`](../../../types/type-aliases/ResultFormatter.md)\<\{ `config`: `MaybePrettierOptions`; `prettierOptions`: `MaybePrettierOptions`; \}\>

Defined in: [src/formatters/prettier.ts:24](https://github.com/babel-utils/babel-plugin-tester/blob/4d4ff268cbd4a3f5ae326c51e5487f07121f5c9d/src/formatters/prettier.ts#L24)

A prettier-based formatter used to normalize babel output.

If no `filepath` is given, it will be set to `${cwd}/dummy.js` by
default. This is useful to leverage prettier's extension-based parser
inference (which usually ends up triggering babel).

## See

https://prettier.io/docs/en/options.html#file-path
