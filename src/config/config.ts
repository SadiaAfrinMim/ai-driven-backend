import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Define the schema for environment variables
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().transform(Number).default(5000),
  DATABASE_URL: z.string().url(),
  FRONTEND_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default("1d"),
  GEMINI_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1),
  REDIS_URL: z.string().url().optional(),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.string().transform(Number).default(6379),
  REDIS_ENABLED: z.preprocess((val) => {
    if (typeof val === 'string') return val.toLowerCase() === 'true';
    if (typeof val === 'boolean') return val;
    return false;
  }, z.boolean()).default(false),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid environment variables:", parsedEnv.error.format());
  process.exit(1);
}

// Export the validated configuration
export const config = {
  env: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  database: {
    url: parsedEnv.data.DATABASE_URL,
  },
  frontend: {
    url: parsedEnv.data.FRONTEND_URL ?? 'http://localhost:3000',
  },
  jwt: {
    secret: parsedEnv.data.JWT_SECRET,
    expiresIn: parsedEnv.data.JWT_EXPIRES_IN,
  },
  gemini: {
    apiKey: parsedEnv.data.GEMINI_API_KEY,
  },
  openai: {
    apiKey: parsedEnv.data.OPENAI_API_KEY,
  },
  redis: {
    enabled: parsedEnv.data.REDIS_ENABLED,
    url: parsedEnv.data.REDIS_URL,
    host: parsedEnv.data.REDIS_HOST,
    port: parsedEnv.data.REDIS_PORT,
  },
  logger: {
    level: parsedEnv.data.LOG_LEVEL,
  },
} as const;