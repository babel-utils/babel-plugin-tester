[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [src/plugin-tester](../README.md) / runPresetUnderTestHere

# Variable: runPresetUnderTestHere

> `const` **runPresetUnderTestHere**: unique `symbol`

Defined in: [src/plugin-tester.ts:95](https://github.com/babel-utils/babel-plugin-tester/blob/fc3d21b0d5e00d8cddad4db323f3724c672066fd/src/plugin-tester.ts#L95)

A unique symbol that, when included in `babelOptions.presets`, will be
replaced with the preset under test. Use this symbol to create a custom
preset run order.

## See

https://npm.im/babel-plugin-tester#custom-plugin-and-preset-run-order
