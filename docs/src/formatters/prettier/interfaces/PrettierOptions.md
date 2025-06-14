[**babel-plugin-tester**](../../../../README.md)

***

[babel-plugin-tester](../../../../README.md) / [src/formatters/prettier](../README.md) / PrettierOptions

# Interface: PrettierOptions

Defined in: node\_modules/prettier/index.d.ts:316

## Extends

- `Partial`\<`RequiredOptions`\>

## Indexable

\[`key`: `string`\]: `unknown`

## Properties

### \_\_embeddedInHtml?

> `optional` **\_\_embeddedInHtml**: `boolean`

Defined in: node\_modules/prettier/doc.d.ts:226

#### Inherited from

`Partial.__embeddedInHtml`

***

### arrowParens?

> `optional` **arrowParens**: `"always"` \| `"avoid"`

Defined in: node\_modules/prettier/index.d.ts:397

Include parentheses around a sole arrow function parameter.

#### Default

```ts
"always"
```

#### Inherited from

`Partial.arrowParens`

***

### bracketSameLine?

> `optional` **bracketSameLine**: `boolean`

Defined in: node\_modules/prettier/index.d.ts:354

Put the `>` of a multi-line HTML (HTML, JSX, Vue, Angular) element at the end of the last line instead of being
alone on the next line (does not apply to self closing elements).

#### Default

```ts
false
```

#### Inherited from

`Partial.bracketSameLine`

***

### bracketSpacing?

> `optional` **bracketSpacing**: `boolean`

Defined in: node\_modules/prettier/index.d.ts:343

Print spaces between brackets in object literals.

#### Default

```ts
true
```

#### Inherited from

`Partial.bracketSpacing`

***

### embeddedLanguageFormatting?

> `optional` **embeddedLanguageFormatting**: `"auto"` \| `"off"`

Defined in: node\_modules/prettier/index.d.ts:426

Control whether Prettier formats quoted code embedded in the file.

#### Default

```ts
"auto"
```

#### Inherited from

`Partial.embeddedLanguageFormatting`

***

### endOfLine?

> `optional` **endOfLine**: `"lf"` \| `"crlf"` \| `"auto"` \| `"cr"`

Defined in: node\_modules/prettier/index.d.ts:411

Which end of line characters to apply.

#### Default

```ts
"lf"
```

#### Inherited from

`Partial.endOfLine`

***

### experimentalOperatorPosition?

> `optional` **experimentalOperatorPosition**: `"start"` \| `"end"`

Defined in: node\_modules/prettier/index.d.ts:436

Where to print operators when binary expressions wrap lines.

#### Default

```ts
"end"
```

#### Inherited from

`Partial.experimentalOperatorPosition`

***

### experimentalTernaries?

> `optional` **experimentalTernaries**: `boolean`

Defined in: node\_modules/prettier/index.d.ts:442

Use curious ternaries, with the question mark after the condition, instead
of on the same line as the consequent.

#### Default

```ts
false
```

#### Inherited from

`Partial.experimentalTernaries`

***

### filepath?

> `optional` **filepath**: `string`

Defined in: node\_modules/prettier/index.d.ts:372

Specify the input filepath. This will be used to do parser inference.

#### Inherited from

`Partial.filepath`

***

### htmlWhitespaceSensitivity?

> `optional` **htmlWhitespaceSensitivity**: `"ignore"` \| `"css"` \| `"strict"`

Defined in: node\_modules/prettier/index.d.ts:406

How to handle whitespaces in HTML.

#### Default

```ts
"css"
```

#### Inherited from

`Partial.htmlWhitespaceSensitivity`

***

### insertPragma?

> `optional` **insertPragma**: `boolean`

Defined in: node\_modules/prettier/index.d.ts:386

Prettier can insert a special

#### Format

marker at the top of files specifying that
the file has been formatted with prettier. This works well when used in tandem with
the --require-pragma option. If there is already a docblock at the top of
the file then this option will add a newline to it with the

#### Format

marker.

#### Default

```ts
false
```

#### Inherited from

`Partial.insertPragma`

***

### ~~jsxBracketSameLine?~~

> `optional` **jsxBracketSameLine**: `boolean`

Defined in: node\_modules/prettier/index.d.ts:448

Put the `>` of a multi-line JSX element at the end of the last line instead of being alone on the next line.

#### Default

```ts
false
```

#### Deprecated

use bracketSameLine instead

#### Inherited from

`Partial.jsxBracketSameLine`

***

### jsxSingleQuote?

> `optional` **jsxSingleQuote**: `boolean`

Defined in: node\_modules/prettier/index.d.ts:333

Use single quotes in JSX.

#### Default

```ts
false
```

#### Inherited from

`Partial.jsxSingleQuote`

***

### objectWrap?

> `optional` **objectWrap**: `"preserve"` \| `"collapse"`

Defined in: node\_modules/prettier/index.d.ts:348

How to wrap object literals.

#### Default

```ts
"preserve"
```

#### Inherited from

`Partial.objectWrap`

***

### parentParser?

> `optional` **parentParser**: `string`

Defined in: node\_modules/prettier/doc.d.ts:225

#### Inherited from

`Partial.parentParser`

***

### parser?

> `optional` **parser**: `LiteralUnion`\<`BuiltInParserName`, `string`\>

Defined in: node\_modules/prettier/index.d.ts:368

Specify which parser to use.

#### Inherited from

`Partial.parser`

***

### plugins?

> `optional` **plugins**: (`string` \| `Plugin`\<`any`\>)[]

Defined in: node\_modules/prettier/index.d.ts:401

Provide ability to support new languages to prettier.

#### Inherited from

`Partial.plugins`

***

### printWidth?

> `optional` **printWidth**: `number`

Defined in: node\_modules/prettier/doc.d.ts:214

Specify the line length that the printer will wrap on.

#### Default

```ts
80
```

#### Inherited from

`Partial.printWidth`

***

### proseWrap?

> `optional` **proseWrap**: `"preserve"` \| `"always"` \| `"never"`

Defined in: node\_modules/prettier/index.d.ts:392

By default, Prettier will wrap markdown text as-is since some services use a linebreak-sensitive renderer.
In some cases you may want to rely on editor/viewer soft wrapping instead, so this option allows you to opt out.

#### Default

```ts
"preserve"
```

#### Inherited from

`Partial.proseWrap`

***

### quoteProps?

> `optional` **quoteProps**: `"preserve"` \| `"as-needed"` \| `"consistent"`

Defined in: node\_modules/prettier/index.d.ts:416

Change when properties in objects are quoted.

#### Default

```ts
"as-needed"
```

#### Inherited from

`Partial.quoteProps`

***

### rangeEnd?

> `optional` **rangeEnd**: `number`

Defined in: node\_modules/prettier/index.d.ts:364

Format only a segment of a file.

#### Default

```ts
Number.POSITIVE_INFINITY
```

#### Inherited from

`Partial.rangeEnd`

***

### rangeStart?

> `optional` **rangeStart**: `number`

Defined in: node\_modules/prettier/index.d.ts:359

Format only a segment of a file.

#### Default

```ts
0
```

#### Inherited from

`Partial.rangeStart`

***

### requirePragma?

> `optional` **requirePragma**: `boolean`

Defined in: node\_modules/prettier/index.d.ts:378

Prettier can restrict itself to only format files that contain a special comment, called a pragma, at the top of the file.
This is very useful when gradually transitioning large, unformatted codebases to prettier.

#### Default

```ts
false
```

#### Inherited from

`Partial.requirePragma`

***

### semi?

> `optional` **semi**: `boolean`

Defined in: node\_modules/prettier/index.d.ts:323

Print semicolons at the ends of statements.

#### Default

```ts
true
```

#### Inherited from

`Partial.semi`

***

### singleAttributePerLine?

> `optional` **singleAttributePerLine**: `boolean`

Defined in: node\_modules/prettier/index.d.ts:431

Enforce single attribute per line in HTML, Vue and JSX.

#### Default

```ts
false
```

#### Inherited from

`Partial.singleAttributePerLine`

***

### singleQuote?

> `optional` **singleQuote**: `boolean`

Defined in: node\_modules/prettier/index.d.ts:328

Use single quotes instead of double quotes.

#### Default

```ts
false
```

#### Inherited from

`Partial.singleQuote`

***

### tabWidth?

> `optional` **tabWidth**: `number`

Defined in: node\_modules/prettier/doc.d.ts:219

Specify the number of spaces per indentation-level.

#### Default

```ts
2
```

#### Inherited from

`Partial.tabWidth`

***

### trailingComma?

> `optional` **trailingComma**: `"all"` \| `"none"` \| `"es5"`

Defined in: node\_modules/prettier/index.d.ts:338

Print trailing commas wherever possible.

#### Default

```ts
"all"
```

#### Inherited from

`Partial.trailingComma`

***

### useTabs?

> `optional` **useTabs**: `boolean`

Defined in: node\_modules/prettier/doc.d.ts:224

Indent lines with tabs instead of spaces

#### Default

```ts
false
```

#### Inherited from

`Partial.useTabs`

***

### vueIndentScriptAndStyle?

> `optional` **vueIndentScriptAndStyle**: `boolean`

Defined in: node\_modules/prettier/index.d.ts:421

Whether or not to indent the code inside <script> and <style> tags in Vue files.

#### Default

```ts
false
```

#### Inherited from

`Partial.vueIndentScriptAndStyle`
