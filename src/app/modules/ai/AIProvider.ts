/**
 * Abstract AI Provider Interface
 * Defines the contract for all AI providers (Strategy Pattern)
 */

export interface GenerateContentRequest {
  prompt: string;
  type: 'product-description' | 'product-title' | 'blog' | 'chat' | 'review' | 'tags';
  tone?: 'professional' | 'casual' | 'creative' | 'formal';
  length?: 'short' | 'medium' | 'long';
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateContentResponse {
  content: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
  timestamp: Date;
}

export interface StreamChunk {
  content: string;
  timestamp: Date;
}

export abstract class AIProvider {
  abstract readonly name: string;
  abstract readonly model: string;

  abstract generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse>;

  abstract generateContentStream(
    request: GenerateContentRequest
  ): AsyncIterable<StreamChunk>;

  abstract validateRequest(request: GenerateContentRequest): boolean;

  protected buildPrompt(request: GenerateContentRequest): string {
    return request.prompt;
  }

  protected getTemperature(tone?: string): number {
    const temperatureMap: Record<string, number> = {
      professional: 0.3,
      casual: 0.7,
      creative: 0.9,
      formal: 0.2,
    };
    return temperatureMap[tone || 'professional'] ?? 0.5;
  }

  protected getMaxTokens(length?: string, defaultMax: number = 2000): number {
    const tokensMap: Record<string, number> = {
      short: 500,
      medium: 1500,
      long: defaultMax,
    };
    return tokensMap[length || 'medium'] ?? defaultMax;
  }
}
