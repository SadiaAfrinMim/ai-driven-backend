/**
 * Enhanced AI Service
 * Integrates with real AI providers, caching, and monitoring
 */

import prisma from '../../../config/database';
import { AIProviderFactory, ProviderType } from './AIProviderFactory';
import { cacheService, CacheOptions } from './CacheService';
import { GenerateContentRequest } from './AIProvider';
import {
  IContentGenerationRequest,
  IContentGenerationResponse,
  IRecommendationRequest,
  IRecommendationResponse,
  IChatRequest,
  IChatResponse,
  IAnalyticsRequest,
  IAnalyticsResponse,
  IBlogGeneration,
} from './ai.interface';
import ApiError from '../../../errors/ApiError';

export class EnhancedAIService {
  private provider: ProviderType = 'openai';

  async generateProductDescription(request: IContentGenerationRequest): Promise<IContentGenerationResponse> {
    // Generate cache key
    const cacheKey = cacheService.generateCacheKey('product-desc', {
      topic: request.topic,
      category: request.category,
      tone: request.tone,
    });

    try {
      // Check cache
      const cached = await cacheService.get<IContentGenerationResponse>(cacheKey);
      if (cached) {
        return cached;
      }

      // Build prompt for product description
      const prompt = this.buildProductDescriptionPrompt(request);

      // Get AI provider
      const aiProvider = AIProviderFactory.getProvider(this.provider);

      // Generate content
      const aiResponse = await aiProvider.generateContent({
        prompt,
        type: 'product-description',
        tone: request.tone || 'professional',
        length: request.length || 'medium',
        maxTokens: 500,
      });

      // Prepare response
      const response: IContentGenerationResponse = {
        content: aiResponse.content,
        metadata: {
          type: request.type || 'item-description',
          wordCount: aiResponse.content.split(/\s+/).length,
          generatedAt: new Date(),
          model: aiResponse.model,
        },
      };

      // Cache the result (1 hour)
      const cacheOptions: CacheOptions = {
        ttl: 3600,
        tags: ['product-descriptions', request.category || 'general'],
      };
      await cacheService.set(cacheKey, response, cacheOptions);

      return response;
    } catch (error) {
      console.error('Product description generation error:', error);
      // Fallback: generate a contextual description based on topic/category/price
      const generateFallbackDescription = (topic?: string, category?: string, price?: number) => {
        const name = topic ? topic.trim() : 'This product';
        const cat = category ? category.trim() : undefined;
        const priceStr = price && !isNaN(price) ? `Priced at ${price.toLocaleString()}${typeof price === 'number' ? '' : ''}` : '';

        const opening = cat
          ? `${name} is a premium ${cat} designed for everyday use and exceptional performance.`
          : `${name} is built to deliver reliable performance and excellent value.`;

        const features = [`Reliable build quality`, `User-friendly design`, `Great value`];
        if (price && !isNaN(price)) features.push('Competitive pricing');

        const body = `${opening} ${priceStr ? priceStr + '.' : ''} Key features include: ${features.join(', ')}.`;

        const cta = `Perfect choice for buyers seeking a dependable ${cat || 'product'} that balances quality and affordability.`;

        return `${body} ${cta}`;
      };

      const fallbackContent = generateFallbackDescription(request.topic, request.category, request.price);
      const fallbackResponse: IContentGenerationResponse = {
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
        await cacheService.set(cacheKey, fallbackResponse, { ttl: 60, tags: ['product-descriptions','fallback'] });
      } catch {}
      return fallbackResponse;
    }
  }

  async generateProductTitle(request: IContentGenerationRequest): Promise<string> {
    try {
      // Generate cache key
      const cacheKey = cacheService.generateCacheKey('product-title', {
        topic: request.topic,
        category: request.category,
      });

      // Check cache
      const cached = await cacheService.get<string>(cacheKey);
      if (cached) {
        return cached;
      }

      // Build prompt
      const prompt = this.buildProductTitlePrompt(request);

      // Get AI provider
      const aiProvider = AIProviderFactory.getProvider(this.provider);

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
      await cacheService.set(
        cacheKey,
        title,
        { ttl: 3600, tags: ['product-titles', request.category || 'general'] }
      );

      return title;
    } catch (error) {
      console.error('Product title generation error:', error);
      // Fallback title
      const fallbackTitle = (request.topic ? `${request.topic} - Premium` : 'New Product') + ' — Quality Assured';
      try {
        // regenerate a key for caching fallback title
        const fallbackKey = cacheService.generateCacheKey('product-title', { topic: request.topic, category: request.category });
        await cacheService.set(fallbackKey, fallbackTitle, { ttl: 60, tags: ['product-titles','fallback'] });
      } catch {}
      return fallbackTitle;
    }
  }

  async generateProductTags(request: IContentGenerationRequest): Promise<string[]> {
    const cacheKey = cacheService.generateCacheKey('product-tags', {
      topic: request.topic,
      category: request.category,
      keywords: request.keywords?.join(','),
    });

    try {
      const cached = await cacheService.get<string[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const prompt = this.buildProductTagsPrompt(request);

      const aiProvider = AIProviderFactory.getProvider(this.provider);

      const aiResponse = await aiProvider.generateContent({
        prompt,
        type: 'product-tags',
        maxTokens: 80,
      });

      const raw = (aiResponse.content || '').trim();

      // Parse comma/newline separated tags, clean to max 5
      let tags: string[] = raw
        .split(/[\n,;]+/)
        .map((t: string) => t.trim().replace(/^#/, '').toLowerCase())
        .filter((t: string) => t.length > 0 && t.length <= 25)
        .slice(0, 5);

      // Normalize to #hashtag-style (no spaces, title-case words joined)
      tags = tags
        .map((t: string) => {
          const cleaned = t.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          if (!cleaned) return '';
          // Convert to TitleCase parts
          const parts = cleaned.split('-').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1));
          return '#' + parts.join('');
        })
        .filter((t: string) => t.length > 1);

      // Deduplicate
      tags = Array.from(new Set(tags.map(t => t.toLowerCase()))).map(t => t.charAt(0).toUpperCase() + t.slice(1)) as string[];

      // Ensure we always return exactly 5 tags — prefer smart context-aware ones
      if (tags.length < 5) {
        const smart = this.generateSmartTagsFallback(request);
        for (const s of smart) {
          if (tags.length >= 5) break;
          const lower = s.toLowerCase();
          if (!tags.some((x: string) => x.toLowerCase() === lower)) {
            tags.push(s);
          }
        }
      }

      // Last resort generic padding
      if (tags.length < 5) {
        const fallbacks = ['#Premium', '#Quality', '#BestChoice', '#Value', '#New'];
        for (const f of fallbacks) {
          if (tags.length >= 5) break;
          const lower = f.toLowerCase();
          if (!tags.some((x: string) => x.toLowerCase() === lower)) {
            tags.push(f);
          }
        }
      }

      tags = tags.slice(0, 5);

      await cacheService.set(
        cacheKey,
        tags,
        { ttl: 3600, tags: ['product-tags', request.category || 'general'] }
      );

      return tags;
    } catch (error) {
      console.error('Product tags generation error (AI), using heuristic fallback:', error);
      return this.generateSmartTagsFallback(request);
    }
  }

  private generateSmartTagsFallback(request: IContentGenerationRequest): string[] {
    const base: string[] = [];
    if (request.category) base.push(request.category);
    if (request.keywords && request.keywords.length > 0) base.push(...request.keywords);
    if (request.topic) base.push(request.topic);

    let tags: string[] = [];
    if (base.length > 0) {
      const cleaned = Array.from(new Set(base.map((t) => t.trim()).filter(Boolean)));
      tags = cleaned.map((t) =>
        '#' + t.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join('')
      );
    }

    // Always guarantee exactly 5 tags
    const fallbacks = ['#Premium', '#Quality', '#BestChoice', '#Value', '#Popular'];
    for (const f of fallbacks) {
      if (tags.length >= 5) break;
      const lower = f.toLowerCase();
      if (!tags.some((x: string) => x.toLowerCase() === lower)) {
        tags.push(f);
      }
    }

    return tags.slice(0, 5);
  }

  async generateItemContent(request: IContentGenerationRequest): Promise<{
    title?: string;
    description?: string;
    tags?: string[];
  }> {
    try {
      const result: any = {};
      const t: string = request.type || '';

      const wantsTitle = !t || t === 'item-title' || t === 'title' || t === 'all';
      const wantsDesc = !t || t === 'item-description' || t === 'description' || t === 'all';
      const wantsTags = !t || t === 'tags' || t === 'item-tags' || t === 'all';

      if (wantsTitle) {
        result.title = await this.generateProductTitle(request);
      }

      if (wantsDesc) {
        const descriptionResponse = await this.generateProductDescription(request);
        result.description = descriptionResponse.content;
      }

      if (wantsTags) {
        // Real AI-generated 5 tags using the configured model (.env)
        result.tags = await this.generateProductTags(request);
      }

      return result;
    } catch (error) {
      console.error('Item content generation error:', error);
      const fallbackTags = this.generateSmartTagsFallback(request);
      return {
        title: request.topic ? `${request.topic} — Reliable Choice` : undefined,
        description: request.topic ? `A dependable ${request.topic} that meets your needs in ${request.category || 'the relevant category'}.` : undefined,
        tags: fallbackTags,
      };
    }
  }

  async getSmartRecommendations(request: IRecommendationRequest): Promise<IRecommendationResponse['recommendations']> {
    try {
      const { userId, context, searchQuery, category, limit = 10 } = request;

      // Get user's interaction history
      const userHistory = await prisma.review.findMany({
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
      const whereClause: any = {
        ownerId: { not: userId },
      };

      if (category) {
        whereClause.category = category;
      } else if (preferredCategories.length > 0 && context === 'profile') {
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
      let items = [] as any[];

      if (preferredCategories.length === 0 && preferredTags.length === 0) {
        // Fetch broader pool to score by rating and recency
        items = await prisma.item.findMany({
          where: whereClause,
          include: {
            owner: { select: { name: true } },
            reviews: { select: { rating: true } },
          },
          take: Math.max(limit, 50),
          orderBy: { createdAt: 'desc' },
        });
      } else {
        items = await prisma.item.findMany({
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
        let reasons: string[] = [];

        const matchedTags = item.tags.filter((tag: string) => preferredTags.includes(tag));
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
          ? item.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / item.reviews.length
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
          if (avgRating > 0) reasons = [`Top rated: ${avgRating.toFixed(1)} avg`];
        }

        return {
          itemId: item.id,
          title: item.title,
          reason: reasons.length > 0 ? reasons[0] : 'Recommended for you',
          score: Math.min(score, 100),
          matchedTags,
          matchedCategory,
          avgRating,
          description: item.description,
          price: item.price,
          category: item.category,
          location: item.location,
          image: item.images?.[0] || null,
          reviewCount: item.reviews.length,
          tags: item.tags,
        };
      });

      // Sort and return top results
      const sorted = recommendations.sort((a, b) => b.score - a.score);
      const top = sorted.slice(0, limit);

      // If recommendations are low-confidence or empty, use AI to suggest keywords/categories and fetch matching items
      const needAIFallback = top.length === 0 || top.every(r => r.score < 30);
      if (needAIFallback) {
        try {
          const aiProvider = AIProviderFactory.getProvider(this.provider);
          const prompt = `Based on user preferences categories: ${preferredCategories.join(', ') || 'none'}; tags: ${preferredTags.join(', ') || 'none'}. Provide up to ${limit} short product keywords or categories the user is likely to buy, comma-separated.`;
          const aiResponse = await aiProvider.generateContent({ prompt, type: 'product-description', maxTokens: 200 });
          const suggestions = (aiResponse.content || '').split(/[,\n;]+/).map(s => s.trim()).filter(Boolean).slice(0, limit * 2);

          if (suggestions.length > 0) {
            // Build OR conditions from suggestions
            const orConditions: any[] = [];
            for (const s of suggestions) {
              orConditions.push({ title: { contains: s, mode: 'insensitive' } });
              orConditions.push({ category: { contains: s, mode: 'insensitive' } });
            }

            const aiItems = await prisma.item.findMany({
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
                const avgRating = item.reviews.length > 0 ? item.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / item.reviews.length : 0;
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
                  description: item.description,
                  price: item.price,
                  category: item.category,
                  location: item.location,
                  image: item.images?.[0] || null,
                  reviewCount: item.reviews.length,
                  tags: item.tags,
                };
              });

              return aiRecommendations.sort((a, b) => b.score - a.score).slice(0, limit);
            }
          }
        } catch (err) {
          console.error('AI recommendation fallback error:', err);
           throw err;
        }
      }

      return top;
    } catch (error) {
      console.error('Recommendation generation error:', error);
      return [];
    }
  }

  async processChat(request: IChatRequest): Promise<string> {
    try {
      const aiProvider = AIProviderFactory.getProvider(this.provider);

      const aiResponse = await aiProvider.generateContent({
        prompt: request.message,
        type: 'chat',
        maxTokens: 500,
      });

      return aiResponse.content;
    } catch (error) {
      console.error('Chat processing error:', error);
      
      // Fallback response when AI fails
      return `Thank you for your message! I'm currently unable to connect to the AI service. 
      
Here's a general response: "${request.message}"

For now, you can browse our products, check reviews, or contact support for assistance. We'll have the AI chat back online soon!`;
    }
  }

  private buildProductDescriptionPrompt(request: IContentGenerationRequest): string {
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

  private buildProductTitlePrompt(request: IContentGenerationRequest): string {
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

  private buildProductTagsPrompt(request: IContentGenerationRequest): string {
    let prompt = 'Generate exactly 5 highly relevant, SEO-friendly product tags for the following product.';

    if (request.topic) {
      prompt += `\nProduct/Topic: ${request.topic}`;
    }
    if (request.category) {
      prompt += `\nCategory: ${request.category}`;
    }
    if (request.price) {
      prompt += `\nPrice: ${request.price}`;
    }
    if (request.keywords && request.keywords.length > 0) {
      prompt += `\nKey features/keywords: ${request.keywords.join(', ')}`;
    }

    prompt += `
Rules:
- Exactly 5 tags.
- Each tag: 1-3 words, short, catchy.
- Use hyphen (-) instead of spaces (e.g. wireless-earbuds).
- Lowercase letters only in the output tags.
- Output ONLY the 5 tags separated by commas. No other text, no numbers, no bullets, no explanations.`;

    return prompt;
  }

  setProvider(providerType: ProviderType): void {
    AIProviderFactory.setDefaultProvider(providerType);
    this.provider = providerType;
  }
}

// Export service instance
export const enhancedAIService = new EnhancedAIService();
