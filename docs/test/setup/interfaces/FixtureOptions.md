[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/setup](../README.md) / FixtureOptions

# Interface: FixtureOptions

Defined in: [test/setup.ts:426](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/test/setup.ts#L426)

## Extends

- `Partial`\<[`WebpackTestFixtureOptions`](WebpackTestFixtureOptions.md)\>.`Partial`\<[`NodeImportTestFixtureOptions`](NodeImportTestFixtureOptions.md)\>.`Partial`\<[`DummyDirectoriesFixtureOptions`](DummyDirectoriesFixtureOptions.md)\>

## Properties

### directoryPaths?

> `optional` **directoryPaths**: `string`[]

Defined in: [test/setup.ts:448](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/test/setup.ts#L448)

#### Inherited from

`Partial.directoryPaths`

***

### initialFileContents

> **initialFileContents**: `object`

Defined in: [test/setup.ts:433](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/test/setup.ts#L433)

#### Index Signature

\[`filePath`: `string`\]: `string`

***

### npmInstall?

> `optional` **npmInstall**: `string` \| `string`[]

Defined in: [test/setup.ts:453](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/test/setup.ts#L453)

#### Inherited from

`Partial.npmInstall`

***

### performCleanup

> **performCleanup**: `boolean`

Defined in: [test/setup.ts:431](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/test/setup.ts#L431)

***

### runInstallScripts?

> `optional` **runInstallScripts**: `boolean`

Defined in: [test/setup.ts:454](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/test/setup.ts#L454)

#### Inherited from

`Partial.runInstallScripts`

***

### runWith?

> `optional` **runWith**: `object`

Defined in: [test/setup.ts:455](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/test/setup.ts#L455)

#### args?

> `optional` **args**: `string`[]

#### binary?

> `optional` **binary**: `string`

#### opts?

> `optional` **opts**: `Record`\<`string`, `unknown`\>

#### Inherited from

`Partial.runWith`

***

### use

> **use**: [`MockFixture`](MockFixture.md)[]

Defined in: [test/setup.ts:432](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/test/setup.ts#L432)

***

### webpackVersion?

> `optional` **webpackVersion**: `string`

Defined in: [test/setup.ts:438](https://github.com/babel-utils/babel-plugin-tester/blob/03734eaa985470bea60d71fab1aa0d0dbdddae3c/test/setup.ts#L438)

#### Inherited from

`Partial.webpackVersion`
