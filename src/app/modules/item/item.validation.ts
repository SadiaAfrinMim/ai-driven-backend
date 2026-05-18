import { z } from 'zod';

const createItemValidationSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
  price: z.number().positive('Price must be positive'),
  location: z.string().min(2, 'Location must be at least 2 characters').max(100, 'Location must be less than 100 characters'),
  category: z.string().min(2, 'Category must be at least 2 characters').max(50, 'Category must be less than 50 characters'),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image is required'),
  isAIContent: z.boolean().optional(),
});

const updateItemValidationSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters').optional(),
  price: z.number().positive('Price must be positive').optional(),
  location: z.string().min(2, 'Location must be at least 2 characters').max(100, 'Location must be less than 100 characters').optional(),
  category: z.string().min(2, 'Category must be at least 2 characters').max(50, 'Category must be less than 50 characters').optional(),
  tags: z.array(z.string()).optional(),
  images: z.array(z.string().url('Invalid image URL')).optional(),
  isAIContent: z.boolean().optional(),
});

const itemFiltersValidationSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  maxPrice: z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
  location: z.string().optional(),
  isAIContent: z.string().transform(val => val ? val === 'true' : undefined).optional(),
  tags: z.string().transform(val => val ? val.split(',') : undefined).optional(),
});

const paginationValidationSchema = z.object({
  page: z.string().transform(val => val ? parseInt(val) : 1).optional(),
  limit: z.string().transform(val => val ? parseInt(val) : 10).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const itemValidations = {
  createItemValidationSchema,
  updateItemValidationSchema,
  itemFiltersValidationSchema,
  paginationValidationSchema,
};