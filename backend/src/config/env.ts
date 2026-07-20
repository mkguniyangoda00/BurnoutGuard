import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

export interface EnvConfig {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  ML_SERVICE_URL: string;
  FRONTEND_URL: string;
  GOOGLE_CLIENT_ID: string;
  EMAIL_HOST: string;
  EMAIL_PORT: number;
  EMAIL_USER: string;
  EMAIL_PASS: string;
}

const getEnvOrThrow = (key: string): string => {
  const value = process.env[key];
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required but was not set.`);
  }
  return value;
};

/**
 * Optional env helper — returns empty string if not set.
 * Used for features that are opt-in (e.g. Google OAuth, Email).
 */
const getEnvOptional = (key: string, fallback = ''): string => {
  return process.env[key] ?? fallback;
};

export const Env: EnvConfig = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: getEnvOrThrow('DATABASE_URL'),
  JWT_SECRET: getEnvOrThrow('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnvOrThrow('JWT_EXPIRES_IN'),
  ML_SERVICE_URL: getEnvOrThrow('ML_SERVICE_URL'),
  FRONTEND_URL: getEnvOrThrow('FRONTEND_URL'),
  GOOGLE_CLIENT_ID: getEnvOptional('GOOGLE_CLIENT_ID'),
  EMAIL_HOST: getEnvOptional('EMAIL_HOST'),
  EMAIL_PORT: parseInt(getEnvOptional('EMAIL_PORT', '587'), 10),
  EMAIL_USER: getEnvOptional('EMAIL_USER'),
  EMAIL_PASS: getEnvOptional('EMAIL_PASS'),
};
