// * This file exists for tests that might require this file directly, hence
// * it must be a simple JavaScript file and not, say, a TypeScript file.

module.exports = identifierReversePlugin;

/**
 * Dummy plugin that reverses the character order of all identifiers.
 */
function identifierReversePlugin() {
  return {
    visitor: {
      Identifier(idPath) {
        idPath.node.name = idPath.node.name.split('').reverse().join('');
      }
    }
  };
}
