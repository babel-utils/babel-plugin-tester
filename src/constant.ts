import { createDebugLogger } from 'rejoinder';

/**
 * An internal symbol representing the type of a normalized test configuration.
 *
 * @internal
 */
export const $type = Symbol.for('@xunnamius/test-object-type');

/**
 * The project-wide namespace that appears in debugger output. Only used in
 * tests.
 */
export const globalDebuggerNamespace = 'bpt';

export const globalDebugger = createDebugLogger({
  namespace: globalDebuggerNamespace
});
