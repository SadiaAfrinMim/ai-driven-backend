require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const res = await prisma.item.findMany({
      where: {},
      skip: 0,
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { owner: { select: { id: true, name: true, email: true } }, reviews: { select: { rating: true } } },
    });
    console.log('items:', res.length);
  } catch (e) {
    console.error('ERROR', e);
  } finally { await prisma.$disconnect(); }
})();
