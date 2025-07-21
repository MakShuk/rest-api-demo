/**
 * Integration tests for Users API endpoints
 * Tests the complete flow from HTTP request to database operations
 */

import request from 'supertest';
import app from '../../app';
import {
  setupTestDatabase,
  teardownTestDatabase,
  generateTestUserData,
  createAuthHeader,
  generateTestToken,
  validateApiResponse,
  validateErrorResponse,
  createTestUser,
} from './test-helpers';

describe('Users API Integration Tests', () => {
  let testData: any;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    testData = await setupTestDatabase();
    adminToken = generateTestToken(testData.admin);
    userToken = generateTestToken(testData.user);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('GET /api/users', () => {
    it('should return all users for admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set(createAuthHeader(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users.length).toBeGreaterThan(0);

      // Verify user data structure
      const user = response.body.data.users[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('fullName');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('status');
      expect(user).not.toHaveProperty('password');
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=2')
        .set(createAuthHeader(adminToken))
        .expect(200);

      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 2);
      expect(response.body.data.pagination).toHaveProperty('total');
      expect(response.body.data.pagination).toHaveProperty('totalPages');
    });

    it('should reject access for regular user', async () => {
      const response = await request(app)
        .get('/api/users')
        .set(createAuthHeader(userToken))
        .expect(403);

      validateErrorResponse(response, 403, 'Admin privileges required');
    });

    it('should reject access without authentication', async () => {
      const response = await request(app).get('/api/users').expect(401);

      validateErrorResponse(response, 401, 'token');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by ID for admin', async () => {
      const response = await request(app)
        .get(`/api/users/${testData.user.id}`)
        .set(createAuthHeader(adminToken))
        .expect(200);

      validateApiResponse(response);
      expect(response.body.data).toHaveProperty('id', testData.user.id);
      expect(response.body.data).toHaveProperty('email', testData.user.email);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should allow user to access own profile', async () => {
      const response = await request(app)
        .get(`/api/users/${testData.user.id}`)
        .set(createAuthHeader(userToken))
        .expect(200);

      validateApiResponse(response);
      expect(response.body.data).toHaveProperty('id', testData.user.id);
    });

    it('should reject user accessing other user profile', async () => {
      const response = await request(app)
        .get(`/api/users/${testData.admin.id}`)
        .set(createAuthHeader(userToken))
        .expect(403);

      validateErrorResponse(response, 403, 'insufficient permissions');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .get(`/api/users/${nonExistentId}`)
        .set(createAuthHeader(adminToken))
        .expect(404);

      validateErrorResponse(response, 404, 'not found');
    });

    it('should reject invalid UUID format', async () => {
      const response = await request(app)
        .get('/api/users/invalid-id')
        .set(createAuthHeader(adminToken))
        .expect(400);

      validateErrorResponse(response, 400, 'Invalid UUID');
    });

    it('should reject access without authentication', async () => {
      const response = await request(app)
        .get(`/api/users/${testData.user.id}`)
        .expect(401);

      validateErrorResponse(response, 401, 'token');
    });
  });

  describe('GET /api/users/me', () => {
    it('should return current user profile', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set(createAuthHeader(userToken))
        .expect(200);

      validateApiResponse(response);
      expect(response.body.data).toHaveProperty('id', testData.user.id);
      expect(response.body.data).toHaveProperty('email', testData.user.email);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should work for admin user', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set(createAuthHeader(adminToken))
        .expect(200);

      validateApiResponse(response);
      expect(response.body.data).toHaveProperty('id', testData.admin.id);
      expect(response.body.data).toHaveProperty('role', 'ADMIN');
    });

    it('should reject access without authentication', async () => {
      const response = await request(app).get('/api/users/me').expect(401);

      validateErrorResponse(response, 401, 'token');
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should allow user to update own profile (limited fields)', async () => {
      const updateData = {
        fullName: 'Updated Name',
        birthDate: '1991-01-01',
      };

      const response = await request(app)
        .patch(`/api/users/${testData.user.id}`)
        .set(createAuthHeader(userToken))
        .send(updateData)
        .expect(200);

      validateApiResponse(response);
      expect(response.body.data).toHaveProperty(
        'fullName',
        updateData.fullName
      );
    });

    it('should reject user updating restricted fields', async () => {
      const updateData = {
        role: 'ADMIN',
        status: 'INACTIVE',
      };

      const response = await request(app)
        .patch(`/api/users/${testData.user.id}`)
        .set(createAuthHeader(userToken))
        .send(updateData)
        .expect(403);

      validateErrorResponse(response, 403, 'cannot update');
    });

    it('should allow admin to update any user with any fields', async () => {
      const updateData = {
        fullName: 'Admin Updated Name',
        role: 'ADMIN',
        status: 'INACTIVE',
      };

      const response = await request(app)
        .patch(`/api/users/${testData.user.id}`)
        .set(createAuthHeader(adminToken))
        .send(updateData)
        .expect(200);

      validateApiResponse(response);
      expect(response.body.data).toHaveProperty(
        'fullName',
        updateData.fullName
      );
      expect(response.body.data).toHaveProperty('role', updateData.role);
      expect(response.body.data).toHaveProperty('status', updateData.status);
    });

    it('should reject user updating other user profile', async () => {
      const updateData = { fullName: 'Unauthorized Update' };

      const response = await request(app)
        .patch(`/api/users/${testData.admin.id}`)
        .set(createAuthHeader(userToken))
        .send(updateData)
        .expect(403);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should validate update data', async () => {
      const updateData = {
        email: 'invalid-email',
        birthDate: 'invalid-date',
      };

      const response = await request(app)
        .patch(`/api/users/${testData.user.id}`)
        .set(createAuthHeader(userToken))
        .send(updateData)
        .expect(400);

      validateErrorResponse(response, 400);
    });

    it('should reject access without authentication', async () => {
      const response = await request(app)
        .patch(`/api/users/${testData.user.id}`)
        .send({ fullName: 'Test' })
        .expect(401);

      validateErrorResponse(response, 401, 'token');
    });
  });

  describe('PATCH /api/users/:id/block', () => {
    let testUserToBlock: any;

    beforeEach(async () => {
      testUserToBlock = await createTestUser(generateTestUserData());
    });

    it('should allow admin to block user', async () => {
      const response = await request(app)
        .patch(`/api/users/${testUserToBlock.id}/block`)
        .set(createAuthHeader(adminToken))
        .expect(200);

      validateApiResponse(response);
      expect(response.body.data).toHaveProperty('status', 'INACTIVE');
    });

    it('should reject regular user blocking another user', async () => {
      const response = await request(app)
        .patch(`/api/users/${testUserToBlock.id}/block`)
        .set(createAuthHeader(userToken))
        .expect(403);

      validateErrorResponse(response, 403, 'Admin privileges required');
    });

    it('should reject access without authentication', async () => {
      const response = await request(app)
        .patch(`/api/users/${testUserToBlock.id}/block`)
        .expect(401);

      validateErrorResponse(response, 401, 'token');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .patch(`/api/users/${nonExistentId}/block`)
        .set(createAuthHeader(adminToken))
        .expect(404);

      validateErrorResponse(response, 404, 'not found');
    });
  });

  describe('PATCH /api/users/:id/unblock', () => {
    let testUserToUnblock: any;

    beforeEach(async () => {
      testUserToUnblock = await createTestUser({
        ...generateTestUserData(),
        status: 'INACTIVE' as const,
      });
    });

    it('should allow admin to unblock user', async () => {
      const response = await request(app)
        .patch(`/api/users/${testUserToUnblock.id}/unblock`)
        .set(createAuthHeader(adminToken))
        .expect(200);

      validateApiResponse(response);
      expect(response.body.data).toHaveProperty('status', 'ACTIVE');
    });

    it('should reject regular user unblocking another user', async () => {
      const response = await request(app)
        .patch(`/api/users/${testUserToUnblock.id}/unblock`)
        .set(createAuthHeader(userToken))
        .expect(403);

      validateErrorResponse(response, 403, 'Admin privileges required');
    });

    it('should reject access without authentication', async () => {
      const response = await request(app)
        .patch(`/api/users/${testUserToUnblock.id}/unblock`)
        .expect(401);

      validateErrorResponse(response, 401, 'token');
    });
  });

  describe('DELETE /api/users/:id', () => {
    let testUserToDelete: any;

    beforeEach(async () => {
      testUserToDelete = await createTestUser(generateTestUserData());
    });

    it('should allow admin to delete user', async () => {
      const response = await request(app)
        .delete(`/api/users/${testUserToDelete.id}`)
        .set(createAuthHeader(adminToken))
        .expect(200);

      validateApiResponse(response);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should reject regular user deleting another user', async () => {
      const response = await request(app)
        .delete(`/api/users/${testUserToDelete.id}`)
        .set(createAuthHeader(userToken))
        .expect(403);

      validateErrorResponse(response, 403, 'Admin privileges required');
    });

    it('should reject access without authentication', async () => {
      const response = await request(app)
        .delete(`/api/users/${testUserToDelete.id}`)
        .expect(401);

      validateErrorResponse(response, 401, 'token');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';

      const response = await request(app)
        .delete(`/api/users/${nonExistentId}`)
        .set(createAuthHeader(adminToken))
        .expect(404);

      validateErrorResponse(response, 404, 'not found');
    });
  });

  describe('GET /api/users/stats', () => {
    it('should return user statistics for admin', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set(createAuthHeader(adminToken))
        .expect(200);

      validateApiResponse(response);
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('activeUsers');
      expect(response.body.data).toHaveProperty('inactiveUsers');
      expect(response.body.data).toHaveProperty('adminUsers');
      expect(response.body.data).toHaveProperty('regularUsers');
      expect(typeof response.body.data.totalUsers).toBe('number');
    });

    it('should reject regular user accessing statistics', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set(createAuthHeader(userToken))
        .expect(403);

      validateErrorResponse(response, 403, 'Admin privileges required');
    });

    it('should reject access without authentication', async () => {
      const response = await request(app).get('/api/users/stats').expect(401);

      validateErrorResponse(response, 401, 'token');
    });
  });

  describe('GET /api/users/search', () => {
    it('should search users for admin', async () => {
      const response = await request(app)
        .get('/api/users/search?q=test')
        .set(createAuthHeader(adminToken))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('users');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    it('should reject regular user searching users', async () => {
      const response = await request(app)
        .get('/api/users/search?q=test')
        .set(createAuthHeader(userToken))
        .expect(403);

      validateErrorResponse(response, 403, 'Admin privileges required');
    });

    it('should reject access without authentication', async () => {
      const response = await request(app)
        .get('/api/users/search?q=test')
        .expect(401);

      validateErrorResponse(response, 401, 'token');
    });

    it('should require search query parameter', async () => {
      const response = await request(app)
        .get('/api/users/search')
        .set(createAuthHeader(adminToken))
        .expect(400);

      validateErrorResponse(response, 400);
    });
  });
});
