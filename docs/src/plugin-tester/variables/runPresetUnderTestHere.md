[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [src/plugin-tester](../README.md) / runPresetUnderTestHere

# Variable: runPresetUnderTestHere

> `const` **runPresetUnderTestHere**: unique `symbol`

Defined in: [src/plugin-tester.ts:96](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/src/plugin-tester.ts#L96)

A unique symbol that, when included in `babelOptions.presets`, will be
replaced with the preset under test. Use this symbol to create a custom
preset run order.

## See

https://npm.im/babel-plugin-tester#custom-plugin-and-preset-run-order
