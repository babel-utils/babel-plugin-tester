'use strict';

module.exports = {
  restoreMocks: true,
  resetMocks: true,
  testEnvironment: 'node',
  testRunner: 'jest-circus/runner',
  testTimeout: 600000,
  verbose: false,
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  collectCoverageFrom: ['src/**/*.ts?(x)']
};
