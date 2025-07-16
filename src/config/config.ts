import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
}

export const config: Config = {
  nodeEnv: process.env['NODE_ENV'] || 'development',
  port: parseInt(process.env['PORT'] || '3000', 10),
  databaseUrl:
    process.env['DATABASE_URL'] ||
    'postgresql://user:password@localhost:5432/rest_api_db',
  jwtSecret:
    process.env['JWT_SECRET'] ||
    'your-super-secret-jwt-key-change-in-production',
  jwtExpiresIn: process.env['JWT_EXPIRES_IN'] || '24h',
  bcryptRounds: parseInt(process.env['BCRYPT_ROUNDS'] || '12', 10),
};

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

if (config.nodeEnv === 'production') {
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  });
}
