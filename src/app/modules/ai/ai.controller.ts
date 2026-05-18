import { Request, Response } from 'express';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { aiService } from './ai.service';
import { IContentGenerationRequest, IRecommendationRequest, IChatRequest, IAnalyticsRequest } from './ai.interface';

const generateContent = catchAsync(async (req: Request, res: Response) => {
  const requestData: IContentGenerationRequest = req.body;

  console.log('🎨 Content generation request:', requestData);

  const result = await aiService.generateContent(requestData);

  console.log('✅ Content generated successfully');
  sendResponse(res, 200, true, 'Content generated successfully', result);
});

const generateItemContent = catchAsync(async (req: Request, res: Response) => {
  const requestData: IContentGenerationRequest = req.body;

  console.log('📦 Item content generation request:', requestData);

  const result = await aiService.generateItemContent(requestData);

  console.log('✅ Item content generated successfully');
  sendResponse(res, 200, true, 'Item content generated successfully', result);
});

const getRecommendations = catchAsync(async (req: Request, res: Response) => {
  // Prefer authenticated user id, but allow userId in query for debugging/fallback
  const authUser = (req as any).user;
  const queryUserId = req.query.userId as string | undefined;
  const userId = authUser?.id || queryUserId;

  if (!userId) {
    console.log('⚠️ Recommendation request without userId - returning empty');
    return sendResponse(res, 200, true, 'No user context, no recommendations', { recommendations: [] });
  }

  const requestData: IRecommendationRequest = {
    userId,
    context: req.query.context as any,
    searchQuery: req.query.searchQuery as string,
    category: req.query.category as string,
    limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
  };

  console.log('🎯 Recommendation request:', requestData);

  const result = await aiService.getRecommendations(requestData);

  console.log('✅ Recommendations generated successfully - count:', result.recommendations.length);
  sendResponse(res, 200, true, 'Recommendations retrieved successfully', result);
});


const chatWithAI = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const requestData: IChatRequest = req.body;

  console.log('💬 Chat request from user:', userId, requestData.message.substring(0, 50) + '...');

  const result = await aiService.processChat(requestData, userId);

  console.log('✅ Chat response generated successfully');
  sendResponse(res, 200, true, 'Chat response generated', result);
});

const generateAnalytics = catchAsync(async (req: Request, res: Response) => {
  const requestData: IAnalyticsRequest = {
    type: req.query.type as any,
    timeRange: req.query.timeRange as any,
    filters: req.query.filters ? JSON.parse(req.query.filters as string) : undefined,
  };

  console.log('📊 Analytics request:', requestData);

  const result = await aiService.generateAnalytics(requestData);

  console.log('✅ Analytics generated successfully');
  sendResponse(res, 200, true, 'Analytics generated successfully', result);
});

const generateBlog = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const requestData = req.body;

  console.log('📝 Blog generation request:', requestData);

  const result = await aiService.generateBlog({
    ...requestData,
    userId,
  }, userId);

  console.log('✅ Blog generated successfully');
  sendResponse(res, 201, true, 'Blog generated and saved successfully', result);
});

const getChatHistory = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

  console.log('📜 Chat history request for user:', userId);

  const result = await aiService.getChatHistory(userId, limit);

  console.log('✅ Chat history retrieved successfully');
  sendResponse(res, 200, true, 'Chat history retrieved successfully', result);
});

const getInsights = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

  console.log('🔍 Insights request, limit:', limit);

  const result = await aiService.getInsights(limit);

  console.log('✅ Insights retrieved successfully');
  sendResponse(res, 200, true, 'AI insights retrieved successfully', result);
});

// Advanced 2026 trending AI features
const analyzeTrends = catchAsync(async (req: Request, res: Response) => {
  const result = await aiService.analyzeTrends(req.body);
  sendResponse(res, 200, true, 'Trend analysis completed', result);
});

const analyzeSentiment = catchAsync(async (req: Request, res: Response) => {
  const result = await aiService.analyzeSentiment(req.body);
  sendResponse(res, 200, true, 'Sentiment analysis completed', result);
});

const generateReview = catchAsync(async (req: Request, res: Response) => {
  const { productName, rating } = req.body;
  const result = await aiService.generateReviewText(productName, rating);
  sendResponse(res, 200, true, 'Review generated successfully', result);
});

export const aiController = {
  generateContent,
  generateItemContent,
  getRecommendations,
  chatWithAI,
  generateAnalytics,
  generateBlog,
  getChatHistory,
  getInsights,
  analyzeTrends,
  analyzeSentiment,
  generateReview,
};