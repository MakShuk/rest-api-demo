/**
 * Basic routes test to verify that routes are properly configured
 * This is a simple smoke test to ensure routes are accessible
 */

import request from 'supertest';
import app from '../app';

describe('Routes Configuration', () => {
  describe('Health Check', () => {
    it('should respond to health check', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('OK');
    });
  });

  describe('Auth Routes', () => {
    it('should have register endpoint', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});
      
      // Should return validation error (400) not 404
      expect(response.status).not.toBe(404);
    });

    it('should have login endpoint', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});
      
      // Should return validation error (400) not 404
      expect(response.status).not.toBe(404);
    });

    it('should have logout endpoint', async () => {
      const response = await request(app)
        .post('/api/auth/logout');
      
      // Should return auth error (401) not 404
      expect(response.status).not.toBe(404);
    });

    it('should have me endpoint', async () => {
      const response = await request(app)
        .get('/api/auth/me');
      
      // Should return auth error (401) not 404
      expect(response.status).not.toBe(404);
    });
  });

  describe('User Routes', () => {
    it('should have users list endpoint', async () => {
      const response = await request(app)
        .get('/api/users');
      
      // Should return auth error (401) not 404
      expect(response.status).not.toBe(404);
    });

    it('should have user by id endpoint', async () => {
      const response = await request(app)
        .get('/api/users/123e4567-e89b-12d3-a456-426614174000');
      
      // Should return auth error (401) not 404
      expect(response.status).not.toBe(404);
    });

    it('should have user stats endpoint', async () => {
      const response = await request(app)
        .get('/api/users/stats');
      
      // Should return auth error (401) not 404
      expect(response.status).not.toBe(404);
    });

    it('should have user search endpoint', async () => {
      const response = await request(app)
        .get('/api/users/search?q=test');
      
      // Should return auth error (401) not 404
      expect(response.status).not.toBe(404);
    });

    it('should have user me endpoint', async () => {
      const response = await request(app)
        .get('/api/users/me');
      
      // Should return auth error (401) not 404
      expect(response.status).not.toBe(404);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route');
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
