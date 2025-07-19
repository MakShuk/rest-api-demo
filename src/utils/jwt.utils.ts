import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { JwtPayload } from '../types';
import { AppError } from '../types/error.types';

/**
 * Generate JWT token for user
 */
export const generateToken = (
  payload: Omit<JwtPayload, 'iat' | 'exp'>
): string => {
  try {
    return (jwt as any).sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });
  } catch (error) {
    throw new AppError('Failed to generate token', 500);
  }
};

/**
 * Generate refresh token (longer expiration)
 */
export const generateRefreshToken = (
  payload: Omit<JwtPayload, 'iat' | 'exp'>
): string => {
  try {
    return (jwt as any).sign(payload, config.jwtSecret, {
      expiresIn: '7d', // 7 days for refresh token
    });
  } catch (error) {
    throw new AppError('Failed to generate refresh token', 500);
  }
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    return (jwt as any).verify(token, config.jwtSecret) as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token', 401);
    } else if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token expired', 401);
    } else {
      throw new AppError('Token verification failed', 401);
    }
  }
};

/**
 * Decode token without verification (for debugging)
 */
export const decodeToken = (token: string): any => {
  try {
    return (jwt as any).decode(token);
  } catch (error) {
    throw new AppError('Failed to decode token', 400);
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) {
    return null;
  }

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7);
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = (jwt as any).decode(token) as any;
    if (!decoded || !decoded.exp) {
      return true;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch (error) {
    return true;
  }
};

/**
 * Get token expiration time
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = (jwt as any).decode(token) as any;
    if (!decoded || !decoded.exp) {
      return null;
    }

    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
};

/**
 * Create token payload from user data
 */
export const createTokenPayload = (user: {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
}): Omit<JwtPayload, 'iat' | 'exp'> => {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
};

/**
 * Validate token format
 */
export const isValidTokenFormat = (token: string): boolean => {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // JWT tokens have 3 parts separated by dots
  const parts = token.split('.');
  return parts.length === 3;
};

/**
 * Generate token pair (access + refresh)
 */
export const generateTokenPair = (payload: Omit<JwtPayload, 'iat' | 'exp'>) => {
  return {
    accessToken: generateToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};
