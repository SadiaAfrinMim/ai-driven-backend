"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = void 0;
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const notification_service_1 = require("./notification.service");
/**
 * Get user's notifications
 */
const getNotifications = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    const filters = {
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
        skip: req.query.skip ? parseInt(req.query.skip) : undefined,
        isRead: req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined,
        type: req.query.type,
    };
    const result = await notification_service_1.notificationService.getUserNotifications(userId, filters);
    (0, sendResponse_1.default)(res, 200, true, 'Notifications retrieved successfully', result);
});
/**
 * Get unread notification count
 */
const getUnreadCount = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    const count = await notification_service_1.notificationService.getUnreadCount(userId);
    (0, sendResponse_1.default)(res, 200, true, 'Unread notification count retrieved', { count });
});
/**
 * Mark notification as read
 */
const markAsRead = (0, catchAsync_1.default)(async (req, res) => {
    const notificationId = req.params.id;
    const userId = req.user.id;
    await notification_service_1.notificationService.markAsRead(notificationId, userId);
    (0, sendResponse_1.default)(res, 200, true, 'Notification marked as read');
});
/**
 * Mark all notifications as read
 */
const markAllAsRead = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    await notification_service_1.notificationService.markAllAsRead(userId);
    (0, sendResponse_1.default)(res, 200, true, 'All notifications marked as read');
});
/**
 * Delete notification
 */
const deleteNotification = (0, catchAsync_1.default)(async (req, res) => {
    const notificationId = req.params.id;
    const userId = req.user.id;
    await notification_service_1.notificationService.deleteNotification(notificationId, userId);
    (0, sendResponse_1.default)(res, 200, true, 'Notification deleted successfully');
});
exports.notificationController = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
