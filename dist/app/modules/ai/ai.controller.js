"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiController = void 0;
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const ai_service_1 = require("./ai.service");
const generateContent = (0, catchAsync_1.default)(async (req, res) => {
    const requestData = req.body;
    console.log('🎨 Content generation request:', requestData);
    const result = await ai_service_1.aiService.generateContent(requestData);
    console.log('✅ Content generated successfully');
    (0, sendResponse_1.default)(res, 200, true, 'Content generated successfully', result);
});
const generateItemContent = (0, catchAsync_1.default)(async (req, res) => {
    const requestData = req.body;
    console.log('📦 Item content generation request:', requestData);
    const result = await ai_service_1.aiService.generateItemContent(requestData);
    console.log('✅ Item content generated successfully');
    (0, sendResponse_1.default)(res, 200, true, 'Item content generated successfully', result);
});
const getRecommendations = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    const requestData = {
        userId,
        context: req.query.context,
        searchQuery: req.query.searchQuery,
        category: req.query.category,
        limit: req.query.limit ? parseInt(req.query.limit) : 10,
    };
    console.log('🎯 Recommendation request:', requestData);
    const result = await ai_service_1.aiService.getRecommendations(requestData);
    console.log('✅ Recommendations generated successfully');
    (0, sendResponse_1.default)(res, 200, true, 'Recommendations retrieved successfully', result);
});
const chatWithAI = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    const requestData = req.body;
    console.log('💬 Chat request from user:', userId, requestData.message.substring(0, 50) + '...');
    const result = await ai_service_1.aiService.processChat(requestData, userId);
    console.log('✅ Chat response generated successfully');
    (0, sendResponse_1.default)(res, 200, true, 'Chat response generated', result);
});
const generateAnalytics = (0, catchAsync_1.default)(async (req, res) => {
    const requestData = {
        type: req.query.type,
        timeRange: req.query.timeRange,
        filters: req.query.filters ? JSON.parse(req.query.filters) : undefined,
    };
    console.log('📊 Analytics request:', requestData);
    const result = await ai_service_1.aiService.generateAnalytics(requestData);
    console.log('✅ Analytics generated successfully');
    (0, sendResponse_1.default)(res, 200, true, 'Analytics generated successfully', result);
});
const generateBlog = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    const requestData = req.body;
    console.log('📝 Blog generation request:', requestData);
    const result = await ai_service_1.aiService.generateBlog({
        ...requestData,
        userId,
    }, userId);
    console.log('✅ Blog generated successfully');
    (0, sendResponse_1.default)(res, 201, true, 'Blog generated and saved successfully', result);
});
const getChatHistory = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    console.log('📜 Chat history request for user:', userId);
    const result = await ai_service_1.aiService.getChatHistory(userId, limit);
    console.log('✅ Chat history retrieved successfully');
    (0, sendResponse_1.default)(res, 200, true, 'Chat history retrieved successfully', result);
});
const getInsights = (0, catchAsync_1.default)(async (req, res) => {
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    console.log('🔍 Insights request, limit:', limit);
    const result = await ai_service_1.aiService.getInsights(limit);
    console.log('✅ Insights retrieved successfully');
    (0, sendResponse_1.default)(res, 200, true, 'AI insights retrieved successfully', result);
});
exports.aiController = {
    generateContent,
    generateItemContent,
    getRecommendations,
    chatWithAI,
    generateAnalytics,
    generateBlog,
    getChatHistory,
    getInsights,
};
