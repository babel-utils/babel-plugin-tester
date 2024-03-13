'use strict';

// ? https://nodejs.org/en/about/releases
const NODE_LTS = 'maintained node versions';

/**
 * @type {import('@babel/core').TransformOptions}
 */
module.exports = {
  comments: false,
  parserOpts: { strictMode: true },
  plugins: ['@babel/plugin-proposal-export-default-from'],
  // ? Sub-keys under the "env" config key will augment the above
  // ? configuration depending on the value of NODE_ENV and friends. Default
  // ? is: development
  env: {
    // * Used by Jest and `npm test`
    test: {
      comments: true,
      sourceMaps: process.env.JEST_TRANSPILED ? false : 'inline',
      presets: [
        ['@babel/preset-env', { targets: { node: true } }],
        ['@babel/preset-typescript', { allowDeclareFields: true }]
      ],
      plugins: [
        // ? Only active when testing, the plugin solves the following problem:
        // ? https://stackoverflow.com/q/40771520/1367414
        'explicit-exports-references'
      ]
    },
    // * Used when NODE_ENV === production (usually for generating types w/ tsc)
    production: {
      presets: [
        [
          '@babel/preset-env',
          {
            // ? https://babeljs.io/docs/en/babel-preset-env#modules
            modules: 'auto',
            targets: NODE_LTS,
            exclude: ['proposal-dynamic-import']
          }
        ],
        ['@babel/preset-typescript', { allowDeclareFields: true }]
        // ? Minification is handled externally (e.g. by webpack)
      ]
    },
    // * Used by `npm run build` for compiling CJS to code output in ./dist
    'production-cjs': {
      presets: [
        [
          '@babel/preset-env',
          {
            // ? https://babeljs.io/docs/en/babel-preset-env#modules
            modules: 'cjs',
            targets: NODE_LTS,
            useBuiltIns: 'usage',
            corejs: '3.36',
            shippedProposals: true,
            exclude: ['proposal-dynamic-import']
          }
        ],
        ['@babel/preset-typescript', { allowDeclareFields: true }]
      ]
    }
  }
};
