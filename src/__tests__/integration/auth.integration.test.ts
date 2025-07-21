/**
 * Integration tests for Authentication API endpoints
 * Tests the complete flow from HTTP request to database operations
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
  validateApiResponse,
  validateErrorResponse,
} from './test-helpers';

describe('Authentication API Integration Tests', () => {
  let testData: any;

  beforeAll(async () => {
    testData = await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = generateTestUserData();

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      validateApiResponse(response);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('registered successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      
      // Verify user data
      const { user, token } = response.body.data;
      expect(user.email).toBe(userData.email);
      expect(user.fullName).toBe(userData.fullName);
      expect(user.role).toBe(userData.role);
      expect(user.status).toBe('ACTIVE');
      expect(user).not.toHaveProperty('password'); // Password should not be returned
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should reject registration with invalid email format', async () => {
      const userData = generateTestUserData({ email: 'invalid-email' });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      validateErrorResponse(response, 400, 'email');
    });

    it('should reject registration with weak password', async () => {
      const userData = generateTestUserData({ password: '123' });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      validateErrorResponse(response, 400, 'password');
    });

    it('should reject registration with duplicate email', async () => {
      const userData = generateTestUserData({ email: testData.user.email });

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      validateErrorResponse(response, 409, 'already exists');
    });

    it('should reject registration with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      validateErrorResponse(response, 400);
    });

    it('should reject registration with invalid content type', async () => {
      const userData = generateTestUserData();

      const response = await request(app)
        .post('/api/auth/register')
        .send(`email=${userData.email}&password=${userData.password}`)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(400);

      validateErrorResponse(response, 400, 'Content-Type');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.user.email,
          password: testUsers.user.password,
        })
        .expect(200);

      validateApiResponse(response);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Login successful');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      
      // Verify user data
      const { user, token } = response.body.data;
      expect(user.email).toBe(testUsers.user.email);
      expect(user).not.toHaveProperty('password'); // Password should not be returned
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: testUsers.user.password,
        })
        .expect(401);

      validateErrorResponse(response, 401, 'Invalid email or password');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.user.email,
          password: 'wrongpassword',
        })
        .expect(401);

      validateErrorResponse(response, 401, 'Invalid email or password');
    });

    it('should reject login for inactive user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUsers.inactiveUser.email,
          password: testUsers.inactiveUser.password,
        })
        .expect(403);

      validateErrorResponse(response, 403, 'Account is inactive');
    });

    it('should reject login with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      validateErrorResponse(response, 400);
    });

    it('should reject login with invalid content type', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(`email=${testUsers.user.email}&password=${testUsers.user.password}`)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .expect(400);

      validateErrorResponse(response, 400, 'Content-Type');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully with valid token', async () => {
      const token = generateTestToken(testData.user);

      const response = await request(app)
        .post('/api/auth/logout')
        .set(createAuthHeader(token))
        .expect(200);

      validateApiResponse(response);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logout successful');
    });

    it('should reject logout without authentication token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      validateErrorResponse(response, 401, 'token');
    });

    it('should reject logout with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set(createAuthHeader('invalid-token'))
        .expect(401);

      validateErrorResponse(response, 401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile with valid token', async () => {
      const token = generateTestToken(testData.user);

      const response = await request(app)
        .get('/api/auth/me')
        .set(createAuthHeader(token))
        .expect(200);

      validateApiResponse(response);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('retrieved successfully');
      expect(response.body.data).toHaveProperty('id', testData.user.id);
      expect(response.body.data).toHaveProperty('email', testData.user.email);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should reject request without authentication token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      validateErrorResponse(response, 401, 'token');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set(createAuthHeader('invalid-token'))
        .expect(401);

      validateErrorResponse(response, 401);
    });
  });
});
