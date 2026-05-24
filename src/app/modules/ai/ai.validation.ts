import { z } from 'zod';

const contentGenerationValidationSchema = z.object({
  type: z.enum(['blog', 'description', 'title', 'item-description', 'item-title']).optional(),
  topic: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  tone: z.enum(['professional', 'casual', 'creative', 'formal']).optional(),
  context: z.string().optional(),
  category: z.string().optional(),
  price: z.number().optional(),
});

const recommendationValidationSchema = z.object({
  userId: z.string().optional(),
  context: z.enum(['browse', 'search', 'profile', 'similar', 'dashboard']).optional(),
  searchQuery: z.string().optional(),
  category: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
});

const chatValidationSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
  context: z.string().optional(),
  conversationId: z.string().optional(),
});

const analyticsValidationSchema = z.object({
  type: z.enum(['user-activity', 'item-performance', 'market-trends']),
  timeRange: z.enum(['day', 'week', 'month', 'year']).optional(),
  filters: z.any().optional(),
});

const generateBlogValidationSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters'),
  keywords: z.array(z.string()).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  tone: z.enum(['professional', 'casual', 'creative', 'formal']).optional(),
  title: z.string().optional(),
  thumbnail: z.string().url('Invalid thumbnail URL').optional(),
});

export const aiValidations = {
  contentGenerationValidationSchema,
  recommendationValidationSchema,
  chatValidationSchema,
  analyticsValidationSchema,
  generateBlogValidationSchema,
};