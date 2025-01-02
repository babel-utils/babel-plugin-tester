[**babel-plugin-tester**](../../../../README.md)

***

[babel-plugin-tester](../../../../README.md) / [test/helpers/plugins](../README.md) / makePresetFromPlugin

# Function: makePresetFromPlugin()

> **makePresetFromPlugin**(`pluginOrFn`): `NonNullable`\<[`PluginTesterOptions`](../../../../types/global/interfaces/PluginTesterOptions.md)\[`"preset"`\]\>

Defined in: [test/helpers/plugins.ts:69](https://github.com/Xunnamius/babel-plugin-tester/blob/91349cafb3cefac8248e86580feec53bd082321e/test/helpers/plugins.ts#L69)

When called, returns a babel preset containing the provided plugin.

## Parameters

### pluginOrFn

`PluginItem` | () => `PluginObj`\<`unknown`\>

## Returns

`NonNullable`\<[`PluginTesterOptions`](../../../../types/global/interfaces/PluginTesterOptions.md)\[`"preset"`\]\>
