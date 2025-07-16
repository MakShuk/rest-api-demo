import { Request, Response, NextFunction } from 'express';
import { config } from '../config/config';

/**
 * Request logger middleware
 * Logs incoming HTTP requests with details
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();

  // Log request details
  const requestInfo = {
    method: req.method,
    url: req.url,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  };

  if (config.nodeEnv === 'development') {
    console.log('📥 Incoming request:', requestInfo);
  }

  // Override res.end to log response details
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any): Response {
    const duration = Date.now() - startTime;

    const responseInfo = {
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || 0,
    };

    if (config.nodeEnv === 'development') {
      const statusEmoji = res.statusCode >= 400 ? '❌' : '✅';
      console.log(`${statusEmoji} Response:`, {
        ...requestInfo,
        ...responseInfo,
      });
    }

    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

/**
 * Security headers middleware
 * Adds additional security headers
 */
export const securityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');

  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
};
