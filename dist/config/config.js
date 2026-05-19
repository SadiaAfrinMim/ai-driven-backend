"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file
dotenv_1.default.config();
// Define the schema for environment variables
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z
        .enum(["development", "production", "test"])
        .default("development"),
    PORT: zod_1.z.coerce.number().default(5000),
    DATABASE_URL: zod_1.z.string().url(),
    FRONTEND_URL: zod_1.z.string().url().optional(),
    JWT_SECRET: zod_1.z.string().min(1),
    JWT_EXPIRES_IN: zod_1.z.string().default("1d"),
    GEMINI_API_KEY: zod_1.z.string().min(1).optional(),
    OPENAI_API_KEY: zod_1.z.string().min(1),
    REDIS_URL: zod_1.z.string().url().optional(),
    REDIS_HOST: zod_1.z.string().default("localhost"),
    REDIS_PORT: zod_1.z.coerce.number().default(6379),
    REDIS_ENABLED: zod_1.z.preprocess((val) => {
        if (typeof val === 'string')
            return val.toLowerCase() === 'true';
        if (typeof val === 'boolean')
            return val;
        return false;
    }, zod_1.z.boolean()).default(false),
    LOG_LEVEL: zod_1.z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});
// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
    console.error("Invalid environment variables:", parsedEnv.error.format());
    process.exit(1);
}
// Export the validated configuration
exports.config = {
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
};
