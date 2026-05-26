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

// Public: AI review text generation (used in public product review form)
router.post('/generate-review', aiController.generateReview);

// Public chat endpoint (no authentication required)
router.post(
  '/chat-public',
  validateRequest(aiValidations.chatValidationSchema),
  aiController.chatWithAI
);

// Other authenticated routes
router.use(auth()); // Apply auth middleware for all routes below

router.get(
  '/recommendations',
  validateQuery(aiValidations.recommendationValidationSchema),
  aiController.getRecommendations
);

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

// NEW: AI Natural Language Command (powerful "just tell me what to do" feature)
router.post('/command', auth('USER', 'MANAGER', 'ADMIN'), aiController.processCommand);

export default router;