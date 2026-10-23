import 'dotenv/config';
import { z } from 'zod';

// JWT/session secrets must be long and random, e.g. `openssl rand -hex 32`
const secret = z.string().min(32, 'must be at least 32 characters');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.url(),

  // auth
  ACCESS_TOKEN: secret,
  // short-lived; clients get a new one from POST /api/auth/refresh-token
  ACCESS_EXPIRES: z.string().default('15m'),
  REFRESH_EXPIRES_DAYS: z.coerce.number().int().positive().default(30),
  FRONT_END_URL: z.url(),
  CORS_ORIGINS: z.string().optional(),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  // cloudinary
  CLOUD_NAME: z.string().optional(),
  CLOUD_API_KEY: z.string().optional(),
  CLOUD_API_SECRET: z.string().optional(),

  // swagger
  ENABLE_SWAGGER: z.enum(['true', 'false']).optional(),
  DEVELOPMENT_BASE_URL: z.string().default('http://localhost:5000'),
  PRODUCTION_BASE_URL: z.string().default(''),
});

type Env = z.infer<typeof envSchema>;

// logger depends on configs, so failures here are reported with console
const fail = (message: string): never => {
  // eslint-disable-next-line no-console
  console.error(message);
  process.exit(1);
};

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`);
  fail(`Invalid environment variables:\n${issues.join('\n')}`);
}
const env = parsed.data as Env;

export const configs = {
  port: env.PORT,
  env: env.NODE_ENV,
  is_production: env.NODE_ENV === 'production',
  is_test: env.NODE_ENV === 'test',
  db_url: env.DATABASE_URL,
  cors_origins: (env.CORS_ORIGINS ?? env.FRONT_END_URL).split(',').map((o) => o.trim()),
  trust_proxy: env.TRUST_PROXY,
  enable_swagger: env.ENABLE_SWAGGER
    ? env.ENABLE_SWAGGER === 'true'
    : env.NODE_ENV !== 'production',
  jwt: {
    access_token: env.ACCESS_TOKEN,
    access_expires: env.ACCESS_EXPIRES,
    refresh_expires_days: env.REFRESH_EXPIRES_DAYS,
    front_end_url: env.FRONT_END_URL,
  },
  cloudinary: {
    cloud_name: env.CLOUD_NAME,
    cloud_api_key: env.CLOUD_API_KEY,
    cloud_api_secret: env.CLOUD_API_SECRET,
  },
  swagger_config: {
    development_base_url: env.DEVELOPMENT_BASE_URL,
    production_base_url: env.PRODUCTION_BASE_URL,
  },
};
