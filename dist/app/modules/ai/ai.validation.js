"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiValidations = void 0;
const zod_1 = require("zod");
const contentGenerationValidationSchema = zod_1.z.object({
    type: zod_1.z.enum(['blog', 'description', 'title', 'item-description', 'item-title']).optional(),
    topic: zod_1.z.string().optional(),
    keywords: zod_1.z.array(zod_1.z.string()).optional(),
    length: zod_1.z.enum(['short', 'medium', 'long']).optional(),
    tone: zod_1.z.enum(['professional', 'casual', 'creative', 'formal']).optional(),
    context: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    price: zod_1.z.number().optional(),
});
const recommendationValidationSchema = zod_1.z.object({
    userId: zod_1.z.string().optional(),
    context: zod_1.z.enum(['browse', 'search', 'profile', 'similar', 'dashboard']).optional(),
    searchQuery: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    limit: zod_1.z.string().optional().transform(val => val ? parseInt(val) : 10),
});
const chatValidationSchema = zod_1.z.object({
    message: zod_1.z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
    context: zod_1.z.string().optional(),
    conversationId: zod_1.z.string().optional(),
});
const analyticsValidationSchema = zod_1.z.object({
    type: zod_1.z.enum(['user-activity', 'item-performance', 'market-trends']),
    timeRange: zod_1.z.enum(['day', 'week', 'month', 'year']).optional(),
    filters: zod_1.z.any().optional(),
});
const generateBlogValidationSchema = zod_1.z.object({
    topic: zod_1.z.string().min(3, 'Topic must be at least 3 characters'),
    keywords: zod_1.z.array(zod_1.z.string()).optional(),
    length: zod_1.z.enum(['short', 'medium', 'long']).optional(),
    tone: zod_1.z.enum(['professional', 'casual', 'creative', 'formal']).optional(),
    title: zod_1.z.string().optional(),
    thumbnail: zod_1.z.string().url('Invalid thumbnail URL').optional(),
});
exports.aiValidations = {
    contentGenerationValidationSchema,
    recommendationValidationSchema,
    chatValidationSchema,
    analyticsValidationSchema,
    generateBlogValidationSchema,
};
