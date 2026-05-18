export interface IContentGenerationRequest {
  type: 'blog' | 'description' | 'title' | 'item-description' | 'item-title';
  topic?: string;
  keywords?: string[];
  length?: 'short' | 'medium' | 'long';
  tone?: 'professional' | 'casual' | 'creative' | 'formal';
  context?: string;
  category?: string;
  price?: number;
}

export interface IContentGenerationResponse {
  content: string;
  metadata: {
    type: string;
    wordCount: number;
    generatedAt: Date;
    model: string;
  };
}

export interface IRecommendationRequest {
  userId: string;
  context?: 'browse' | 'search' | 'profile' | 'similar';
  searchQuery?: string;
  category?: string;
  limit?: number;
}

export interface IRecommendationResponse {
  recommendations: Array<{
    itemId: string;
    title: string;
    reason: string;
    score: number;
  }>;
  metadata: {
    total: number;
    algorithm: string;
    generatedAt: Date;
  };
}

export interface IChatRequest {
  message: string;
  context?: string;
  conversationId?: string;
}

export interface IChatResponse {
  response: string;
  conversationId: string;
  metadata: {
    model: string;
    tokens: number;
    responseTime: number;
  };
}

export interface IAnalyticsRequest {
  type: 'user-activity' | 'item-performance' | 'market-trends';
  timeRange?: 'day' | 'week' | 'month' | 'year';
  filters?: Record<string, any>;
}

export interface IAnalyticsResponse {
  insights: Array<{
    topic: string;
    insight: string;
    chartData?: any;
    confidence: number;
  }>;
  metadata: {
    type: string;
    timeRange: string;
    generatedAt: Date;
    dataPoints: number;
  };
}

// Database interfaces
export interface IBlogGeneration extends IContentGenerationRequest {
  userId: string;
  title?: string;
  thumbnail?: string;
}

export interface IChatHistory {
  id: string;
  message: string;
  response: string;
  userId: string;
  conversationId?: string;
  createdAt: Date;
}

export interface IAIInsight {
  id: string;
  topic: string;
  insight: string;
  chartData?: any;
  createdAt: Date;
}