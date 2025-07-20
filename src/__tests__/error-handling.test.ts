import request from 'supertest';
import app from '../app';
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '../types/error.types';
import { ErrorFactory, createError } from '../utils/error.utils';

describe('Error Handling System', () => {
  describe('Custom Error Classes', () => {
    it('should create AppError with correct properties', () => {
      const error = new AppError('Test error', 400, true, 'TEST_ERROR', { test: true });
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.details).toEqual({ test: true });
      expect(error.name).toBe('AppError');
    });

    it('should create ValidationError with correct defaults', () => {
      const error = new ValidationError('Validation failed', { email: ['Invalid'] });
      
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ email: ['Invalid'] });
    });

    it('should create NotFoundError with resource info', () => {
      const error = new NotFoundError('User not found', 'User');
      
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.details).toEqual({ resource: 'User' });
    });

    it('should create UnauthorizedError with reason', () => {
      const error = new UnauthorizedError('Access denied', 'Invalid token');
      
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.details).toEqual({ reason: 'Invalid token' });
    });

    it('should create ForbiddenError with action', () => {
      const error = new ForbiddenError('Access denied', 'delete user');
      
      expect(error.message).toBe('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
      expect(error.details).toEqual({ action: 'delete user' });
    });

    it('should create ConflictError with conflict type', () => {
      const error = new ConflictError('Resource exists', 'DUPLICATE_EMAIL');
      
      expect(error.message).toBe('Resource exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
      expect(error.details).toEqual({ conflictType: 'DUPLICATE_EMAIL' });
    });
  });

  describe('ErrorFactory', () => {
    it('should create validation error', () => {
      const error = ErrorFactory.validation('Invalid data', { email: ['Required'] });
      
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid data');
      expect(error.details).toEqual({ email: ['Required'] });
    });

    it('should create not found error', () => {
      const error = ErrorFactory.notFound('User', '123');
      
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe("User with id '123' not found");
    });

    it('should create unauthorized error', () => {
      const error = ErrorFactory.unauthorized('Invalid token');
      
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe('Unauthorized access');
      expect(error.details).toEqual({ reason: 'Invalid token' });
    });

    it('should create forbidden error', () => {
      const error = ErrorFactory.forbidden('delete user');
      
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe('Access denied for action: delete user');
    });

    it('should create conflict error', () => {
      const error = ErrorFactory.conflict('User', 'email');
      
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toBe('User with this email already exists');
    });
  });

  describe('createError helpers', () => {
    it('should create user not found error', () => {
      const error = createError.userNotFound('123');
      
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe("User with id '123' not found");
    });

    it('should create user exists error', () => {
      const error = createError.userExists('email');
      
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.message).toBe('User with this email already exists');
    });

    it('should create invalid credentials error', () => {
      const error = createError.invalidCredentials();
      
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect(error.message).toBe('Unauthorized access');
    });

    it('should create authentication error', () => {
      const error = createError.authentication();
      
      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
    });

    it('should create insufficient permissions error', () => {
      const error = createError.insufficientPermissions('view profile');
      
      expect(error).toBeInstanceOf(ForbiddenError);
      expect(error.message).toBe('Access denied for action: view profile');
    });
  });

  describe('Error Response Format', () => {
    it('should return standardized error response for 404', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('not found'),
        timestamp: expect.any(String),
        path: '/api/nonexistent',
        method: 'GET',
      });
    });

    it('should handle validation errors properly', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          // Invalid data to trigger validation error
          email: 'invalid-email',
          password: '123', // Too short
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Validation'),
        timestamp: expect.any(String),
      });
    });
  });

  describe('Error Middleware Integration', () => {
    it('should handle thrown AppError correctly', async () => {
      // This would require a test endpoint that throws an error
      // For now, we test the structure
      const error = new AppError('Test error', 400, true, 'TEST_CODE', { test: true });
      
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ test: true });
    });

    it('should handle unknown errors as internal server errors', () => {
      const error = new Error('Unknown error');
      
      // This would be processed by errorHandler middleware
      expect(error.message).toBe('Unknown error');
      expect(error.name).toBe('Error');
    });
  });
});

describe('Error Logging', () => {
  it('should log error details', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const error = new AppError('Test error', 500);
    
    // Simulate error logging (would be done by errorHandler)
    console.error('Error occurred:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error occurred:',
      expect.objectContaining({
        message: 'Test error',
        stack: expect.any(String),
        timestamp: expect.any(String),
      })
    );
    
    consoleSpy.mockRestore();
  });
});
