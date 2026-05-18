import prisma from '../../../config/database';
import { INotificationFilters } from './notification.interface';

export const notificationService = {
  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: string, filters: INotificationFilters = {}) {
    // Build where clause
    const where: any = { userId };
    
    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }
    
    if (filters.type) {
      where.type = filters.type;
    }

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
      skip: filters.skip || 0,
    });

    // Get total count
    const total = await prisma.notification.count({ where });

    return {
      notifications,
      meta: {
        total,
        limit: filters.limit || 50,
        skip: filters.skip || 0,
        hasMore: total > (filters.skip || 0) + (filters.limit || 50),
      },
    };
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    });
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    return await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    return await prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  },

  /**
   * Create a new notification
   */
  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    relatedId?: string;
    relatedType?: string;
  }) {
    return await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        relatedId: data.relatedId,
        relatedType: data.relatedType,
      },
    });
  },

  /**
   * Create notification for item approval
   */
  async createItemApprovalNotification(itemId: string, userId: string, approved: boolean) {
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { title: true, ownerId: true },
    });

    if (!item) return null;

    // Notify item owner about approval/rejection
    if (item.ownerId !== userId) { // Don't notify self
      return await this.createNotification({
        userId: item.ownerId,
        title: approved ? 'Item Approved' : 'Item Rejected',
        message: approved 
          ? `Your item "${item.title}" has been approved and is now live on the platform.`
          : `Your item "${item.title}" has been rejected. Please review the feedback and resubmit if needed.`,
        type: approved ? 'SUCCESS' : 'ERROR',
        relatedId: itemId,
        relatedType: 'ITEM',
      });
    }

    return null;
  },

  /**
   * Create notification for new review
   */
  async createReviewNotification(reviewId: string, userId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        item: { select: { title: true, ownerId: true } },
        user: { select: { name: true } },
      },
    });

    if (!review) return null;

    // Notify item owner about new review
    if (review.item.ownerId !== userId) { // Don't notify self
      return await this.createNotification({
        userId: review.item.ownerId,
        title: 'New Review Received',
        message: `${review.user?.name} left a ${review.rating}-star review for your item "${review.item.title}".`,
        type: 'INFO',
        relatedId: reviewId,
        relatedType: 'REVIEW',
      });
    }

    return null;
  },
};