module.exports = {
  babelOptions: {
    filename: '/fake/filepath.ts',
    plugins: [['@babel/plugin-syntax-typescript', { isTSX: true }]]
  }
};
