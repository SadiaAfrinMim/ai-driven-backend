import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Standard Prisma Client - works reliably on Vercel serverless
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

export default prisma;