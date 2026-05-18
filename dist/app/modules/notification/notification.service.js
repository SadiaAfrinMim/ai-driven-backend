"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const database_1 = __importDefault(require("../../../config/database"));
exports.notificationService = {
    /**
     * Get notifications for a user
     */
    async getUserNotifications(userId, filters = {}) {
        // Build where clause
        const where = { userId };
        if (filters.isRead !== undefined) {
            where.isRead = filters.isRead;
        }
        if (filters.type) {
            where.type = filters.type;
        }
        // Get notifications
        const notifications = await database_1.default.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: filters.limit || 50,
            skip: filters.skip || 0,
        });
        // Get total count
        const total = await database_1.default.notification.count({ where });
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
    async getUnreadCount(userId) {
        return await database_1.default.notification.count({
            where: { userId, isRead: false },
        });
    },
    /**
     * Mark notification as read
     */
    async markAsRead(notificationId, userId) {
        return await database_1.default.notification.updateMany({
            where: { id: notificationId, userId },
            data: { isRead: true },
        });
    },
    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId) {
        return await database_1.default.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    },
    /**
     * Delete notification
     */
    async deleteNotification(notificationId, userId) {
        return await database_1.default.notification.deleteMany({
            where: { id: notificationId, userId },
        });
    },
    /**
     * Create a new notification
     */
    async createNotification(data) {
        return await database_1.default.notification.create({
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
    async createItemApprovalNotification(itemId, userId, approved) {
        const item = await database_1.default.item.findUnique({
            where: { id: itemId },
            select: { title: true, ownerId: true },
        });
        if (!item)
            return null;
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
    async createReviewNotification(reviewId, userId) {
        const review = await database_1.default.review.findUnique({
            where: { id: reviewId },
            include: {
                item: { select: { title: true, ownerId: true } },
                user: { select: { name: true } },
            },
        });
        if (!review)
            return null;
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
