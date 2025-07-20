import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/config';
import { swaggerSpec } from './config/swagger.config';
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
  securityHeaders,
} from './middleware';

const app = express();

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Request logging middleware (only in development)
if (config.nodeEnv === 'development') {
  app.use(requestLogger);
}

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

app.use(securityHeaders);

// CORS configuration
app.use(
  cors({
    origin:
      config.nodeEnv === 'production'
        ? process.env['ALLOWED_ORIGINS']?.split(',') || false
        : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.nodeEnv === 'production' ? 100 : 1000, // More lenient in development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(
  express.json({
    limit: '10mb',
    type: 'application/json',
  })
);
app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

// Swagger documentation
if (config.nodeEnv !== 'production') {
  // Swagger UI setup with custom options
  const swaggerOptions = {
    explorer: true,
    swaggerOptions: {
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
      tryItOutEnabled: true,
      requestInterceptor: (req: any) => {
        // Add any custom headers or modifications here
        return req;
      },
    },
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0 }
      .swagger-ui .scheme-container { background: #fafafa; padding: 10px; border-radius: 4px; }
    `,
    customSiteTitle: 'REST API Documentation',
  };

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerOptions)
  );

  // JSON endpoint for the OpenAPI spec
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    uptime: process.uptime(),
  });
});

// API routes
import { authRoutes, userRoutes } from './routes';

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;
