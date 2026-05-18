import { z } from 'zod';

const updateProfileValidationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  profileImage: z.string().url('Invalid URL format').optional(),
});

export const userValidations = {
  updateProfileValidationSchema,
};