/**
 * General API Integration Tests
 * Tests for general API functionality, health checks, error handling, etc.
 */

import request from 'supertest';
import app from '../../app';
import {
  setupTestDatabase,
  teardownTestDatabase,
  createAuthHeader,
  generateTestToken,
  validateErrorResponse,
} from './test-helpers';

describe('General API Integration Tests', () => {
  let testData: any;

  beforeAll(async () => {
    testData = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('uptime');
      expect(typeof response.body.uptime).toBe('number');
    });
  });

  describe('404 Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint')
        .expect(404);

      validateErrorResponse(response, 404, 'not found');
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent auth routes', async () => {
      const response = await request(app)
        .post('/api/auth/non-existent')
        .expect(404);

      validateErrorResponse(response, 404);
    });

    it('should return 404 for non-existent user routes', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-endpoint')
        .expect(404);

      validateErrorResponse(response, 404);
    });
  });

  describe('Content-Type Validation', () => {
    it('should reject non-JSON content type for auth endpoints', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send('email=test@test.com&password=test123')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(400);

      validateErrorResponse(response, 400, 'Content-Type');
    });

    it('should reject non-JSON content type for user update', async () => {
      const token = generateTestToken(testData.user);

      const response = await request(app)
        .patch(`/api/users/${testData.user.id}`)
        .set(createAuthHeader(token))
        .send('fullName=Test')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(400);

      validateErrorResponse(response, 400, 'Content-Type');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to auth endpoints', async () => {
      // This test would need to be adjusted based on your rate limiting configuration
      // For now, we'll just verify the endpoint responds normally
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@test.com',
          password: 'wrongpassword',
        })
        .expect(401);

      // Rate limiting headers should be present
      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in responses', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    it('should handle preflight OPTIONS requests', async () => {
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

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Helmet security headers
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error format for validation errors', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should return consistent error format for authentication errors', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return consistent error format for authorization errors', async () => {
      const userToken = generateTestToken(testData.user);

      const response = await request(app)
        .get('/api/users')
        .set(createAuthHeader(userToken))
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Request Logging', () => {
    it('should log requests in development mode', async () => {
      // This is more of a behavioral test - in a real scenario you might
      // want to capture logs and verify they contain the expected information
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.status).toBe(200);
    });
  });

  describe('JSON Parsing', () => {
    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send('{"email": "test@test.com", "password": "test123"') // Malformed JSON
        .set('Content-Type', 'application/json')
        .expect(400);

      validateErrorResponse(response, 400);
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .expect(400);

      validateErrorResponse(response, 400);
    });
  });

  describe('Large Request Handling', () => {
    it('should reject requests that are too large', async () => {
      const largeData = {
        email: 'test@test.com',
        password: 'test123',
        fullName: 'A'.repeat(10000), // Very long name
        description: 'B'.repeat(100000), // Very long description
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(largeData)
        .expect(413);

      validateErrorResponse(response, 413);
    });
  });

  describe('HTTP Methods', () => {
    it('should reject unsupported HTTP methods', async () => {
      const response = await request(app)
        .put('/api/auth/login') // PUT not supported for login
        .send({
          email: 'test@test.com',
          password: 'test123',
        })
        .expect(404);

      validateErrorResponse(response, 404);
    });
  });
});
