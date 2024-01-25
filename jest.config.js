'use strict';

/**
 * @type {import('jest').Config}
 */
module.exports = {
  restoreMocks: true,
  resetMocks: true,
  testEnvironment: 'node',
  testRunner: 'jest-circus/runner',
  // ? 24h if debugging so MMS and other tools don't choke, otherwise 1m
  testTimeout:
    1000 *
    60 *
    (process.env.VSCODE_INSPECTOR_OPTIONS
      ? 60 * 24
      : process.platform === 'win32'
        ? 5
        : 1),
  // ? Minimum of 2 concurrent tests executed at once; maximum of cpu cores - 1
  maxConcurrency: Math.max(require('node:os').cpus().length - 1, 2),
  verbose: false,
  // ! '/.transpiled/' MUST ALWAYS be the last element in this array
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/.transpiled/'],
  setupFilesAfterEnv: ['./test/setup.ts'],
  collectCoverageFrom: ['src/**/*.ts?(x)'],
  // ? Make sure jest-haste-map doesn't try to parse and cache fixtures
  modulePathIgnorePatterns: ['/test/fixtures/', '/.transpiled/test/fixtures/']
};

if (process.env.JEST_TRANSPILED) {
  module.exports.testPathIgnorePatterns.pop();
  module.exports.roots = ['<rootDir>/.transpiled/'];
}

if (process.env.JEST_IGNORE_UNITS) {
  module.exports.testPathIgnorePatterns.push('unit-.*\\.test\\.ts.*');
}

if (!process.env.JEST_NO_IGNORE_INTEGRATIONS) {
  module.exports.testPathIgnorePatterns.push('integration-.*\\.test\\.ts.*');
}
