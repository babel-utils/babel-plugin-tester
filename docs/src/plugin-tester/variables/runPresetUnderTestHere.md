[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [src/plugin-tester](../README.md) / runPresetUnderTestHere

# Variable: runPresetUnderTestHere

> `const` **runPresetUnderTestHere**: unique `symbol`

Defined in: [src/plugin-tester.ts:95](https://github.com/Xunnamius/babel-plugin-tester/blob/91349cafb3cefac8248e86580feec53bd082321e/src/plugin-tester.ts#L95)

A unique symbol that, when included in `babelOptions.presets`, will be
replaced with the preset under test. Use this symbol to create a custom
preset run order.

## See

https://npm.im/babel-plugin-tester#custom-plugin-and-preset-run-order
