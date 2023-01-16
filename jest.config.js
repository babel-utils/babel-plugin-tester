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
  testTimeout: 1000 * 60 * (process.env.VSCODE_INSPECTOR_OPTIONS ? 60 * 24 : 1),
  // ? Minimum of 10 concurrent tests executed at once; maximum of cpu cores - 1
  maxConcurrency: Math.max(require('node:os').cpus().length - 1, 10),
  verbose: false,
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFilesAfterEnv: ['./test/setup.ts'],
  collectCoverageFrom: ['src/**/*.ts?(x)'],
  // ? Make sure jest-haste-map doesn't try to parse and cache fixtures
  modulePathIgnorePatterns: ['<rootDir>/test/fixtures']
};
