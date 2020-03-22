module.exports = identifierReversePlugin

function identifierReversePlugin() {
  return {
    visitor: {
      Identifier(idPath) {
        idPath.node.name = idPath.node.name.split('').reverse().join('')
      },
    },
  }
}
