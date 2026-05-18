import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Create the Prisma adapter
const adapter = new PrismaPg(pool);

// Create the Prisma client with the adapter
const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});

export default prisma;