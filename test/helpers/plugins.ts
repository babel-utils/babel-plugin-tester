import type { PluginObj, PluginPass as State } from '@babel/core';

/**
 * Dummy plugin that reverses the character order of all identifiers.
 */
export const identifierReversePlugin: () => PluginObj<State> = require('./plugin-identifier-reverse');

/**
 * When called, returns a no-op babel plugin that tracks invocation order.
 */
export function makePluginWithOrderTracking(orderArray: number[], orderInt: number) {
  return () /* : PluginObj<unknown> */ => {
    return {
      visitor: {
        Program() {
          orderArray.push(orderInt);
        }
      }
    };
  };
}
