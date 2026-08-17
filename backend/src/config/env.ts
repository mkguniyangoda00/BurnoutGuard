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
  LLM_API_URL: string;
  LLM_API_KEY: string;
  LLM_MODEL: string;
  JOURNAL_ENCRYPTION_KEY: string;
  CHATBOT_ENGINE: 'llm' | 'tensorflow' | 'rules';
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
  LLM_API_URL: getEnvOptional( 'LLM_API_URL', 'https://api.anthropic.com/v1/messages' ), 
  LLM_API_KEY: getEnvOptional('LLM_API_KEY'), 
  LLM_MODEL: getEnvOptional( 'LLM_MODEL', 'claude-sonnet-5' ),
  JOURNAL_ENCRYPTION_KEY: getEnvOptional('JOURNAL_ENCRYPTION_KEY', ''),
  CHATBOT_ENGINE: (() => {
    const configured = getEnvOptional('CHATBOT_ENGINE', '').trim().toLowerCase();
    if (configured === 'tensorflow' || configured === 'rules' || configured === 'llm') {
      return configured as 'llm' | 'tensorflow' | 'rules';
    }
    return getEnvOptional('LLM_API_KEY') ? 'llm' : 'tensorflow';
  })(),
};

console.log("Loaded .env from:", path.join(__dirname, "../../.env"));
console.log("LLM_API_KEY exists:", !!process.env.LLM_API_KEY);
console.log("LLM_MODEL:", process.env.LLM_MODEL);
console.log("CHATBOT_ENGINE:", Env.CHATBOT_ENGINE);

