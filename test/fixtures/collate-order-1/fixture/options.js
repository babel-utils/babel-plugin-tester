module.exports = {
  babelOptions: {
    plugins: [
      () => {
        return {
          name: 'plugin1',
          visitor: {
            Identifier(idPath) {
              idPath.node.name += '_plugin1';
            }
          }
        };
      }
    ],
    presets: [
      () => ({
        plugins: [
          {
            name: 'preset1',
            visitor: {
              Identifier(idPath) {
                idPath.node.name += '_preset1';
              }
            }
          }
        ]
      })
    ]
  }
};
