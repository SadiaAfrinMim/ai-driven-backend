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
        // Generate cache key
        const cacheKey = CacheService_1.cacheService.generateCacheKey('product-desc', {
            topic: request.topic,
            category: request.category,
            tone: request.tone,
        });
        try {
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
            // Fallback: generate a contextual description based on topic/category/price
            const generateFallbackDescription = (topic, category, price) => {
                const name = topic ? topic.trim() : 'This product';
                const cat = category ? category.trim() : undefined;
                const priceStr = price && !isNaN(price) ? `Priced at ${price.toLocaleString()}${typeof price === 'number' ? '' : ''}` : '';
                const opening = cat
                    ? `${name} is a premium ${cat} designed for everyday use and exceptional performance.`
                    : `${name} is built to deliver reliable performance and excellent value.`;
                const features = [`Reliable build quality`, `User-friendly design`, `Great value`];
                if (price && !isNaN(price))
                    features.push('Competitive pricing');
                const body = `${opening} ${priceStr ? priceStr + '.' : ''} Key features include: ${features.join(', ')}.`;
                const cta = `Perfect choice for buyers seeking a dependable ${cat || 'product'} that balances quality and affordability.`;
                return `${body} ${cta}`;
            };
            const fallbackContent = generateFallbackDescription(request.topic, request.category, request.price);
            const fallbackResponse = {
                content: fallbackContent,
                metadata: {
                    type: request.type || 'item-description',
                    wordCount: fallbackContent.split(/\s+/).length,
                    generatedAt: new Date(),
                    model: 'fallback',
                },
            };
            // Cache fallback briefly
            try {
                await CacheService_1.cacheService.set(cacheKey, fallbackResponse, { ttl: 60, tags: ['product-descriptions', 'fallback'] });
            }
            catch { }
            return fallbackResponse;
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
            // Fallback title
            const fallbackTitle = (request.topic ? `${request.topic} - Premium` : 'New Product') + ' — Quality Assured';
            try {
                // regenerate a key for caching fallback title
                const fallbackKey = CacheService_1.cacheService.generateCacheKey('product-title', { topic: request.topic, category: request.category });
                await CacheService_1.cacheService.set(fallbackKey, fallbackTitle, { ttl: 60, tags: ['product-titles', 'fallback'] });
            }
            catch { }
            return fallbackTitle;
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
            // Always generate good tags when type is tags or when category/keywords exist
            const generateSmartTags = () => {
                const base = [];
                if (request.category)
                    base.push(request.category);
                if (request.keywords && request.keywords.length > 0)
                    base.push(...request.keywords);
                if (request.topic)
                    base.push(request.topic);
                if (base.length === 0)
                    return ['#Premium', '#Quality', '#BestChoice'];
                const cleaned = Array.from(new Set(base.map(t => t.trim()).filter(Boolean))).slice(0, 5);
                return cleaned.map(t => '#' + t.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(''));
            };
            result.tags = generateSmartTags();
            // Ensure tags are meaningful words (normalize)
            if (result.tags && Array.isArray(result.tags)) {
                // Remove duplicates and ensure category is not repeated in tags
                const normalized = result.tags.map((t) => t.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()).filter(Boolean);
                const withoutCategory = normalized.filter((t) => !(request.category && t === request.category.toLowerCase()));
                const unique = Array.from(new Set(withoutCategory)).slice(0, 5);
                // Format tags to user-friendly hashtag style: #TagName (TitleCase, no spaces)
                const formatTag = (t) => {
                    return '#' + t.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
                };
                result.tags = unique.map((t) => formatTag(t));
            }
            return result;
        }
        catch (error) {
            console.error('Item content generation error:', error);
            // Fallback: build simple tags from category and keywords
            const fallbackTags = [];
            if (request.category)
                fallbackTags.push(request.category);
            if (request.keywords && request.keywords.length > 0)
                fallbackTags.push(...request.keywords.slice(0, 5));
            const fallbackResult = {
                title: request.topic ? `${request.topic} — Reliable Choice` : undefined,
                description: request.topic ? `A dependable ${request.topic} that meets your needs in ${request.category || 'the relevant category'}.` : undefined,
                tags: fallbackTags,
            };
            return fallbackResult;
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
            // If user has no history, provide fallback recommendations (top-rated and recent)
            let items = [];
            if (preferredCategories.length === 0 && preferredTags.length === 0) {
                // Fetch broader pool to score by rating and recency
                items = await database_1.default.item.findMany({
                    where: whereClause,
                    include: {
                        owner: { select: { name: true } },
                        reviews: { select: { rating: true } },
                    },
                    take: Math.max(limit, 50),
                    orderBy: { createdAt: 'desc' },
                });
            }
            else {
                items = await database_1.default.item.findMany({
                    where: whereClause,
                    include: {
                        owner: { select: { name: true } },
                        reviews: { select: { rating: true } },
                    },
                    take: Math.max(limit, 50),
                    orderBy: { createdAt: 'desc' },
                });
            }
            // Calculate recommendation scores
            const now = Date.now();
            const recommendations = items.map(item => {
                let score = 0;
                let reasons = [];
                const matchedTags = item.tags.filter((tag) => preferredTags.includes(tag));
                const matchedCategory = preferredCategories.includes(item.category);
                // Category match
                if (matchedCategory) {
                    score += 30;
                    reasons.push('Matches your preferred categories');
                }
                // Tag match
                const tagMatches = matchedTags.length;
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
                // Recency boost (newer items slightly preferred)
                const createdAt = new Date(item.createdAt).getTime();
                const ageDays = (now - createdAt) / (1000 * 60 * 60 * 24);
                const recencyScore = Math.max(0, 20 - Math.min(20, ageDays)); // recent within 20 days gets up to 20 points
                score += Math.round(recencyScore);
                // If user has no history, prioritize rating and recency
                if (preferredCategories.length === 0 && preferredTags.length === 0) {
                    // scale by avgRating
                    score = Math.min(100, Math.round(avgRating * 20) + Math.round(recencyScore));
                    if (avgRating > 0)
                        reasons = [`Top rated: ${avgRating.toFixed(1)} avg`];
                }
                return {
                    itemId: item.id,
                    title: item.title,
                    reason: reasons.length > 0 ? reasons[0] : 'Recommended for you',
                    score: Math.min(score, 100),
                    matchedTags,
                    matchedCategory,
                    avgRating,
                };
            });
            // Sort and return top results
            const sorted = recommendations.sort((a, b) => b.score - a.score);
            const top = sorted.slice(0, limit);
            // If recommendations are low-confidence or empty, use AI to suggest keywords/categories and fetch matching items
            const needAIFallback = top.length === 0 || top.every(r => r.score < 30);
            if (needAIFallback) {
                try {
                    const aiProvider = AIProviderFactory_1.AIProviderFactory.getProvider(this.provider);
                    const prompt = `Based on user preferences categories: ${preferredCategories.join(', ') || 'none'}; tags: ${preferredTags.join(', ') || 'none'}. Provide up to ${limit} short product keywords or categories the user is likely to buy, comma-separated.`;
                    const aiResponse = await aiProvider.generateContent({ prompt, type: 'product-description', maxTokens: 200 });
                    const suggestions = (aiResponse.content || '').split(/[,\n;]+/).map(s => s.trim()).filter(Boolean).slice(0, limit * 2);
                    if (suggestions.length > 0) {
                        // Build OR conditions from suggestions
                        const orConditions = [];
                        for (const s of suggestions) {
                            orConditions.push({ title: { contains: s, mode: 'insensitive' } });
                            orConditions.push({ category: { contains: s, mode: 'insensitive' } });
                        }
                        const aiItems = await database_1.default.item.findMany({
                            where: {
                                OR: orConditions,
                                ownerId: { not: userId },
                            },
                            include: { reviews: { select: { rating: true } } },
                            take: Math.max(limit, 50),
                            orderBy: { createdAt: 'desc' },
                        });
                        if (aiItems && aiItems.length > 0) {
                            const now2 = Date.now();
                            const aiRecommendations = aiItems.map(item => {
                                const avgRating = item.reviews.length > 0 ? item.reviews.reduce((sum, r) => sum + r.rating, 0) / item.reviews.length : 0;
                                const createdAt = new Date(item.createdAt).getTime();
                                const ageDays = (now2 - createdAt) / (1000 * 60 * 60 * 24);
                                const recencyScore = Math.max(0, 20 - Math.min(20, ageDays));
                                let score = Math.round(avgRating * 20) + Math.round(recencyScore);
                                return {
                                    itemId: item.id,
                                    title: item.title,
                                    reason: avgRating > 0 ? `Top rated: ${avgRating.toFixed(1)}` : 'Recommended by AI',
                                    score: Math.min(100, score),
                                    matchedTags: [],
                                    matchedCategory: false,
                                    avgRating,
                                };
                            });
                            return aiRecommendations.sort((a, b) => b.score - a.score).slice(0, limit);
                        }
                    }
                }
                catch (err) {
                    console.error('AI recommendation fallback error:', err);
                }
            }
            return top;
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
            // Fallback response when AI fails
            return `Thank you for your message! I'm currently unable to connect to the AI service. 
      
Here's a general response: "${request.message}"

For now, you can browse our products, check reviews, or contact support for assistance. We'll have the AI chat back online soon!`;
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
