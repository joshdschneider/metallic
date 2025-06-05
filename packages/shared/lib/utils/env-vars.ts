import * as dotenv from 'dotenv';
import { z } from 'zod';

const EnvVarsSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('debug'),
  RATE_LIMIT_PER_MIN: z.coerce.number().default(2400),

  // URLs/ports
  SERVER_URL: z.string().default('http://localhost:8080'),
  SERVER_PORT: z.coerce.number().default(8080),
  DASHBOARD_URL: z.string().default('http://localhost:3000'),
  DASHBOARD_PORT: z.coerce.number().default(3000),

  // Storage
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),

  // 256-bit encryption key
  ENCRYPTION_KEY: z.string(),

  // WorkOS
  WORKOS_API_KEY: z.string().optional(),
  WORKOS_CLIENT_ID: z.string().optional(),
  WORKOS_COOKIE_PASSWORD: z.string().optional(),

  // Fly
  FLY_API_HOSTNAME: z.string(),
  FLY_API_TOKEN: z.string()
});

export const envVars = EnvVarsSchema.parse(
  process.env['NODE_ENV'] !== 'production' ? dotenv.config({ path: '../../.env' }).parsed : process.env
);
