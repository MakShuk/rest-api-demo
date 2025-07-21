import app from './app';
import { config } from './config/config';

const PORT = config.port || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📚 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);

  // Show Swagger documentation URL in development
  if (config.nodeEnv !== 'production') {
    console.log(`📖 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`📄 OpenAPI Spec: http://localhost:${PORT}/api-docs.json`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

export default server;
