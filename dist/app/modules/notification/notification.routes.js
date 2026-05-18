"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const notification_controller_1 = require("./notification.controller");
const router = (0, express_1.Router)();
// Apply authentication middleware to all routes
router.use((0, auth_1.default)());
// Get user's notifications
router.get('/', notification_controller_1.notificationController.getNotifications);
// Get unread notification count
router.get('/unread-count', notification_controller_1.notificationController.getUnreadCount);
// Mark notification as read
router.patch('/:id/read', notification_controller_1.notificationController.markAsRead);
// Mark all notifications as read
router.patch('/mark-all-read', notification_controller_1.notificationController.markAllAsRead);
// Delete notification
router.delete('/:id', notification_controller_1.notificationController.deleteNotification);
exports.default = router;
