/**
 * Setup file for integration tests
 * Configures the test environment before running integration tests
 */

import { config } from 'dotenv';
import path from 'path';

// Load test environment variables
config({ path: path.resolve(__dirname, '../../../.env.test') });

// Set test environment
process.env['NODE_ENV'] = 'test';
process.env['JWT_SECRET'] = 'test-jwt-secret-key-for-integration-tests';
process.env['DATABASE_URL'] = 'file:./test.db';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  // Any global setup can go here
  console.log('🧪 Starting integration tests...');
});

afterAll(async () => {
  // Any global cleanup can go here
  console.log('✅ Integration tests completed');
});

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions in tests
process.on('uncaughtException', error => {
  console.error('Uncaught Exception:', error);
});

// Mock console methods to reduce noise during tests (optional)
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Suppress expected error logs during tests
  console.error = jest.fn(message => {
    // Only suppress specific expected errors
    if (
      typeof message === 'string' &&
      (message.includes('Invalid token') ||
        message.includes('Authentication required') ||
        message.includes('Access denied'))
    ) {
      return;
    }
    originalConsoleError(message);
  });

  console.warn = jest.fn(message => {
    // Suppress warnings during tests
    if (typeof message === 'string' && message.includes('deprecated')) {
      return;
    }
    originalConsoleWarn(message);
  });
});

afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
