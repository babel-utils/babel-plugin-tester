[**babel-plugin-tester**](../../../README.md)

***

[babel-plugin-tester](../../../README.md) / [test/setup](../README.md) / RunOptions

# Interface: RunOptions

Defined in: [test/setup.ts:392](https://github.com/Xunnamius/babel-plugin-tester/blob/91349cafb3cefac8248e86580feec53bd082321e/test/setup.ts#L392)

## Extends

- `Options`

## Properties

### all?

> `readonly` `optional` **all**: `boolean`

Defined in: node\_modules/execa~5/index.d.ts:96

Add an `.all` property on the promise and the resolved value. The property contains the output of the process with `stdout` and `stderr` interleaved.

#### Default

```ts
false
```

#### Inherited from

`execa.Options.all`

***

### argv0?

> `readonly` `optional` **argv0**: `string`

Defined in: node\_modules/execa~5/index.d.ts:129

Explicitly set the value of `argv[0]` sent to the child process. This will be set to `command` or `file` if not specified.

#### Inherited from

`execa.Options.argv0`

***

### buffer?

> `readonly` `optional` **buffer**: `boolean`

Defined in: node\_modules/execa~5/index.d.ts:61

Buffer the output from the spawned process. When set to `false`, you must read the output of `stdout` and `stderr` (or `all` if the `all` option is `true`). Otherwise the returned promise will not be resolved/rejected.

If the spawned process fails, `error.stdout`, `error.stderr`, and `error.all` will contain the buffered data.

#### Default

```ts
true
```

#### Inherited from

`execa.Options.buffer`

***

### cleanup?

> `readonly` `optional` **cleanup**: `boolean`

Defined in: node\_modules/execa~5/index.d.ts:23

Kill the spawned process when the parent process exits unless either:
	- the spawned process is [`detached`](https://nodejs.org/api/child_process.html#child_process_options_detached)
	- the parent process is terminated abruptly, for example, with `SIGKILL` as opposed to `SIGTERM` or a normal exit

#### Default

```ts
true
```

#### Inherited from

`execa.Options.cleanup`

***

### cwd?

> `readonly` `optional` **cwd**: `string`

Defined in: node\_modules/execa~5/index.d.ts:117

Current working directory of the child process.

#### Default

```ts
process.cwd()
```

#### Inherited from

`execa.Options.cwd`

***

### detached?

> `readonly` `optional` **detached**: `boolean`

Defined in: node\_modules/execa~5/index.d.ts:156

Prepare child to run independently of its parent process. Specific behavior [depends on the platform](https://nodejs.org/api/child_process.html#child_process_options_detached).

#### Default

```ts
false
```

#### Inherited from

`execa.Options.detached`

***

### encoding?

> `readonly` `optional` **encoding**: `string`

Defined in: node\_modules/execa~5/index.d.ts:185

Specify the character encoding used to decode the `stdout` and `stderr` output. If set to `null`, then `stdout` and `stderr` will be a `Buffer` instead of a string.

#### Default

```ts
'utf8'
```

#### Inherited from

`execa.Options.encoding`

***

### env?

> `readonly` `optional` **env**: `ProcessEnv`

Defined in: node\_modules/execa~5/index.d.ts:124

Environment key-value pairs. Extends automatically from `process.env`. Set `extendEnv` to `false` if you don't want this.

#### Default

```ts
process.env
```

#### Inherited from

`execa.Options.env`

***

### execPath?

> `readonly` `optional` **execPath**: `string`

Defined in: node\_modules/execa~5/index.d.ts:52

Path to the Node.js executable to use in child processes.

This can be either an absolute path or a path relative to the `cwd` option.

Requires `preferLocal` to be `true`.

For example, this can be used together with [`get-node`](https://github.com/ehmicky/get-node) to run a specific Node.js version in a child process.

#### Default

```ts
process.execPath
```

#### Inherited from

`execa.Options.execPath`

***

### extendEnv?

> `readonly` `optional` **extendEnv**: `boolean`

Defined in: node\_modules/execa~5/index.d.ts:110

Set to `false` if you don't want to extend the environment variables when providing the `env` property.

#### Default

```ts
true
```

#### Inherited from

`execa.Options.extendEnv`

***

### gid?

> `readonly` `optional` **gid**: `number`

Defined in: node\_modules/execa~5/index.d.ts:166

Sets the group identity of the process.

#### Inherited from

`execa.Options.gid`

***

### input?

> `readonly` `optional` **input**: `string` \| `Buffer` \| `Readable`

Defined in: node\_modules/execa~5/index.d.ts:227

Write some input to the `stdin` of your binary.

#### Inherited from

`execa.Options.input`

***

### killSignal?

> `readonly` `optional` **killSignal**: `string` \| `number`

Defined in: node\_modules/execa~5/index.d.ts:206

Signal value to be used when the spawned process will be killed.

#### Default

```ts
'SIGTERM'
```

#### Inherited from

`execa.Options.killSignal`

***

### localDir?

> `readonly` `optional` **localDir**: `string`

Defined in: node\_modules/execa~5/index.d.ts:39

Preferred path to find locally installed binaries in (use with `preferLocal`).

#### Default

```ts
process.cwd()
```

#### Inherited from

`execa.Options.localDir`

***

### maxBuffer?

> `readonly` `optional` **maxBuffer**: `number`

Defined in: node\_modules/execa~5/index.d.ts:199

Largest amount of data in bytes allowed on `stdout` or `stderr`. Default: 100 MB.

#### Default

```ts
100_000_000
```

#### Inherited from

`execa.Options.maxBuffer`

***

### preferLocal?

> `readonly` `optional` **preferLocal**: `boolean`

Defined in: node\_modules/execa~5/index.d.ts:32

Prefer locally installed binaries when looking for a binary to execute.

If you `$ npm install foo`, you can then `execa('foo')`.

#### Default

```ts
false
```

#### Inherited from

`execa.Options.preferLocal`

***

### reject?

> `optional` **reject**: `boolean`

Defined in: [test/setup.ts:397](https://github.com/Xunnamius/babel-plugin-tester/blob/91349cafb3cefac8248e86580feec53bd082321e/test/setup.ts#L397)

Setting this to `true` rejects the promise instead of resolving it with the error.

#### Default

```ts
false
```

#### Overrides

`execa.Options.reject`

***

### serialization?

> `readonly` `optional` **serialization**: `"json"` \| `"advanced"`

Defined in: node\_modules/execa~5/index.d.ts:149

Specify the kind of serialization used for sending messages between processes when using the `stdio: 'ipc'` option or `execa.node()`:
	- `json`: Uses `JSON.stringify()` and `JSON.parse()`.
	- `advanced`: Uses [`v8.serialize()`](https://nodejs.org/api/v8.html#v8_v8_serialize_value)

Requires Node.js `13.2.0` or later.

[More info.](https://nodejs.org/api/child_process.html#child_process_advanced_serialization)

#### Default

```ts
'json'
```

#### Inherited from

`execa.Options.serialization`

***

### shell?

> `readonly` `optional` **shell**: `string` \| `boolean`

Defined in: node\_modules/execa~5/index.d.ts:178

If `true`, runs `command` inside of a shell. Uses `/bin/sh` on UNIX and `cmd.exe` on Windows. A different shell can be specified as a string. The shell should understand the `-c` switch on UNIX or `/d /s /c` on Windows.

We recommend against using this option since it is:
- not cross-platform, encouraging shell-specific syntax.
- slower, because of the additional shell interpretation.
- unsafe, potentially allowing command injection.

#### Default

```ts
false
```

#### Inherited from

`execa.Options.shell`

***

### stderr?

> `readonly` `optional` **stderr**: `StdioOption`

Defined in: node\_modules/execa~5/index.d.ts:82

Same options as [`stdio`](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio).

#### Default

```ts
'pipe'
```

#### Inherited from

`execa.Options.stderr`

***

### stdin?

> `readonly` `optional` **stdin**: `StdioOption`

Defined in: node\_modules/execa~5/index.d.ts:68

Same options as [`stdio`](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio).

#### Default

```ts
'pipe'
```

#### Inherited from

`execa.Options.stdin`

***

### stdio?

> `readonly` `optional` **stdio**: `"ignore"` \| `"pipe"` \| `"inherit"` \| readonly `StdioOption`[]

Defined in: node\_modules/execa~5/index.d.ts:136

Child's [stdio](https://nodejs.org/api/child_process.html#child_process_options_stdio) configuration.

#### Default

```ts
'pipe'
```

#### Inherited from

`execa.Options.stdio`

***

### stdout?

> `readonly` `optional` **stdout**: `StdioOption`

Defined in: node\_modules/execa~5/index.d.ts:75

Same options as [`stdio`](https://nodejs.org/dist/latest-v6.x/docs/api/child_process.html#child_process_options_stdio).

#### Default

```ts
'pipe'
```

#### Inherited from

`execa.Options.stdout`

***

### stripFinalNewline?

> `readonly` `optional` **stripFinalNewline**: `boolean`

Defined in: node\_modules/execa~5/index.d.ts:103

Strip the final [newline character](https://en.wikipedia.org/wiki/Newline) from the output.

#### Default

```ts
true
```

#### Inherited from

`execa.Options.stripFinalNewline`

***

### timeout?

> `readonly` `optional` **timeout**: `number`

Defined in: node\_modules/execa~5/index.d.ts:192

If `timeout` is greater than `0`, the parent will send the signal identified by the `killSignal` property (the default is `SIGTERM`) if the child runs longer than `timeout` milliseconds.

#### Default

```ts
0
```

#### Inherited from

`execa.Options.timeout`

***

### uid?

> `readonly` `optional` **uid**: `number`

Defined in: node\_modules/execa~5/index.d.ts:161

Sets the user identity of the process.

#### Inherited from

`execa.Options.uid`

***

### windowsHide?

> `readonly` `optional` **windowsHide**: `boolean`

Defined in: node\_modules/execa~5/index.d.ts:220

On Windows, do not create a new console window. Please note this also prevents `CTRL-C` [from working](https://github.com/nodejs/node/issues/29837) on Windows.

#### Default

```ts
true
```

#### Inherited from

`execa.Options.windowsHide`

***

### windowsVerbatimArguments?

> `readonly` `optional` **windowsVerbatimArguments**: `boolean`

Defined in: node\_modules/execa~5/index.d.ts:213

If `true`, no quoting or escaping of arguments is done on Windows. Ignored on other platforms. This is set to `true` automatically when the `shell` option is `true`.

#### Default

```ts
false
```

#### Inherited from

`execa.Options.windowsVerbatimArguments`
