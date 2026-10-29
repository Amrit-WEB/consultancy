import dotenv from 'dotenv';

dotenv.config();

const VALID_ENVS = new Set(['development', 'test', 'production']);

export function validateEnv(rawEnv = process.env) {
  const portValue = Number(rawEnv.PORT ?? '3001');

  if (!Number.isInteger(portValue) || portValue < 1 || portValue > 65535) {
    throw new Error('Invalid PORT value. Use a number between 1 and 65535.');
  }

  const corsOrigin = (rawEnv.CORS_ORIGIN ?? 'http://localhost:5173').trim();
  if (!corsOrigin) {
    throw new Error('CORS_ORIGIN cannot be empty.');
  }

  const nodeEnv = (rawEnv.NODE_ENV ?? 'development').trim();
  if (!VALID_ENVS.has(nodeEnv)) {
    throw new Error(`NODE_ENV must be one of: ${[...VALID_ENVS].join(', ')}`);
  }

  return {
    port: portValue,
    corsOrigin,
    nodeEnv,
  };
}

export const env = validateEnv();

export function getEnv() {
  return { ...env };
}
