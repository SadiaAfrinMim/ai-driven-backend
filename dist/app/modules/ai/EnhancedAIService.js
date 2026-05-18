"use strict";
/**
 * Enhanced AI Service
 * Integrates with real AI providers, caching, and monitoring
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enhancedAIService = exports.EnhancedAIService = void 0;
const database_1 = __importDefault(require("../../../config/database"));
const AIProviderFactory_1 = require("./AIProviderFactory");
const CacheService_1 = require("./CacheService");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
class EnhancedAIService {
    constructor() {
        this.provider = 'openai';
    }
    async generateProductDescription(request) {
        try {
            // Generate cache key
            const cacheKey = CacheService_1.cacheService.generateCacheKey('product-desc', {
                topic: request.topic,
                category: request.category,
                tone: request.tone,
            });
            // Check cache
            const cached = await CacheService_1.cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }
            // Build prompt for product description
            const prompt = this.buildProductDescriptionPrompt(request);
            // Get AI provider
            const aiProvider = AIProviderFactory_1.AIProviderFactory.getProvider(this.provider);
            // Generate content
            const aiResponse = await aiProvider.generateContent({
                prompt,
                type: 'product-description',
                tone: request.tone || 'professional',
                length: request.length || 'medium',
                maxTokens: 500,
            });
            // Prepare response
            const response = {
                content: aiResponse.content,
                metadata: {
                    type: request.type || 'item-description',
                    wordCount: aiResponse.content.split(/\s+/).length,
                    generatedAt: new Date(),
                    model: aiResponse.model,
                },
            };
            // Cache the result (1 hour)
            const cacheOptions = {
                ttl: 3600,
                tags: ['product-descriptions', request.category || 'general'],
            };
            await CacheService_1.cacheService.set(cacheKey, response, cacheOptions);
            return response;
        }
        catch (error) {
            console.error('Product description generation error:', error);
            throw error;
        }
    }
    async generateProductTitle(request) {
        try {
            // Generate cache key
            const cacheKey = CacheService_1.cacheService.generateCacheKey('product-title', {
                topic: request.topic,
                category: request.category,
            });
            // Check cache
            const cached = await CacheService_1.cacheService.get(cacheKey);
            if (cached) {
                return cached;
            }
            // Build prompt
            const prompt = this.buildProductTitlePrompt(request);
            // Get AI provider
            const aiProvider = AIProviderFactory_1.AIProviderFactory.getProvider(this.provider);
            // Generate content
            const aiResponse = await aiProvider.generateContent({
                prompt,
                type: 'product-title',
                tone: 'professional',
                maxTokens: 100,
            });
            // Clean and extract title
            const title = aiResponse.content.split('\n')[0].trim().substring(0, 100);
            // Cache result
            await CacheService_1.cacheService.set(cacheKey, title, { ttl: 3600, tags: ['product-titles', request.category || 'general'] });
            return title;
        }
        catch (error) {
            console.error('Product title generation error:', error);
            throw error;
        }
    }
    async generateItemContent(request) {
        try {
            const result = {};
            if (request.type === 'item-title' || !request.type) {
                result.title = await this.generateProductTitle(request);
            }
            if (request.type === 'item-description' || !request.type) {
                const descriptionResponse = await this.generateProductDescription(request);
                result.description = descriptionResponse.content;
            }
            // Generate tags from keywords and category
            if (request.keywords && request.keywords.length > 0) {
                result.tags = [...request.keywords];
                if (request.category) {
                    result.tags.unshift(request.category);
                }
            }
            else if (request.category) {
                result.tags = [request.category];
            }
            return result;
        }
        catch (error) {
            console.error('Item content generation error:', error);
            throw error;
        }
    }
    async getSmartRecommendations(request) {
        try {
            const { userId, context, searchQuery, category, limit = 10 } = request;
            // Get user's interaction history
            const userHistory = await database_1.default.review.findMany({
                where: { userId },
                include: {
                    item: {
                        select: {
                            id: true,
                            category: true,
                            tags: true,
                        },
                    },
                },
                take: 20,
            });
            // Analyze user preferences
            const preferredCategories = [...new Set(userHistory.map(h => h.item.category))];
            const preferredTags = [...new Set(userHistory.flatMap(h => h.item.tags))];
            // Build recommendation query
            const whereClause = {
                ownerId: { not: userId },
            };
            if (category) {
                whereClause.category = category;
            }
            else if (preferredCategories.length > 0 && context === 'profile') {
                whereClause.category = { in: preferredCategories };
            }
            if (searchQuery) {
                whereClause.OR = [
                    { title: { contains: searchQuery, mode: 'insensitive' } },
                    { description: { contains: searchQuery, mode: 'insensitive' } },
                    { category: { contains: searchQuery, mode: 'insensitive' } },
                ];
            }
            // Get recommended items
            const items = await database_1.default.item.findMany({
                where: whereClause,
                include: {
                    owner: { select: { name: true } },
                    reviews: { select: { rating: true } },
                },
                take: limit,
                orderBy: { createdAt: 'desc' },
            });
            // Calculate recommendation scores
            const recommendations = items.map(item => {
                let score = 0;
                let reasons = [];
                // Category match
                if (preferredCategories.includes(item.category)) {
                    score += 30;
                    reasons.push('Matches your preferred categories');
                }
                // Tag match
                const tagMatches = item.tags.filter(tag => preferredTags.includes(tag)).length;
                if (tagMatches > 0) {
                    score += tagMatches * 10;
                    reasons.push(`Shares ${tagMatches} interest tags`);
                }
                // Rating boost
                const avgRating = item.reviews.length > 0
                    ? item.reviews.reduce((sum, r) => sum + r.rating, 0) / item.reviews.length
                    : 0;
                if (avgRating >= 4) {
                    score += 20;
                    reasons.push('Highly rated item');
                }
                return {
                    itemId: item.id,
                    title: item.title,
                    reason: reasons.length > 0 ? reasons[0] : 'Recommended for you',
                    score: Math.min(score, 100),
                };
            });
            return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
        }
        catch (error) {
            console.error('Recommendation generation error:', error);
            throw new ApiError_1.default(500, 'Failed to generate recommendations');
        }
    }
    async processChat(request) {
        try {
            const aiProvider = AIProviderFactory_1.AIProviderFactory.getProvider(this.provider);
            const aiResponse = await aiProvider.generateContent({
                prompt: request.message,
                type: 'chat',
                maxTokens: 500,
            });
            return aiResponse.content;
        }
        catch (error) {
            console.error('Chat processing error:', error);
            throw new ApiError_1.default(500, 'Failed to process chat');
        }
    }
    buildProductDescriptionPrompt(request) {
        let prompt = '';
        if (request.topic) {
            prompt = `Write a compelling product description for: ${request.topic}`;
        }
        if (request.category) {
            prompt += `\nCategory: ${request.category}`;
        }
        if (request.price) {
            prompt += `\nPrice: $${request.price}`;
        }
        if (request.keywords && request.keywords.length > 0) {
            prompt += `\nKey features to mention: ${request.keywords.join(', ')}`;
        }
        prompt += '\nMake it persuasive, highlighting unique features and benefits for potential customers.';
        return prompt;
    }
    buildProductTitlePrompt(request) {
        let prompt = `Generate a catchy, SEO-friendly product title for: ${request.topic || 'a product'}`;
        if (request.category) {
            prompt += `\nCategory: ${request.category}`;
        }
        if (request.keywords && request.keywords.length > 0) {
            prompt += `\nKeywords to include: ${request.keywords.join(', ')}`;
        }
        prompt += '\nTitle should be 5-10 words, clear, and appealing to customers.';
        return prompt;
    }
    setProvider(providerType) {
        AIProviderFactory_1.AIProviderFactory.setDefaultProvider(providerType);
        this.provider = providerType;
    }
}
exports.EnhancedAIService = EnhancedAIService;
// Export service instance
exports.enhancedAIService = new EnhancedAIService();
