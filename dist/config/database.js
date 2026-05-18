"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
}
// Create a PostgreSQL connection pool
const pool = new pg_1.Pool({
    connectionString,
    ssl: {
        rejectUnauthorized: false,
    },
});
// Create the Prisma adapter
const adapter = new adapter_pg_1.PrismaPg(pool);
// Create the Prisma client with the adapter
const prisma = new client_1.PrismaClient({
    adapter,
    log: ['error', 'warn'],
});
exports.default = prisma;
