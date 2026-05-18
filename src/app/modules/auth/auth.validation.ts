import { z } from 'zod';

const loginUserValidationSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerUserValidationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['USER', 'ADMIN', 'MANAGER'], 'Role must be USER, ADMIN, or MANAGER').optional(),
  bio: z.string().optional(),
  profileImage: z.string().url('Invalid URL format').optional(),
});

export const authValidations = {
  loginUserValidationSchema,
  registerUserValidationSchema,
};