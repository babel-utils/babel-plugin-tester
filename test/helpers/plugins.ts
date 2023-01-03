import type { PluginObj, PluginPass as State } from '@babel/core';
import type { PluginTesterOptions } from '../../src/index';

/**
 * Dummy plugin that reverses the character order of all identifiers.
 */
export const identifierReversePlugin: () => PluginObj<State> = require('./plugin-identifier-reverse');

/**
 * Dummy plugin that deletes variable declarations.
 */
export const deleteVariablesPlugin: () => PluginObj<State> = require('./plugin-delete-variables');

/**
 * Dummy plugin that adds a single "hello world" string to the beginning of a
 * program.
 */
export const addLinePlugin: () => PluginObj<State> = require('./plugin-add-line');

/**
 * When called, returns a no-op babel plugin that tracks invocation order.
 */
export function makePluginWithOrderTracking(orderArray: number[], orderInt: number) {
  return (): PluginObj<unknown> => {
    return {
      name: 'order-tracker',
      visitor: {
        Program() {
          orderArray.push(orderInt);
        }
      }
    };
  };
}
/**
 * When called, returns a babel preset containing a no-op plugin that tracks
 * invocation order.
 */
export function makePresetWithPluginWithOrderTracking(
  orderArray: number[],
  orderInt: number
): NonNullable<PluginTesterOptions['preset']> {
  return () => ({
    plugins: [
      {
        name: 'order-tracker',
        visitor: {
          Program() {
            orderArray.push(orderInt);
          }
        }
      }
    ]
  });
}

/**
 * When called, returns a babel plugin that appends a string to all identifiers.
 */
export function makePluginThatAppendsToIdentifier(suffix: string) {
  return (): PluginObj<unknown> => {
    return {
      name: suffix,
      visitor: {
        Identifier(idPath) {
          idPath.node.name += `_${suffix}`;
        }
      }
    };
  };
}

/**
 * When called, returns a babel preset containing a plugin that appends a string
 * to all identifiers.
 */
export function makePresetWithPluginThatAppendsToIdentifier(
  suffix: string
): NonNullable<PluginTesterOptions['preset']> {
  return () => ({
    plugins: [
      {
        name: suffix,
        visitor: {
          Identifier(idPath) {
            idPath.node.name += `_${suffix}`;
          }
        }
      }
    ]
  });
}
