/**
 * Jest configuration for integration tests
 * Separate configuration to run integration tests with different settings
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/integration/**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/server.ts',
    '!src/__tests__/**/*',
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000, // Longer timeout for integration tests
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  // Setup files for integration tests
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/integration/setup.ts'],
  // Run tests serially to avoid database conflicts
  maxWorkers: 1,
  // Environment variables for testing
  testEnvironmentOptions: {
    NODE_ENV: 'test',
  },
};
