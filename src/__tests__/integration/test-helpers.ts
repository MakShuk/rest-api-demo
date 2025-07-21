/**
 * Test helpers for integration tests
 * Provides utilities for database setup, user creation, and authentication
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken, createTokenPayload } from '../../utils/jwt.utils';

// Create a separate Prisma instance for tests
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env['TEST_DATABASE_URL'] || 'file:./test.db',
    },
  },
});

/**
 * Test user data templates
 */
export const testUsers = {
  admin: {
    fullName: 'Admin User',
    birthDate: new Date('1985-01-01'),
    email: 'admin@test.com',
    password: 'AdminPass123!',
    role: 'ADMIN' as const,
    status: 'ACTIVE' as const,
  },
  user: {
    fullName: 'Regular User',
    birthDate: new Date('1990-05-15'),
    email: 'user@test.com',
    password: 'UserPass123!',
    role: 'USER' as const,
    status: 'ACTIVE' as const,
  },
  inactiveUser: {
    fullName: 'Inactive User',
    birthDate: new Date('1988-12-25'),
    email: 'inactive@test.com',
    password: 'InactivePass123!',
    role: 'USER' as const,
    status: 'INACTIVE' as const,
  },
};

/**
 * Clean up database before/after tests
 */
export async function cleanupDatabase(): Promise<void> {
  try {
    // Delete in correct order due to foreign key constraints
    await testPrisma.task.deleteMany();
    await testPrisma.user.deleteMany();
  } catch (error) {
    console.error('Error cleaning up database:', error);
  }
}

/**
 * Create a test user in the database
 */
export async function createTestUser(userData: any) {
  const hashedPassword = await bcrypt.hash(userData.password, 10);

  return await testPrisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
    },
  });
}

/**
 * Create multiple test users
 */
export async function createTestUsers() {
  const admin = await createTestUser(testUsers.admin);
  const user = await createTestUser(testUsers.user);
  const inactiveUser = await createTestUser(testUsers.inactiveUser);

  return { admin, user, inactiveUser };
}

/**
 * Generate JWT token for test user
 */
export function generateTestToken(user: {
  id: string;
  email: string;
  role: string;
}) {
  const payload = createTokenPayload({
    id: user.id,
    email: user.email,
    role: user.role as 'ADMIN' | 'USER',
  });
  return generateToken(payload);
}

/**
 * Create authorization header for requests
 */
export function createAuthHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Setup test database and create test users
 */
export async function setupTestDatabase() {
  await cleanupDatabase();
  return await createTestUsers();
}

/**
 * Teardown test database
 */
export async function teardownTestDatabase() {
  await cleanupDatabase();
  await testPrisma.$disconnect();
}

/**
 * Validate API response structure
 */
export function validateApiResponse(response: any, expectedData?: any) {
  expect(response.body).toHaveProperty('success');
  expect(response.body).toHaveProperty('message');

  if (expectedData) {
    expect(response.body).toHaveProperty('data');
    if (typeof expectedData === 'object') {
      expect(response.body.data).toMatchObject(expectedData);
    }
  }
}

/**
 * Validate error response structure
 */
export function validateErrorResponse(
  response: any,
  expectedStatus: number,
  expectedMessage?: string
) {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('message');

  if (expectedMessage) {
    expect(response.body.message).toContain(expectedMessage);
  }
}

/**
 * Generate random email for testing
 */
export function generateRandomEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test-${timestamp}-${random}@example.com`;
}

/**
 * Generate test user data with random email
 */
export function generateTestUserData(
  overrides: Partial<typeof testUsers.user> = {}
) {
  return {
    ...testUsers.user,
    email: generateRandomEmail(),
    ...overrides,
  };
}
