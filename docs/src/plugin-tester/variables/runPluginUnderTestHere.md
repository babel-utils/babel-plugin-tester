[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [src/plugin-tester](../README.md) / runPluginUnderTestHere

# Variable: runPluginUnderTestHere

> `const` **runPluginUnderTestHere**: unique `symbol`

Defined in: [src/plugin-tester.ts:85](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/src/plugin-tester.ts#L85)

A unique symbol that, when included in `babelOptions.plugins`, will be
replaced with the plugin under test. Use this symbol to create a custom
plugin run order.

## See

https://npm.im/babel-plugin-tester#custom-plugin-and-preset-run-order
