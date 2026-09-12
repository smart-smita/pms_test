import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isProduction = (process.env.NODE_ENV || 'development') === 'production';

// Warn if running production with default secrets
if (isProduction) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'super_secret_jwt_access_key_htco_2026') {
    console.warn('⚠️  WARNING: JWT_SECRET is using the default insecure value. Set a strong secret in production .env');
  }
  if (!process.env.DB_PASSWORD) {
    console.warn('⚠️  WARNING: DB_PASSWORD is empty. Ensure production database has a strong password.');
  }
}

export const env = {
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT || '3306', 10),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'gaptm',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_access_key_htco_2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'super_secret_jwt_refresh_key_htco_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};
