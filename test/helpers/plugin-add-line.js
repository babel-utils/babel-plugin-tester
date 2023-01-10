// * This file exists for tests that might require this file directly, hence
// * it must be a simple JavaScript file and not, say, a TypeScript file.

module.exports = addLinePlugin;

/**
 * Dummy plugin that deletes everything and results in an empty string output.
 */
function addLinePlugin() {
  return {
    name: 'add-line',
    visitor: {
      Program(path) {
        path.unshiftContainer('body', {
          type: 'StringLiteral',
          value: 'hello world'
        });
      }
    }
  };
}
