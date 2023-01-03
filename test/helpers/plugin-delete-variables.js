// * This file exists for tests that might require this file directly, hence
// * it must be a simple JavaScript file and not, say, a TypeScript file.

module.exports = deleteVariablesPlugin;

/**
 * Dummy plugin that deletes variable declarations.
 */
function deleteVariablesPlugin() {
  return {
    name: 'cleanup',
    visitor: {
      VariableDeclaration(p) {
        p.remove();
      }
    }
  };
}
