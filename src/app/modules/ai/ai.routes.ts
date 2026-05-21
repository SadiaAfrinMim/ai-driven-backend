import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest, { validateQuery } from '../../middlewares/validateRequest';
import { aiController } from './ai.controller';
import { aiValidations } from './ai.validation';

const router = express.Router();

// Generate content - USER, MANAGER, ADMIN
router.post(
  '/generate-content',
  auth('USER', 'MANAGER', 'ADMIN'),
  validateRequest(aiValidations.contentGenerationValidationSchema),
  aiController.generateContent
);

// Generate item content - USER, MANAGER, ADMIN
router.post(
  '/generate-item-content',
  auth('USER', 'MANAGER', 'ADMIN'),
  validateRequest(aiValidations.contentGenerationValidationSchema),
  aiController.generateItemContent
);

router.post('/discover', aiController.discoverProducts);

// Allow recommendations to be fetched with a query userId for debugging (no auth required)
router.get(
  '/recommendations',
  validateQuery(aiValidations.recommendationValidationSchema),
  aiController.getRecommendations
);

// Other authenticated routes
router.use(auth()); // Apply auth middleware for all routes below

router.post(
  '/chat',
  validateRequest(aiValidations.chatValidationSchema),
  aiController.chatWithAI
);

// Analytics - ADMIN only
router.get(
  '/analytics',
  auth('ADMIN'),
  validateQuery(aiValidations.analyticsValidationSchema),
  aiController.generateAnalytics
);

router.post(
  '/generate-blog',
  validateRequest(aiValidations.generateBlogValidationSchema),
  aiController.generateBlog
);

router.get('/chat-history', aiController.getChatHistory);

// Insights - MANAGER, ADMIN
router.get('/insights', auth('MANAGER', 'ADMIN'), aiController.getInsights);

// Advanced trending features 2026
router.post('/analyze-trends', auth('USER', 'MANAGER', 'ADMIN'), aiController.analyzeTrends);
router.post('/analyze-sentiment', auth('USER', 'MANAGER', 'ADMIN'), aiController.analyzeSentiment);

// Generate AI review text
router.post('/generate-review', auth('USER', 'MANAGER', 'ADMIN'), aiController.generateReview);

export default router;
