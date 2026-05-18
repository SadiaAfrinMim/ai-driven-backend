import express from 'express';
import validateRequest, { validateQuery } from '../../middlewares/validateRequest';
import auth from '../../middlewares/auth';
import { reviewController } from './review.controller';
import { reviewValidations } from './review.validation';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', validateQuery(reviewValidations.reviewFiltersValidationSchema), reviewController.getReviews);
router.get('/:id', reviewController.getReviewById);
router.get('/item/:itemId', reviewController.getItemReviews);
router.get('/stats/overview', reviewController.getReviewStats);

// Create review - USER, MANAGER, ADMIN
router.post(
  '/',
  auth('USER', 'MANAGER', 'ADMIN'),
  validateRequest(reviewValidations.createReviewValidationSchema),
  reviewController.createReview
);

// Get user reviews - USER, MANAGER, ADMIN
router.get('/user/my-reviews', auth('USER', 'MANAGER', 'ADMIN'), reviewController.getUserReviews);

// Update review - USER, MANAGER, ADMIN (users can update their own)
router.patch(
  '/:id',
  auth('USER', 'MANAGER', 'ADMIN'),
  validateRequest(reviewValidations.updateReviewValidationSchema),
  reviewController.updateReview
);

// Delete review - MANAGER, ADMIN only
router.delete('/:id', auth('MANAGER', 'ADMIN'), reviewController.deleteReview);

export default router;