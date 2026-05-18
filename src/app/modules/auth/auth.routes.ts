import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { authController } from './auth.controller';
import { authValidations } from './auth.validation';

const router = express.Router();

// Register user
router.post(
  '/register',
  validateRequest(authValidations.registerUserValidationSchema),
  authController.registerUser
);

// Login user
router.post(
  '/login',
  validateRequest(authValidations.loginUserValidationSchema),
  authController.loginUser
);

// Refresh token
router.post('/refresh-token', authController.refreshToken);

// Logout user
router.post('/logout', authController.logoutUser);

export default router;