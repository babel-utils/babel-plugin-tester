[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [src/plugin-tester](../README.md) / runPluginUnderTestHere

# Variable: runPluginUnderTestHere

> `const` **runPluginUnderTestHere**: unique `symbol`

Defined in: [src/plugin-tester.ts:84](https://github.com/Xunnamius/babel-plugin-tester/blob/91349cafb3cefac8248e86580feec53bd082321e/src/plugin-tester.ts#L84)

A unique symbol that, when included in `babelOptions.plugins`, will be
replaced with the plugin under test. Use this symbol to create a custom
plugin run order.

## See

https://npm.im/babel-plugin-tester#custom-plugin-and-preset-run-order
