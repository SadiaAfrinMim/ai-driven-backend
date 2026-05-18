import { Request, Response } from 'express';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { notificationService } from './notification.service';

/**
 * Get user's notifications
 */
const getNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const filters = {
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    skip: req.query.skip ? parseInt(req.query.skip as string) : undefined,
    isRead: req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined,
    type: req.query.type as any,
  };

  const result = await notificationService.getUserNotifications(userId, filters);
  sendResponse(res, 200, true, 'Notifications retrieved successfully', result);
});

/**
 * Get unread notification count
 */
const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const count = await notificationService.getUnreadCount(userId);
  sendResponse(res, 200, true, 'Unread notification count retrieved', { count });
});

/**
 * Mark notification as read
 */
const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const notificationId = req.params.id as string;
  const userId = (req as any).user.id;
  
  await notificationService.markAsRead(notificationId, userId);
  sendResponse(res, 200, true, 'Notification marked as read');
});

/**
 * Mark all notifications as read
 */
const markAllAsRead = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  
  await notificationService.markAllAsRead(userId);
  sendResponse(res, 200, true, 'All notifications marked as read');
});

/**
 * Delete notification
 */
const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const notificationId = req.params.id as string;
  const userId = (req as any).user.id;
  
  await notificationService.deleteNotification(notificationId, userId);
  sendResponse(res, 200, true, 'Notification deleted successfully');
});

export const notificationController = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};