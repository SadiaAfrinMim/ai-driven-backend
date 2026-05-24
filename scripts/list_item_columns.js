require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const res = await prisma.$queryRawUnsafe(`SELECT table_schema, table_name, column_name
      FROM information_schema.columns
      WHERE table_name ILIKE '%item%'
      ORDER BY table_schema, table_name, ordinal_position`);
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('ERROR', e);
  } finally {
    await prisma.$disconnect();
  }
})();
