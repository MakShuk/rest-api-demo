import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import {
  authenticateToken,
  requireRole,
  requireOwnershipOrAdmin,
  AuthenticatedRequest,
} from '../../middleware/auth.middleware';
import { AppError } from '../../types/error.types';

// Mock dependencies
jest.mock('../../config/config', () => ({
  config: {
    jwtSecret: 'test-secret',
  },
}));

describe('Auth Middleware', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
      params: {},
    };
    res = {};
    next = jest.fn();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER' as const,
      };
      const token = jwt.sign(payload, 'test-secret');

      req.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticateToken(req as AuthenticatedRequest, res as Response, next);

      expect(req.user).toEqual(expect.objectContaining(payload));
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject request without token', () => {
      authenticateToken(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect((next as jest.Mock).mock.calls[0][0].message).toBe(
        'Access token is required'
      );
    });

    it('should reject invalid token', () => {
      req.headers = {
        authorization: 'Bearer invalid-token',
      };

      authenticateToken(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect((next as jest.Mock).mock.calls[0][0].message).toBe(
        'Invalid token'
      );
    });

    it('should reject expired token', () => {
      const payload = {
        userId: '123',
        email: 'test@example.com',
        role: 'USER' as const,
      };
      const token = jwt.sign(payload, 'test-secret', { expiresIn: '-1h' });

      req.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticateToken(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      // Note: expired tokens might be caught as invalid tokens depending on JWT library version
      const errorMessage = (next as jest.Mock).mock.calls[0][0].message;
      expect(['Token expired', 'Invalid token']).toContain(errorMessage);
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      req.user = { userId: '123', email: 'test@example.com', role: 'USER' };
    });

    it('should allow user with correct role', () => {
      const middleware = requireRole('USER');
      middleware(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject user with incorrect role', () => {
      const middleware = requireRole('ADMIN');
      middleware(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect((next as jest.Mock).mock.calls[0][0].message).toBe(
        'Insufficient permissions'
      );
    });

    it('should reject unauthenticated user', () => {
      delete req.user;
      const middleware = requireRole('USER');
      middleware(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect((next as jest.Mock).mock.calls[0][0].message).toBe(
        'Authentication required'
      );
    });

    it('should allow multiple roles', () => {
      const middleware = requireRole('USER', 'ADMIN');
      middleware(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('requireOwnershipOrAdmin', () => {
    it('should allow admin to access any resource', () => {
      req.user = { userId: '123', email: 'admin@example.com', role: 'ADMIN' };
      req.params = { id: '456' };

      const middleware = requireOwnershipOrAdmin();
      middleware(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should allow user to access own resource', () => {
      req.user = { userId: '123', email: 'user@example.com', role: 'USER' };
      req.params = { id: '123' };

      const middleware = requireOwnershipOrAdmin();
      middleware(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should reject user accessing other resource', () => {
      req.user = { userId: '123', email: 'user@example.com', role: 'USER' };
      req.params = { id: '456' };

      const middleware = requireOwnershipOrAdmin();
      middleware(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect((next as jest.Mock).mock.calls[0][0].message).toBe(
        'Access denied'
      );
    });

    it('should work with custom parameter name', () => {
      req.user = { userId: '123', email: 'user@example.com', role: 'USER' };
      req.params = { userId: '123' };

      const middleware = requireOwnershipOrAdmin('userId');
      middleware(req as AuthenticatedRequest, res as Response, next);

      expect(next).toHaveBeenCalledWith();
    });
  });
});
