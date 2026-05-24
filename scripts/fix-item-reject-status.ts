// Run this after updating schema and running `prisma migrate dev` (or db push)
// to convert any legacy 'REJECT' item statuses to the new 'REJECTED' value.
// Usage: npx ts-node scripts/fix-item-reject-status.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing legacy ItemStatus REJECT -> REJECTED ...');

  // Using raw update to bypass client enum validation if old client still loaded
  // But after generate + restart, this should work with typed update too.
  const result = await prisma.$executeRawUnsafe(
    `UPDATE "Item" SET "status" = 'REJECTED' WHERE "status" = 'REJECT'`
  );

  console.log(`✅ Updated ${result} item(s) from REJECT to REJECTED.`);

  // Also ensure no other invalid values exist (defensive)
  const invalid = await prisma.$queryRawUnsafe<any[]>(
    `SELECT id, status FROM "Item" WHERE "status" NOT IN ('PENDING', 'APPROVED', 'REJECTED')`
  );
  if (Array.isArray(invalid) && invalid.length > 0) {
    console.warn('⚠️ Found items with invalid status values:', invalid);
  } else {
    console.log('✅ All item statuses are now valid.');
  }
}

main()
  .catch((e) => {
    console.error('Fix script error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
