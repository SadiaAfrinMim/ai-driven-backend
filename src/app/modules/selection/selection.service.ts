import prisma from '../../../config/database';
import ApiError from '../../../errors/ApiError';
import { ICreateSelection } from './selection.interface';

const selectionService = {
  async createSelection(userId: string, payload: ICreateSelection) {
    const { itemId, quantity } = payload;

    // Find the item
    const item = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new ApiError(404, 'Product not found');
    }

    if (item.status !== 'APPROVED') {
      throw new ApiError(400, 'This product is not available for selection');
    }

    if ((item.quantity ?? 0) < quantity) {
      throw new ApiError(400, 'Not enough stock available');
    }

    // Prevent owner from selecting their own product
    if (item.ownerId === userId) {
      throw new ApiError(400, 'You cannot select your own product');
    }

    // Create selection + decrease stock in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const selection = await tx.selection.create({
        data: {
          userId,
          itemId,
          quantity,
          status: 'PENDING',
        },
        include: {
          item: {
            select: { id: true, title: true, price: true, images: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // Decrease stock
      await tx.item.update({
        where: { id: itemId },
        data: {
          quantity: (item.quantity ?? 0) - quantity,
        },
      });

      return selection;
    });

    return result;
  },

  async getMySelections(userId: string) {
    const selections = await prisma.selection.findMany({
      where: { userId },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            price: true,
            images: true,
            quantity: true,
            category: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { selections };
  },

  async getPendingSelections() {
    // For MANAGER / ADMIN
    return (prisma as any).selection.findMany({
      where: { status: 'PENDING' },
      include: {
        item: {
          select: { id: true, title: true, price: true, images: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getApprovedSelections() {
    return (prisma as any).selection.findMany({
      where: { status: 'APPROVED' },
      include: {
        item: { select: { id: true, title: true, price: true, images: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async approveSelection(id: string) {
    const selection = await (prisma as any).selection.findUnique({ where: { id } });
    if (!selection) throw new ApiError(404, 'Selection not found');
    if (selection.status !== 'PENDING') throw new ApiError(400, 'Can only approve pending selections');

    return (prisma as any).selection.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: {
        item: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async rejectSelection(id: string) {
    const selection = await (prisma as any).selection.findUnique({
      where: { id },
      include: { item: true },
    });
    if (!selection) throw new ApiError(404, 'Selection not found');
    if (selection.status !== 'PENDING') throw new ApiError(400, 'Can only reject pending selections');

    // Return stock when rejected
    await prisma.$transaction(async (tx: any) => {
      await tx.selection.update({
        where: { id },
        data: { status: 'REJECTED' },
      });

      await tx.item.update({
        where: { id: selection.itemId },
        data: {
          quantity: (selection.item.quantity ?? 0) + selection.quantity,
        },
      });
    });

    return { message: 'Selection rejected and stock restored' };
  },
};

export { selectionService };
