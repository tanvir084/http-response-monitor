/**
 * Test Setup File
 * Runs before all tests to configure the test environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3002';

// Increase timeout for all tests
jest.setTimeout(30000);

// Suppress console logs during tests (optional)
// Uncomment to reduce noise in test output
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Global test helpers
global.wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Global test teardown
afterAll(async () => {
  // Add any global cleanup here
  await new Promise((resolve) => setTimeout(resolve, 500));
});
