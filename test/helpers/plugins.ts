import type { PluginItem, PluginObj } from '@babel/core';
import type { PluginTesterOptions } from 'universe';

/**
 * Dummy plugin that reverses the character order of all identifiers.
 */
export const identifierReversePlugin: () => PluginObj = require('testverse:helpers/plugin-identifier-reverse.js');

/**
 * Dummy plugin that deletes variable declarations.
 */
export const deleteVariablesPlugin: () => PluginObj = require('testverse:helpers/plugin-delete-variables.js');

/**
 * Dummy plugin that adds a single "hello world" string to the beginning of a
 * program.
 */
export const addLinePlugin: () => PluginObj = require('testverse:helpers/plugin-add-line.js');

/**
 * Dummy plugin that mutates global metadata.
 */
export const metadataMutationPlugin: () => PluginObj = () => {
  return {
    visitor: {
      Identifier(_, state) {
        // @ts-expect-error: we don't care
        state.file.metadata.seen = true;
      }
    }
  };
};

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
 * When called, returns a babel preset containing the provided plugin.
 */
export function makePresetFromPlugin(
  pluginOrFn: PluginItem | (() => PluginObj<unknown>)
): NonNullable<PluginTesterOptions['preset']> {
  return () => ({
    plugins: [typeof pluginOrFn === 'function' ? pluginOrFn() : pluginOrFn]
  });
}
