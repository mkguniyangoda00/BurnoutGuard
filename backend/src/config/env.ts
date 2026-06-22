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
}

const getEnvOrThrow = (key: string): string => {
  const value = process.env[key];
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is required but was not set.`);
  }
  return value;
};

export const Env: EnvConfig = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: getEnvOrThrow('DATABASE_URL'),
  JWT_SECRET: getEnvOrThrow('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnvOrThrow('JWT_EXPIRES_IN'),
  ML_SERVICE_URL: getEnvOrThrow('ML_SERVICE_URL'),
  FRONTEND_URL: getEnvOrThrow('FRONTEND_URL'),
};
