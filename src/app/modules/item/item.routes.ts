import express from 'express';
import auth from '../../middlewares/auth';
import { uploadItemImages } from './item.upload';
import { itemController } from './item.controller';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', itemController.getItems);

// Authenticated routes (authentication required)
router.use(auth()); // All routes below require authentication

// Create item - MANAGER, ADMIN only
router.post(
  '/',
  auth('MANAGER', 'ADMIN'),
  uploadItemImages,
  itemController.createItem
);

// Get user's own items - USER, MANAGER, ADMIN
router.get('/my-items', auth('USER', 'MANAGER', 'ADMIN'), itemController.getMyItems);

// Admin Approval Routes
router.get('/pending', auth('ADMIN'), itemController.getPendingItems);
router.patch('/:id/approve', auth('ADMIN'), itemController.approveItem);
router.patch('/:id/reject', auth('ADMIN'), itemController.rejectItem);

// Specific ID routes (must come after more specific routes)
router.get('/:id', itemController.getItemById);
router.patch(
  '/:id',
  auth('MANAGER', 'ADMIN'),
  itemController.updateItem
);
router.delete('/:id', auth('ADMIN'), itemController.deleteItem);

export default router;