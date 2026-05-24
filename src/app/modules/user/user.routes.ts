import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { userController } from './user.controller';
import { userValidations } from './user.validation';

const router = express.Router();

// Profile routes - USER, MANAGER, ADMIN can access their own profile
router.get('/profile', auth('USER', 'MANAGER', 'ADMIN'), userController.getProfile);

router.patch(
  '/profile',
  auth('USER', 'MANAGER', 'ADMIN'),
  validateRequest(userValidations.updateProfileValidationSchema),
  userController.updateProfile
);

// User statistics - USER, MANAGER, ADMIN can access their own stats
router.get('/stats', auth('USER', 'MANAGER', 'ADMIN'), userController.getStats);

// Delete account - USER, MANAGER, ADMIN can delete their own account
router.delete('/account', auth('USER', 'MANAGER', 'ADMIN'), userController.deleteAccount);

// Admin only routes - ADMIN role required
router.get('/all-users', auth('ADMIN', 'MANAGER'), userController.getAllUsers);

router.patch('/update-role', auth('ADMIN'), userController.updateUserRole);

export default router;