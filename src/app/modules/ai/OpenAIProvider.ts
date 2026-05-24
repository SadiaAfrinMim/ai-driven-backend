/**
 * OpenAI GPT Provider Implementation
 * Real AI integration with OpenAI's API
 */

import OpenAI from 'openai';
import { AIProvider, GenerateContentRequest, GenerateContentResponse, StreamChunk } from './AIProvider';
import ApiError from '../../../errors/ApiError';
import { config } from '../../../config/config';

export class OpenAIProvider extends AIProvider {
  readonly name: string;
  readonly model: string;
  private client: OpenAI;
  private requestCount = 0;
  private tokenCount = 0;

  constructor() {
    super();
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const apiKey = config.openai.apiKey;
    const isOpenRouter = apiKey.startsWith('sk-or-');

    this.client = new OpenAI({
      apiKey,
      baseURL: isOpenRouter ? 'https://openrouter.ai/api/v1' : undefined,
    });

    if (isOpenRouter) {
      this.name = 'OpenRouter';
      this.model = 'openai/gpt-4o-mini'; // matches user's AI_REVIEW_MODEL preference
    } else {
      this.name = 'OpenAI';
      this.model = 'gpt-4-turbo';
    }
  }

  validateRequest(request: GenerateContentRequest): boolean {
    if (!request.prompt || request.prompt.trim().length === 0) {
      return false;
    }
    if (request.maxTokens && (request.maxTokens < 100 || request.maxTokens > 4000)) {
      return false;
    }
    return true;
  }

  async generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse> {
    if (!this.validateRequest(request)) {
      throw new ApiError(400, 'Invalid request parameters');
    }

    try {
      const temperature = this.getTemperature(request.tone);
      const maxTokens = this.getMaxTokens(request.length, request.maxTokens || 2000);
      const prompt = this.buildSystemPrompt(request);

      // Use the effective model (OpenRouter or real OpenAI)
      const modelToUse = this.model;

      const response = await this.client.chat.completions.create({
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: this.getSystemContext(request.type),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
      });

      const content = response.choices[0].message.content || '';
      const promptTokens = response.usage?.prompt_tokens || 0;
      const completionTokens = response.usage?.completion_tokens || 0;

      this.requestCount++;
      this.tokenCount += promptTokens + completionTokens;

      return {
        content,
        tokens: {
          prompt: promptTokens,
          completion: completionTokens,
          total: promptTokens + completionTokens,
        },
        model: this.model,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      if (error instanceof OpenAI.RateLimitError) {
        throw new ApiError(429, 'Rate limit exceeded. Please try again later.');
      }
      if (error instanceof OpenAI.AuthenticationError) {
        throw new ApiError(401, 'Authentication failed with OpenAI API');
      }
      throw new ApiError(500, 'Failed to generate content with AI provider');
    }
  }

  async *generateContentStream(request: GenerateContentRequest): AsyncIterable<StreamChunk> {
    if (!this.validateRequest(request)) {
      throw new ApiError(400, 'Invalid request parameters');
    }

    try {
      const temperature = this.getTemperature(request.tone);
      const maxTokens = this.getMaxTokens(request.length, request.maxTokens || 2000);
      const prompt = this.buildSystemPrompt(request);

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemContext(request.type),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature,
        max_tokens: maxTokens,
        stream: true,
      });

      for await (const event of stream) {
        const delta = event.choices[0]?.delta?.content || '';
        if (delta) {
          yield {
            content: delta,
            timestamp: new Date(),
          };
        }
      }
    } catch (error) {
      console.error('OpenAI Stream Error:', error);
      throw new ApiError(500, 'Failed to stream content from AI provider');
    }
  }

  private getSystemContext(type: string): string {
    const contexts: Record<string, string> = {
      'product-description': `You are an expert product copywriter. Your task is to write compelling, 
        persuasive product descriptions that highlight features and benefits. Keep descriptions 
        concise yet informative. Focus on what makes the product unique and valuable to customers.`,
      'product-title': `You are a product naming expert. Generate catchy, descriptive product titles that 
        are SEO-friendly and appeal to potential customers. Titles should be concise (5-10 words max) 
        and clearly convey the product's main benefit.`,
      'blog': `You are a professional blog writer. Write engaging, informative blog posts that are 
        well-structured with clear sections, bullet points where appropriate, and valuable insights. 
        Ensure content is original, accurate, and follows best practices for readability.`,
      'chat': `You are a helpful customer service AI assistant. Provide clear, concise, and helpful 
        responses to user queries. Be empathetic, professional, and try to solve problems or answer 
        questions comprehensively.`,
    };
    return contexts[type] || 'You are a helpful assistant.';
  }

  private buildSystemPrompt(request: GenerateContentRequest): string {
    const basePrompt = request.prompt;
    const toneInstruction = request.tone ? ` Use a ${request.tone} tone.` : '';
    const lengthInstruction = request.length ? ` Keep it ${request.length}.` : '';

    return `${basePrompt}${toneInstruction}${lengthInstruction}`;
  }

  getStats() {
    return {
      provider: this.name,
      model: this.model,
      totalRequests: this.requestCount,
      totalTokens: this.tokenCount,
    };
  }
}
