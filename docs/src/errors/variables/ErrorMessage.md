[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [src/errors](../README.md) / ErrorMessage

# Variable: ErrorMessage

> `const` **ErrorMessage**: `object`

Defined in: [src/errors.ts:17](https://github.com/babel-utils/babel-plugin-tester/blob/fc3d21b0d5e00d8cddad4db323f3724c672066fd/src/errors.ts#L17)

A collection of possible errors and warnings.

## Type declaration

### AttemptedToSnapshotUnmodifiedBabelOutput()

> **AttemptedToSnapshotUnmodifiedBabelOutput**: () => `string`

#### Returns

`string`

### BabelOutputTypeIsNotString()

> **BabelOutputTypeIsNotString**: (`rawBabelOutput`) => `string`

#### Parameters

##### rawBabelOutput

`unknown`

#### Returns

`string`

### BabelOutputUnexpectedlyEmpty()

> **BabelOutputUnexpectedlyEmpty**: () => `string`

#### Returns

`string`

### BadConfigFixturesNotString()

> **BadConfigFixturesNotString**: () => `string`

#### Returns

`string`

### BadConfigInvalidEndOfLine()

> **BadConfigInvalidEndOfLine**: (`endOfLine`) => `string`

#### Parameters

##### endOfLine

`unknown`

#### Returns

`string`

### BadConfigInvalidTestsArrayItemType()

> **BadConfigInvalidTestsArrayItemType**: (`index`) => `string`

#### Parameters

##### index

`number`

#### Returns

`string`

### BadConfigInvalidTestsObjectProperty()

> **BadConfigInvalidTestsObjectProperty**: (`title`) => `string`

#### Parameters

##### title

`string`

#### Returns

`string`

### BadConfigInvalidTestsType()

> **BadConfigInvalidTestsType**: () => `string`

#### Returns

`string`

### BadConfigInvalidTitleNumbering()

> **BadConfigInvalidTitleNumbering**: () => `string`

#### Returns

`string`

### BadConfigNoPluginOrPreset()

> **BadConfigNoPluginOrPreset**: () => `string`

#### Returns

`string`

### BadConfigPluginAndPreset()

> **BadConfigPluginAndPreset**: () => `string`

#### Returns

`string`

### BadEnvironmentVariableRange()

> **BadEnvironmentVariableRange**: (`name`, `rangeStr`, `range`?) => `string`

#### Parameters

##### name

`string`

##### rangeStr

`string`

##### range?

`Range`

#### Returns

`string`

### ExpectedBabelToThrow()

> **ExpectedBabelToThrow**: () => `string`

#### Returns

`string`

### ExpectedErrorToBeInstanceOf()

> **ExpectedErrorToBeInstanceOf**: (`expectedError`) => `string`

#### Parameters

##### expectedError

`Function` | \{ `name`: `string`; \}

#### Returns

`string`

### ExpectedErrorToIncludeString()

> **ExpectedErrorToIncludeString**: (`resultString`, `expectedError`) => `string`

#### Parameters

##### resultString

`string`

##### expectedError

`string`

#### Returns

`string`

### ExpectedErrorToMatchRegExp()

> **ExpectedErrorToMatchRegExp**: (`resultString`, `expectedError`) => `string`

#### Parameters

##### resultString

`string`

##### expectedError

`RegExp`

#### Returns

`string`

### ExpectedOutputNotToChange()

> **ExpectedOutputNotToChange**: () => `string`

#### Returns

`string`

### ExpectedOutputToEqualActual()

> **ExpectedOutputToEqualActual**: (`testConfig`) => `string`

#### Parameters

##### testConfig

`Pick`\<`PluginTesterTestFixtureConfig`, *typeof* `$type` \| `"fixtureOutputBasename"`\> | \{ `[$type]`: `"describe-block"` \| `"test-object"`; \}

#### Returns

`string`

### ExpectedThrowsFunctionToReturnTrue()

> **ExpectedThrowsFunctionToReturnTrue**: () => `string`

#### Returns

`string`

### GenericErrorWithPath()

> **GenericErrorWithPath**: (`error`, `path`) => `string`

#### Parameters

##### error

`unknown`

##### path

`undefined` | `string`

#### Returns

`string`

### InvalidHasBabelrcButNoFilename()

> **InvalidHasBabelrcButNoFilename**: () => `string`

#### Returns

`string`

### InvalidHasCodeAndCodeFixture()

> **InvalidHasCodeAndCodeFixture**: () => `string`

#### Returns

`string`

### InvalidHasExecAndCodeOrOutput()

> **InvalidHasExecAndCodeOrOutput**: (`testConfig`) => `` "neither `code`, `codeFixture`, `fixture`, `output`, nor `outputFixture` can be provided with `exec` or `execFixture`" `` \| `"a fixture cannot contain both an exec file and a code or output file"`

#### Parameters

##### testConfig

`Pick`\<`MaybePluginTesterTestConfig`, *typeof* `$type`\>

#### Returns

`` "neither `code`, `codeFixture`, `fixture`, `output`, nor `outputFixture` can be provided with `exec` or `execFixture`" `` \| `"a fixture cannot contain both an exec file and a code or output file"`

### InvalidHasExecAndExecFixture()

> **InvalidHasExecAndExecFixture**: () => `string`

#### Returns

`string`

### InvalidHasOutputAndOutputFixture()

> **InvalidHasOutputAndOutputFixture**: () => `string`

#### Returns

`string`

### InvalidHasSkipAndOnly()

> **InvalidHasSkipAndOnly**: () => `string`

#### Returns

`string`

### InvalidHasSnapshotAndExec()

> **InvalidHasSnapshotAndExec**: () => `string`

#### Returns

`string`

### InvalidHasSnapshotAndOutput()

> **InvalidHasSnapshotAndOutput**: () => `string`

#### Returns

`string`

### InvalidHasSnapshotAndThrows()

> **InvalidHasSnapshotAndThrows**: () => `string`

#### Returns

`string`

### InvalidHasThrowsAndExec()

> **InvalidHasThrowsAndExec**: (`testConfig`) => `` "neither `exec` nor `execFixture` can be provided with `throws` or `error`" `` \| `` "a fixture cannot be provided with `throws` or `error` and also contain an exec file" ``

#### Parameters

##### testConfig

`Pick`\<`MaybePluginTesterTestConfig`, *typeof* `$type`\>

#### Returns

`` "neither `exec` nor `execFixture` can be provided with `throws` or `error`" `` \| `` "a fixture cannot be provided with `throws` or `error` and also contain an exec file" ``

### InvalidHasThrowsAndOutput()

> **InvalidHasThrowsAndOutput**: (`testConfig`) => `` "neither `output` nor `outputFixture` can be provided with `throws` or `error`" `` \| `` "a fixture cannot be provided with `throws` or `error` and also contain an output file" ``

#### Parameters

##### testConfig

`Pick`\<`MaybePluginTesterTestConfig`, *typeof* `$type`\>

#### Returns

`` "neither `output` nor `outputFixture` can be provided with `throws` or `error`" `` \| `` "a fixture cannot be provided with `throws` or `error` and also contain an output file" ``

### InvalidHasThrowsAndOutputRaw()

> **InvalidHasThrowsAndOutputRaw**: () => `string`

#### Returns

`string`

### InvalidMissingCodeOrExec()

> **InvalidMissingCodeOrExec**: (`testConfig`) => `` "a string or object with a `code`, `codeFixture`, `fixture`, `exec`, or `execFixture` must be provided" `` \| `"a fixture must contain either a code file or an exec file"`

#### Parameters

##### testConfig

`Pick`\<`MaybePluginTesterTestConfig`, *typeof* `$type`\>

#### Returns

`` "a string or object with a `code`, `codeFixture`, `fixture`, `exec`, or `execFixture` must be provided" `` \| `"a fixture must contain either a code file or an exec file"`

### InvalidThrowsType()

> **InvalidThrowsType**: () => `string`

#### Returns

`string`

### PathIsNotAbsolute()

> **PathIsNotAbsolute**: (`path`) => `string`

#### Parameters

##### path

`string`

#### Returns

`string`

### SetupFunctionFailed()

> **SetupFunctionFailed**: (`error`) => `string`

#### Parameters

##### error

`unknown`

#### Returns

`string`

### TeardownFunctionFailed()

> **TeardownFunctionFailed**: (`functionError`, `frameworkError`?) => `string`

#### Parameters

##### functionError

`unknown`

##### frameworkError?

`unknown`

#### Returns

`string`

### TestEnvironmentNoOnlySupport()

> **TestEnvironmentNoOnlySupport**: () => `string`

#### Returns

`string`

### TestEnvironmentNoSkipSupport()

> **TestEnvironmentNoSkipSupport**: () => `string`

#### Returns

`string`

### TestEnvironmentNoSnapshotSupport()

> **TestEnvironmentNoSnapshotSupport**: () => `string`

#### Returns

`string`

### TestEnvironmentUndefinedDescribe()

> **TestEnvironmentUndefinedDescribe**: () => `string`

#### Returns

`string`

### TestEnvironmentUndefinedIt()

> **TestEnvironmentUndefinedIt**: () => `string`

#### Returns

`string`

### UnableToDeriveAbsolutePath()

> **UnableToDeriveAbsolutePath**: (`filepath`, `filepathName`, `basename`, `basenameName`) => `string`

#### Parameters

##### filepath

`unknown`

##### filepathName

`string`

##### basename

`unknown`

##### basenameName

`string`

#### Returns

`string`

### ValidationFailed()

> **ValidationFailed**: (`title`, `message`) => `string`

#### Parameters

##### title

`string`

##### message

`string`

#### Returns

`string`
