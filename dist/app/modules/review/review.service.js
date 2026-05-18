"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewService = void 0;
const database_1 = __importDefault(require("../../../config/database"));
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const createReview = async (userId, payload) => {
    console.log('🔄 Creating review for user:', userId, 'on item:', payload.itemId);
    // Check if item exists
    const item = await database_1.default.item.findUnique({
        where: { id: payload.itemId },
    });
    if (!item) {
        console.log('❌ Item not found:', payload.itemId);
        throw new ApiError_1.default(404, 'Item not found');
    }
    // Check if user already reviewed this item
    const existingReview = await database_1.default.review.findFirst({
        where: {
            userId,
            itemId: payload.itemId,
        },
    });
    if (existingReview) {
        console.log('⚠️ User already reviewed this item');
        throw new ApiError_1.default(409, 'You have already reviewed this item');
    }
    // Create review
    const review = await database_1.default.review.create({
        data: {
            comment: payload.comment,
            rating: payload.rating,
            userId,
            itemId: payload.itemId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            item: {
                select: {
                    id: true,
                    title: true,
                    category: true,
                },
            },
        },
    });
    // Update item average rating
    await updateItemAverageRating(payload.itemId);
    console.log('✅ Review created successfully:', review.id);
    return review;
};
const getReviews = async (filters = {}, includeStats = false) => {
    console.log('🔍 Getting reviews with filters:', filters);
    const query = new QueryBuilder_1.default(database_1.default.review.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            item: {
                select: {
                    id: true,
                    title: true,
                    category: true,
                },
            },
        },
    }), filters);
    const result = await query
        .search(['comment'])
        .filter()
        .sort()
        .paginate()
        .fields()
        .modelQuery;
    // Get total count
    const countQuery = new QueryBuilder_1.default(database_1.default.review.count(), filters);
    const total = await countQuery
        .search(['comment'])
        .filter()
        .modelQuery;
    const { page = 1, limit = 10 } = filters;
    const totalPages = Math.ceil(total / limit);
    let stats;
    if (includeStats) {
        stats = await getReviewStats(filters.itemId);
    }
    console.log(`✅ Retrieved ${result.length} reviews (page ${page}/${totalPages})`);
    return {
        reviews: result,
        stats,
        meta: {
            page,
            limit,
            total,
            totalPages,
        },
    };
};
const getReviewById = async (reviewId) => {
    console.log('🔍 Getting review by ID:', reviewId);
    const review = await database_1.default.review.findUnique({
        where: { id: reviewId },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            item: {
                select: {
                    id: true,
                    title: true,
                    category: true,
                },
            },
        },
    });
    if (!review) {
        console.log('❌ Review not found:', reviewId);
        throw new ApiError_1.default(404, 'Review not found');
    }
    console.log('✅ Review retrieved:', review.id);
    return review;
};
const updateReview = async (reviewId, userId, payload) => {
    console.log('🔄 Updating review:', reviewId, 'by user:', userId);
    // Check if review exists and user owns it
    const existingReview = await database_1.default.review.findUnique({
        where: { id: reviewId },
    });
    if (!existingReview) {
        console.log('❌ Review not found:', reviewId);
        throw new ApiError_1.default(404, 'Review not found');
    }
    if (existingReview.userId !== userId) {
        console.log('❌ Unauthorized: User', userId, 'does not own review', reviewId);
        throw new ApiError_1.default(403, 'You can only update your own reviews');
    }
    const updatedReview = await database_1.default.review.update({
        where: { id: reviewId },
        data: payload,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            item: {
                select: {
                    id: true,
                    title: true,
                    category: true,
                },
            },
        },
    });
    // Update item average rating if rating changed
    if (payload.rating !== undefined) {
        await updateItemAverageRating(existingReview.itemId);
    }
    console.log('✅ Review updated successfully:', updatedReview.id);
    return updatedReview;
};
const deleteReview = async (reviewId, userId) => {
    console.log('🗑️ Deleting review:', reviewId, 'by user:', userId);
    // Check if review exists and user owns it
    const existingReview = await database_1.default.review.findUnique({
        where: { id: reviewId },
    });
    if (!existingReview) {
        console.log('❌ Review not found:', reviewId);
        throw new ApiError_1.default(404, 'Review not found');
    }
    if (existingReview.userId !== userId) {
        console.log('❌ Unauthorized: User', userId, 'does not own review', reviewId);
        throw new ApiError_1.default(403, 'You can only delete your own reviews');
    }
    await database_1.default.review.delete({
        where: { id: reviewId },
    });
    // Update item average rating
    await updateItemAverageRating(existingReview.itemId);
    console.log('✅ Review deleted successfully');
};
const getItemReviews = async (itemId, includeStats = true) => {
    console.log('🔍 Getting reviews for item:', itemId);
    const filters = { itemId };
    return getReviews(filters, includeStats);
};
const getUserReviews = async (userId) => {
    console.log('🔍 Getting reviews by user:', userId);
    const filters = { userId };
    return getReviews(filters, false);
};
const getReviewStats = async (itemId) => {
    console.log('📊 Getting review stats for item:', itemId || 'all items');
    const whereClause = itemId ? { itemId } : {};
    const reviews = await database_1.default.review.findMany({
        where: whereClause,
        select: {
            rating: true,
        },
    });
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;
    const ratingDistribution = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
    };
    reviews.forEach(review => {
        ratingDistribution[review.rating]++;
    });
    console.log('✅ Review stats calculated:', { totalReviews, averageRating });
    return {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        ratingDistribution,
    };
};
// Helper function to update item average rating
const updateItemAverageRating = async (itemId) => {
    const reviews = await database_1.default.review.findMany({
        where: { itemId },
        select: { rating: true },
    });
    const averageRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;
    await database_1.default.item.update({
        where: { id: itemId },
        data: { rating: averageRating },
    });
    console.log('📊 Updated item average rating:', itemId, averageRating);
};
exports.reviewService = {
    createReview,
    getReviews,
    getReviewById,
    updateReview,
    deleteReview,
    getItemReviews,
    getUserReviews,
    getReviewStats,
};
