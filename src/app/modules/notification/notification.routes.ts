import { Router } from 'express';
import auth from '../../middlewares/auth';
import { notificationController } from './notification.controller';

const router = Router();

// Apply authentication middleware to all routes
router.use(auth());

// Get user's notifications
router.get('/', notificationController.getNotifications);

// Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark notification as read
router.patch('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

export default router;