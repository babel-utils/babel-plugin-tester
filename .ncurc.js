// * https://www.npmjs.com/package/npm-check-updates#configuration-files

module.exports = {
  reject: [
    // ? Pin the CJS version of strip-indent
    'strip-indent',
    // ? Pin the CJS version of execa
    'execa'
  ]
};
