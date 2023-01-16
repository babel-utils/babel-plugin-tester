import type { Writable } from 'type-fest';
import type { FrameworksUnderTest } from './test-config';

export function withNodeTestInterop(
  sourceObj: FrameworksUnderTest[number]['tests'][number]['source']
) {
  const sourceObjWithInterop = {} as Writable<typeof sourceObj>;

  for (const [key, sourceCode] of Object.entries(sourceObj)) {
    if (typeof sourceCode != 'string') {
      throw new TypeError('sanity check failed: expected string');
    }

    const interop = `
      globalThis.describe = describe;
      globalThis.it = it;
      globalThis.it.only = (...args) => it(args[0], { only: true }, args[1]);

      ${sourceCode}
    `;

    sourceObjWithInterop[key as keyof typeof sourceObj] = {
      esm: `
        import { describe, it } from 'node:test';

        ${interop}
      `,
      cjs: `
        const { describe, it } = require('node:test');

        ${interop}
      `
    };
  }

  return sourceObjWithInterop;
}

export function withJasmineInterop(
  sourceObj: FrameworksUnderTest[number]['tests'][number]['source']
) {
  const sourceObjWithInterop = {} as Writable<typeof sourceObj>;

  for (const [key, sourceCode] of Object.entries(sourceObj)) {
    if (typeof sourceCode != 'string') {
      throw new TypeError('sanity check failed: expected string');
    }

    sourceObjWithInterop[key as keyof typeof sourceObj] = `
      globalThis.it.skip = globalThis.xit;
      globalThis.it.only = globalThis.fit;

      ${sourceCode}
    `;
  }

  return sourceObjWithInterop;
}
