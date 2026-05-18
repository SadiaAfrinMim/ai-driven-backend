"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemValidations = void 0;
const zod_1 = require("zod");
const createItemValidationSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters'),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
    price: zod_1.z.number().positive('Price must be positive'),
    location: zod_1.z.string().min(2, 'Location must be at least 2 characters').max(100, 'Location must be less than 100 characters'),
    category: zod_1.z.string().min(2, 'Category must be at least 2 characters').max(50, 'Category must be less than 50 characters'),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    images: zod_1.z.array(zod_1.z.string().url('Invalid image URL')).min(1, 'At least one image is required'),
    isAIContent: zod_1.z.boolean().optional(),
});
const updateItemValidationSchema = zod_1.z.object({
    title: zod_1.z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title must be less than 100 characters').optional(),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters').optional(),
    price: zod_1.z.number().positive('Price must be positive').optional(),
    location: zod_1.z.string().min(2, 'Location must be at least 2 characters').max(100, 'Location must be less than 100 characters').optional(),
    category: zod_1.z.string().min(2, 'Category must be at least 2 characters').max(50, 'Category must be less than 50 characters').optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    images: zod_1.z.array(zod_1.z.string().url('Invalid image URL')).optional(),
    isAIContent: zod_1.z.boolean().optional(),
});
const itemFiltersValidationSchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    minPrice: zod_1.z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
    maxPrice: zod_1.z.string().transform(val => val ? parseFloat(val) : undefined).optional(),
    location: zod_1.z.string().optional(),
    isAIContent: zod_1.z.string().transform(val => val ? val === 'true' : undefined).optional(),
    tags: zod_1.z.string().transform(val => val ? val.split(',') : undefined).optional(),
});
const paginationValidationSchema = zod_1.z.object({
    page: zod_1.z.string().transform(val => val ? parseInt(val) : 1).optional(),
    limit: zod_1.z.string().transform(val => val ? parseInt(val) : 10).optional(),
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).optional(),
});
exports.itemValidations = {
    createItemValidationSchema,
    updateItemValidationSchema,
    itemFiltersValidationSchema,
    paginationValidationSchema,
};
