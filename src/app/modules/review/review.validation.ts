import { z } from 'zod';

const createReviewValidationSchema = z.object({
  body: z.object({
    comment: z.string().min(10, 'Review comment must be at least 10 characters').max(1000, 'Review comment must be less than 1000 characters'),
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
    itemId: z.string().min(1, 'Item ID is required'),
  }),
});

const updateReviewValidationSchema = z.object({
  body: z.object({
    comment: z.string().min(10, 'Review comment must be at least 10 characters').max(1000, 'Review comment must be less than 1000 characters').optional(),
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5').optional(),
  }),
});

const reviewFiltersValidationSchema = z.object({
  itemId: z.string().optional(),
  userId: z.string().optional(),
  rating: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
  minRating: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
  maxRating: z.string().transform(val => val ? parseInt(val) : undefined).optional(),
});

const paginationValidationSchema = z.object({
  query: z.object({
    page: z.string().transform(val => val ? parseInt(val) : 1).optional(),
    limit: z.string().transform(val => val ? parseInt(val) : 10).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const reviewValidations = {
  createReviewValidationSchema,
  updateReviewValidationSchema,
  reviewFiltersValidationSchema,
  paginationValidationSchema,
};