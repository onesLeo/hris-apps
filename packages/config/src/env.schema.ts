import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  KEYCLOAK_JWKS_URI: z.string().url().optional(),
  // Comma-separated list of allowed CORS origins, e.g. https://app.example.com
  CORS_ORIGINS: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
