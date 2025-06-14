[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [src/plugin-tester](../README.md) / runPresetUnderTestHere

# Variable: runPresetUnderTestHere

> `const` **runPresetUnderTestHere**: unique `symbol`

Defined in: [src/plugin-tester.ts:93](https://github.com/babel-utils/babel-plugin-tester/blob/4d4ff268cbd4a3f5ae326c51e5487f07121f5c9d/src/plugin-tester.ts#L93)

A unique symbol that, when included in `babelOptions.presets`, will be
replaced with the preset under test. Use this symbol to create a custom
preset run order.

## See

https://npm.im/babel-plugin-tester#custom-plugin-and-preset-run-order
