import { z } from 'zod';

export const createSelectionValidationSchema = z.object({
  body: z.object({
    itemId: z.string().min(1, 'Item ID is required'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  }),
});

export const updateSelectionStatusValidationSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
