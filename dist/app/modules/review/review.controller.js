"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewController = void 0;
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const review_service_1 = require("./review.service");
const createReview = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    const reviewData = req.body;
    console.log('📝 Create review request:', { userId, itemId: reviewData.itemId });
    const result = await review_service_1.reviewService.createReview(userId, reviewData);
    console.log('✅ Review created successfully');
    (0, sendResponse_1.default)(res, 201, true, 'Review created successfully', result);
});
const getReviews = (0, catchAsync_1.default)(async (req, res) => {
    const filters = {
        itemId: req.query.itemId,
        userId: req.query.userId,
        rating: req.query.rating ? parseInt(req.query.rating) : undefined,
        minRating: req.query.minRating ? parseInt(req.query.minRating) : undefined,
        maxRating: req.query.maxRating ? parseInt(req.query.maxRating) : undefined,
    };
    const includeStats = req.query.includeStats === 'true';
    console.log('📋 Get reviews request:', { filters, includeStats });
    const result = await review_service_1.reviewService.getReviews(filters, includeStats);
    console.log('✅ Reviews retrieved successfully');
    (0, sendResponse_1.default)(res, 200, true, 'Reviews retrieved successfully', result);
});
const getReviewById = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    console.log('🔍 Get review by ID request:', id);
    const result = await review_service_1.reviewService.getReviewById(Array.isArray(id) ? id[0] : id);
    console.log('✅ Review retrieved successfully');
    (0, sendResponse_1.default)(res, 200, true, 'Review retrieved successfully', result);
});
const updateReview = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;
    console.log('🔄 Update review request:', { id, userId, updateData });
    const result = await review_service_1.reviewService.updateReview(Array.isArray(id) ? id[0] : id, userId, updateData);
    console.log('✅ Review updated successfully');
    (0, sendResponse_1.default)(res, 200, true, 'Review updated successfully', result);
});
const deleteReview = (0, catchAsync_1.default)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    console.log('🗑️ Delete review request:', { id, userId });
    await review_service_1.reviewService.deleteReview(Array.isArray(id) ? id[0] : id, userId);
    console.log('✅ Review deleted successfully');
    (0, sendResponse_1.default)(res, 200, true, 'Review deleted successfully');
});
const getItemReviews = (0, catchAsync_1.default)(async (req, res) => {
    const { itemId } = req.params;
    const includeStats = req.query.includeStats !== 'false'; // Default true
    console.log('📋 Get item reviews request:', itemId);
    const result = await review_service_1.reviewService.getItemReviews(Array.isArray(itemId) ? itemId[0] : itemId, includeStats);
    console.log('✅ Item reviews retrieved successfully');
    (0, sendResponse_1.default)(res, 200, true, 'Item reviews retrieved successfully', result);
});
const getUserReviews = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    console.log('📋 Get user reviews request for:', userId);
    const result = await review_service_1.reviewService.getUserReviews(userId);
    console.log('✅ User reviews retrieved successfully');
    (0, sendResponse_1.default)(res, 200, true, 'User reviews retrieved successfully', result);
});
const getReviewStats = (0, catchAsync_1.default)(async (req, res) => {
    const itemId = req.query.itemId;
    console.log('📊 Get review stats request for item:', itemId || 'all items');
    const result = await review_service_1.reviewService.getReviewStats(itemId);
    console.log('✅ Review stats retrieved successfully');
    (0, sendResponse_1.default)(res, 200, true, 'Review stats retrieved successfully', result);
});
exports.reviewController = {
    createReview,
    getReviews,
    getReviewById,
    updateReview,
    deleteReview,
    getItemReviews,
    getUserReviews,
    getReviewStats,
};
