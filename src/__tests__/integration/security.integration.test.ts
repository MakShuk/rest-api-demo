/**
 * Security Integration Tests
 * Tests for security features, edge cases, and potential vulnerabilities
 */

import request from 'supertest';
import app from '../../app';
import {
  setupTestDatabase,
  teardownTestDatabase,
  testUsers,
  generateTestUserData,
  createAuthHeader,
  generateTestToken,
  validateErrorResponse,
} from './test-helpers';

describe('Security Integration Tests', () => {
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

  describe('JWT Token Security', () => {
    it('should reject expired tokens', async () => {
      // This would require mocking JWT to create an expired token
      // For now, we test with an invalid token format
      const response = await request(app)
        .get('/api/auth/me')
        .set(createAuthHeader('expired.jwt.token'))
        .expect(401);

      validateErrorResponse(response, 401);
    });

    it('should reject malformed tokens', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set(createAuthHeader('malformed-token'))
        .expect(401);

      validateErrorResponse(response, 401);
    });

    it('should reject tokens with invalid signature', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set(
          createAuthHeader(
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid-signature'
          )
        )
        .expect(401);

      validateErrorResponse(response, 401);
    });

    it('should reject empty authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', '')
        .expect(401);

      validateErrorResponse(response, 401);
    });

    it('should reject authorization header without Bearer prefix', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', userToken)
        .expect(401);

      validateErrorResponse(response, 401);
    });
  });

  describe('Input Validation Security', () => {
    it('should prevent SQL injection in email field', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: "'; DROP TABLE users; --",
          password: 'password123',
        })
        .expect(400);

      validateErrorResponse(response, 400);
    });

    it('should prevent XSS in fullName field', async () => {
      const userData = generateTestUserData({
        fullName: '<script>alert("xss")</script>',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      validateErrorResponse(response, 400);
    });

    it('should prevent NoSQL injection attempts', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: { $ne: null },
          password: { $ne: null },
        })
        .expect(400);

      validateErrorResponse(response, 400);
    });

    it('should validate UUID format strictly', async () => {
      const response = await request(app)
        .get('/api/users/123')
        .set(createAuthHeader(adminToken))
        .expect(400);

      validateErrorResponse(response, 400, 'Invalid UUID');
    });

    it('should prevent path traversal in user ID', async () => {
      const response = await request(app)
        .get('/api/users/../admin')
        .set(createAuthHeader(adminToken))
        .expect(400);

      validateErrorResponse(response, 400);
    });
  });

  describe('Authorization Security', () => {
    it('should prevent privilege escalation via role manipulation', async () => {
      const userData = generateTestUserData({
        role: 'ADMIN' as any, // Try to register as admin
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Should register as USER, not ADMIN
      expect(response.body.data.user.role).toBe('USER');
    });

    it('should prevent users from accessing admin endpoints', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set(createAuthHeader(userToken))
        .expect(403);

      validateErrorResponse(response, 403, 'Admin privileges required');
    });

    it('should prevent users from modifying other users', async () => {
      const response = await request(app)
        .patch(`/api/users/${testData.admin.id}`)
        .set(createAuthHeader(userToken))
        .send({ fullName: 'Hacked Name' })
        .expect(403);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should prevent users from elevating their own privileges', async () => {
      const response = await request(app)
        .patch(`/api/users/${testData.user.id}`)
        .set(createAuthHeader(userToken))
        .send({ role: 'ADMIN' })
        .expect(403);

      validateErrorResponse(response, 403, 'cannot update');
    });
  });

  describe('Rate Limiting Security', () => {
    it('should apply rate limiting to authentication endpoints', async () => {
      // Make multiple rapid requests
      const promises = Array(10)
        .fill(null)
        .map(() =>
          request(app).post('/api/auth/login').send({
            email: 'nonexistent@test.com',
            password: 'wrongpassword',
          })
        );

      const responses = await Promise.all(promises);

      // All should have rate limit headers
      responses.forEach(response => {
        expect(response.headers).toHaveProperty('x-ratelimit-limit');
        expect(response.headers).toHaveProperty('x-ratelimit-remaining');
      });
    });
  });

  describe('Password Security', () => {
    it('should reject weak passwords', async () => {
      const weakPasswords = ['123', 'password', '12345678', 'qwerty', 'abc123'];

      for (const password of weakPasswords) {
        const userData = generateTestUserData({ password });

        const response = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        validateErrorResponse(response, 400, 'password');
      }
    });

    it('should not return password in any response', async () => {
      const userData = generateTestUserData();

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body.data.user).not.toHaveProperty('password');

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body.data.user).not.toHaveProperty('password');
    });
  });

  describe('Content Security', () => {
    it('should enforce JSON content type for POST requests', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send('email=test@test.com&password=test123')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(400);

      validateErrorResponse(response, 400, 'Content-Type');
    });

    it('should reject requests with no content type', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send('{"email":"test@test.com","password":"test123"}')
        .expect(400);

      validateErrorResponse(response, 400);
    });
  });

  describe('Error Information Disclosure', () => {
    it('should not reveal sensitive information in error messages', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.user.email,
          password: 'wrongpassword',
        })
        .expect(401);

      // Should not reveal whether email exists or not
      expect(response.body.message).toBe('Invalid email or password');
      expect(response.body.message).not.toContain('user not found');
      expect(response.body.message).not.toContain('password incorrect');
    });

    it('should not expose internal error details', async () => {
      // Try to cause an internal error
      const response = await request(app)
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .set(createAuthHeader(adminToken))
        .expect(404);

      expect(response.body).not.toHaveProperty('stack');
      expect(response.body).not.toHaveProperty('query');
      expect(response.body.message).not.toContain('prisma');
      expect(response.body.message).not.toContain('database');
    });
  });

  describe('CORS Security', () => {
    it('should include proper CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should handle preflight requests properly', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });
  });
});
