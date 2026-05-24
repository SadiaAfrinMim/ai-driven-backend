"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewValidations = void 0;
const zod_1 = require("zod");
const createReviewValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        comment: zod_1.z.string().min(10, 'Review comment must be at least 10 characters').max(1000, 'Review comment must be less than 1000 characters'),
        rating: zod_1.z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
        itemId: zod_1.z.string().min(1, 'Item ID is required'),
    }),
});
const updateReviewValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        comment: zod_1.z.string().min(10, 'Review comment must be at least 10 characters').max(1000, 'Review comment must be less than 1000 characters').optional(),
        rating: zod_1.z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5').optional(),
    }),
});
const reviewFiltersValidationSchema = zod_1.z.object({
    itemId: zod_1.z.string().optional(),
    userId: zod_1.z.string().optional(),
    rating: zod_1.z.string().transform(val => val ? parseInt(val) : undefined).optional(),
    minRating: zod_1.z.string().transform(val => val ? parseInt(val) : undefined).optional(),
    maxRating: zod_1.z.string().transform(val => val ? parseInt(val) : undefined).optional(),
});
const paginationValidationSchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().transform(val => val ? parseInt(val) : 1).optional(),
        limit: zod_1.z.string().transform(val => val ? parseInt(val) : 10).optional(),
        sortBy: zod_1.z.string().optional(),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
});
exports.reviewValidations = {
    createReviewValidationSchema,
    updateReviewValidationSchema,
    reviewFiltersValidationSchema,
    paginationValidationSchema,
};
