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
      keywords: request.keywords,
    });

    try {
      const cached = await cacheService.get<string[]>(cacheKey);
      if (cached && cached.length > 0) {
        return cached;
      }

      const prompt = this.buildProductTagsPrompt(request);

      const aiProvider = AIProviderFactory.getProvider(this.provider);

      const aiResponse = await aiProvider.generateContent({
        prompt,
        type: 'tags',
        tone: 'professional',
        maxTokens: 120,
      });

      // Parse tags from AI response
      let tags: string[] = [];
      const raw = aiResponse.content || '';

      // Split on commas, newlines, bullets, etc.
      const parts = raw
        .split(/[\n,•·\-\s]+/)
        .map((p) => p.trim())
        .filter(Boolean);

      const formatTag = (t: string) => {
        // Remove leading # if present, clean, then re-apply clean #TitleCaseNoSpaces
        let clean = t.replace(/^#/, '').replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
        if (!clean) return '';
        const words = clean.split(/\s+/).filter(Boolean).slice(0, 3); // max 3 words per tag
        return '#' + words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
      };

      for (const p of parts) {
        const ft = formatTag(p);
        if (ft && ft.length > 1 && !tags.includes(ft)) {
          tags.push(ft);
        }
        if (tags.length >= 5) break;
      }

      // If LLM gave fewer than 5, supplement with smart local ones
      if (tags.length < 5) {
        const extra = this.generateSmartLocalTags(request, 5 - tags.length);
        for (const e of extra) {
          if (!tags.includes(e)) tags.push(e);
          if (tags.length >= 5) break;
        }
      }

      // Final guarantee: always at least 3-5 good tags
      if (tags.length === 0) {
        tags = this.generateSmartLocalTags(request, 5);
      }

      // Cache for 1 hour
      await cacheService.set(cacheKey, tags.slice(0, 5), {
        ttl: 3600,
        tags: ['product-tags', request.category || 'general']
      });

      return tags.slice(0, 5);
    } catch (error) {
      console.error('Product tags generation error (using smart fallback):', error);
      const fallback = this.generateSmartLocalTags(request, 5);
      try {
        const fbKey = cacheService.generateCacheKey('product-tags', { topic: request.topic, category: request.category });
        await cacheService.set(fbKey, fallback, { ttl: 60, tags: ['product-tags', 'fallback'] });
      } catch {}
      return fallback;
    }
  }

  private generateSmartLocalTags(request: IContentGenerationRequest, count: number = 5): string[] {
    const base: string[] = [];
    if (request.category) base.push(request.category);
    if (request.topic) base.push(request.topic);
    if (request.keywords && request.keywords.length) base.push(...request.keywords);

    const cleaned = Array.from(new Set(base.map(t => t.trim().toLowerCase()).filter(Boolean)));

    const tags = new Set<string>();

    // Add direct ones
    cleaned.forEach(c => {
      const formatted = '#' + c.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
      tags.add(formatted);
    });

    // Smart expansions / adjectives (category-aware if possible)
    const cat = (request.category || '').toLowerCase();
    const expansions: string[] = [];
    if (cat.includes('electronics') || cat.includes('gadget')) expansions.push('Wireless', 'Smart', 'Portable', 'Durable', 'Premium');
    else if (cat.includes('fashion') || cat.includes('clothing')) expansions.push('Stylish', 'Trendy', 'Comfortable', 'Breathable', 'Classic');
    else if (cat.includes('home') || cat.includes('furniture')) expansions.push('Modern', 'Elegant', 'Compact', 'Handcrafted', 'Luxury');
    else if (cat.includes('beauty') || cat.includes('skincare')) expansions.push('Natural', 'Organic', 'Gentle', 'Hydrating', 'Glow');
    else expansions.push('Premium', 'Quality', 'Reliable', 'BestSeller', 'Value');

    expansions.slice(0, count).forEach(exp => tags.add('#' + exp));

    // Ensure exactly the requested count (or up to 5)
    const result = Array.from(tags).slice(0, Math.max(3, Math.min(5, count + 2)));
    // Pad with more if still short
    while (result.length < count) {
      const pad = ['#New', '#Hot', '#Essential', '#TopPick', '#MustHave'][result.length % 5];
      if (!result.includes(pad)) result.push(pad);
    }
    return result.slice(0, 5);
  }

  async generateItemContent(request: IContentGenerationRequest): Promise<{
    title?: string;
    description?: string;
    tags?: string[];
  }> {
    try {
      const result: any = {};

      if (request.type === 'item-title' || !request.type) {
        result.title = await this.generateProductTitle(request);
      }

      if (request.type === 'item-description' || !request.type) {
        const descriptionResponse = await this.generateProductDescription(request);
        result.description = descriptionResponse.content;
      }

      // === Real AI-powered tags (always aim for 5 high-quality tags) ===
      // Use LLM when specifically asked for tags, or when doing full content generation.
      // This replaces the old weak local-only generator.
      const shouldGenerateTags =
        request.type === 'tags' ||
        !request.type ||
        request.type === 'item-title' ||
        request.type === 'item-description';

      if (shouldGenerateTags) {
        try {
          const aiTags = await this.generateProductTags(request);
          if (aiTags && aiTags.length > 0) {
            result.tags = aiTags.slice(0, 5);
          }
        } catch {
          // Will be handled by fallback inside generateProductTags
        }
      }

      // Final safety: if still no tags (very rare), use strong local expander
      if (!result.tags || result.tags.length === 0) {
        result.tags = this.generateSmartLocalTags(request, 5);
      }

      return result;
    } catch (error) {
      console.error('Item content generation error:', error);
      // Fallback: build simple tags from category and keywords
      const fallbackTags = [] as string[];
      if (request.category) fallbackTags.push(request.category);
      if (request.keywords && request.keywords.length > 0) fallbackTags.push(...request.keywords.slice(0, 5));
      const fallbackResult: any = {
        title: request.topic ? `${request.topic} — Reliable Choice` : undefined,
        description: request.topic ? `A dependable ${request.topic} that meets your needs in ${request.category || 'the relevant category'}.` : undefined,
        tags: fallbackTags,
      };
      return fallbackResult;
    }
  }

  async generateReviewComment(productName: string, rating: number): Promise<string> {
    const cacheKey = cacheService.generateCacheKey('review-comment', {
      product: productName,
      rating,
    });

    try {
      const cached = await cacheService.get<string>(cacheKey);
      if (cached) return cached;

      const prompt = this.buildReviewCommentPrompt(productName, rating);

      const aiProvider = AIProviderFactory.getProvider(this.provider);

      const aiResponse = await aiProvider.generateContent({
        prompt,
        type: 'review',
        tone: rating >= 4 ? 'casual' : rating >= 3 ? 'casual' : 'formal',
        maxTokens: 180,
      });

      let comment = aiResponse.content.trim();

      // Light cleanup
      comment = comment.replace(/^["']|["']$/g, '').trim();
      if (comment.length < 20) throw new Error('AI returned too short review');

      await cacheService.set(cacheKey, comment, { ttl: 3600, tags: ['reviews', 'ai-generated'] });

      return comment;
    } catch (error) {
      console.error('AI review generation failed (no default comment):', error);
      // No default/fallback comments — only real AI generated content allowed
      throw new Error('AI review generation failed. Please try again or write manually.');
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
        status: 'APPROVED',
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
          image: item.images?.[0] || null,
          images: item.images || [],
          price: item.price,
          description: item.description,
          category: item.category,
          location: item.location,
          tags: item.tags || [],
          reviewCount: item.reviews?.length || 0,
        };
      });

      // Sort by score
      const sorted = recommendations.sort((a, b) => b.score - a.score);
      let top = sorted.slice(0, Math.max(limit * 2, 30)); // get a bigger pool for AI reranking

      // === Real AI-powered recommendation (main path when user has history) ===
      if (preferredCategories.length > 0 || preferredTags.length > 0) {
        try {
          const aiProvider = AIProviderFactory.getProvider(this.provider);

          // Prepare context for the LLM
          const historySummary = `User likes these categories: ${preferredCategories.join(', ')}. Interested in tags: ${preferredTags.slice(0, 8).join(', ')}.`;

          const candidateList = top.map((r, idx) => 
            `${idx + 1}. ${r.title} (Tags: ${(r.matchedTags || []).join(', ') || 'none'})`
          ).join('\n');

          const prompt = `You are an expert product recommendation AI for a marketplace.

User profile from past reviews:
${historySummary}

Here are ${top.length} candidate products:
${candidateList}

Task: Select the top ${limit} most suitable products for this user. For each selected product, give a short, natural, personalized reason (1 sentence max) explaining why it fits the user based on their history.

Return ONLY a JSON array with this exact structure (no extra text):
[
  {"itemId": "the-id-from-above", "reason": "short personalized reason"},
  ...
]

Choose only from the numbered list above. Be helpful and specific.`;

          const aiResponse = await aiProvider.generateContent({
            prompt,
            type: 'chat',
            maxTokens: 800,
            temperature: 0.7,
          });

          let parsed: any[] = [];
          try {
            // Try to extract JSON from the response
            const jsonMatch = aiResponse.content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              parsed = JSON.parse(jsonMatch[0]);
            }
          } catch (parseErr) {
            console.warn('Failed to parse AI recommendation JSON, falling back to scored list');
          }

          if (parsed.length > 0) {
            // Map back to full recommendation objects
            const aiRecs = parsed
              .map(p => {
                const original = top.find(r => r.itemId === p.itemId);
                if (!original) return null;
                return {
                  ...original,
                  reason: p.reason || original.reason,
                  score: Math.max(original.score || 60, 75),
                };
              })
              .filter((r): r is any => r !== null)
              .slice(0, limit);

            if (aiRecs.length > 0) {
              return aiRecs;
            }
          }
        } catch (aiErr) {
          console.error('AI-powered recommendation failed, using algorithmic fallback:', aiErr);
        }
      }

      // Fallback to original scored list (or pure AI keyword fallback if very low confidence)
      const finalTop = top.slice(0, limit);

      // Low confidence fallback using AI for keywords (kept from previous logic)
      const needAIFallback = finalTop.length === 0 || finalTop.every(r => r.score < 30);
      if (needAIFallback) {
        try {
          const aiProvider = AIProviderFactory.getProvider(this.provider);
          const prompt = `Based on user preferences categories: ${preferredCategories.join(', ') || 'none'}; tags: ${preferredTags.join(', ') || 'none'}. Provide up to ${limit} short product keywords or categories the user is likely to buy, comma-separated.`;
          const aiResponse = await aiProvider.generateContent({ prompt, type: 'product-description', maxTokens: 200 });
          const suggestions = (aiResponse.content || '').split(/[,\n;]+/).map(s => s.trim()).filter(Boolean).slice(0, limit * 2);

          if (suggestions.length > 0) {
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
                  image: item.images?.[0] || null,
                  images: item.images || [],
                  price: item.price,
                  description: item.description,
                  category: item.category,
                  location: item.location,
                  tags: item.tags || [],
                  reviewCount: item.reviews?.length || 0,
                };
              });

              return aiRecommendations.sort((a, b) => b.score - a.score).slice(0, limit);
            }
          }
        } catch (err) {
          console.error('AI recommendation fallback error:', err);
        }
      }

      return finalTop;
    } catch (error) {
      console.error('Recommendation generation error:', error);
      throw new ApiError(500, 'Failed to generate recommendations');
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
    let prompt = `You are an expert e-commerce copywriter. Generate exactly 5 unique, catchy, and relevant product tags for the following item.`;

    if (request.topic) {
      prompt += `\nProduct: ${request.topic}`;
    }
    if (request.category) {
      prompt += `\nCategory: ${request.category}`;
    }
    if (request.price) {
      prompt += `\nPrice: ${request.price}`;
    }
    if (request.keywords && request.keywords.length > 0) {
      prompt += `\nImportant keywords/features: ${request.keywords.join(', ')}`;
    }

    prompt += `

Rules for the 5 tags:
- Each tag must be 1 to 3 words max
- Use Title Case, no spaces inside a tag (use CamelCase for multi-word, e.g. #WirelessHeadphones)
- Always prefix with #
- Highly relevant to the product, category and features
- Diverse and useful for search & discovery (mix of category, benefit, style, audience)
- Avoid generic words like "Premium", "Quality", "Best" unless truly fitting
- Do NOT repeat any tag
- Output ONLY the 5 tags separated by commas. No explanations, no numbering, no extra text.

Example good output: #SmartWatch, #FitnessTracker, #HeartRate, #Waterproof, #LongBattery`;

    return prompt;
  }

  private buildReviewCommentPrompt(productName: string, rating: number): string {
    const name = productName || 'this product';
    const stars = '★'.repeat(Math.max(1, Math.min(5, rating)));

    let toneInstruction = '';
    if (rating === 5) {
      toneInstruction = 'Write an enthusiastic, genuine 5-star review. Mention specific positives like quality, value, or experience. Sound natural and happy.';
    } else if (rating === 4) {
      toneInstruction = 'Write a positive but realistic 4-star review. Highlight what you liked while noting one small area that could be better.';
    } else if (rating === 3) {
      toneInstruction = 'Write a balanced, honest 3-star review. Mention both good and average aspects without being overly negative.';
    } else if (rating === 2) {
      toneInstruction = 'Write a critical but fair 2-star review. Focus on specific disappointments while remaining respectful.';
    } else {
      toneInstruction = 'Write a honest 1-star review. Clearly explain the main problems encountered.';
    }

    return `You are a real customer who just bought and used "${name}".
Rating given: ${rating}/5 ${stars}

${toneInstruction}

Rules:
- 2-4 sentences max
- Natural, conversational language (no marketing speak)
- First person ("I", "my")
- Specific but believable details
- Do NOT start with "I bought" or "This product is"
- End with a short recommendation or verdict

Generate only the review text, nothing else.`;
  }

  setProvider(providerType: ProviderType): void {
    AIProviderFactory.setDefaultProvider(providerType);
    this.provider = providerType;
  }
}

// Export service instance
export const enhancedAIService = new EnhancedAIService();
