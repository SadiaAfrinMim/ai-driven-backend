import { Request, Response } from 'express';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { reviewService } from './review.service';
import { ICreateReview, IUpdateReview, IReviewFilters } from './review.interface';

const createReview = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const reviewData: ICreateReview = req.body;

  console.log('📝 Create review request:', { userId, itemId: reviewData.itemId });

  const result = await reviewService.createReview(userId, reviewData);

  console.log('✅ Review created successfully');
  sendResponse(res, 201, true, 'Review created successfully', result);
});

const getReviews = catchAsync(async (req: Request, res: Response) => {
  const filters: IReviewFilters = {
    itemId: req.query.itemId as string,
    userId: req.query.userId as string,
    rating: req.query.rating ? parseInt(req.query.rating as string) : undefined,
    minRating: req.query.minRating ? parseInt(req.query.minRating as string) : undefined,
    maxRating: req.query.maxRating ? parseInt(req.query.maxRating as string) : undefined,
  };

  const includeStats = req.query.includeStats === 'true';

  console.log('📋 Get reviews request:', { filters, includeStats });

  const result = await reviewService.getReviews(filters, includeStats);

  console.log('✅ Reviews retrieved successfully');
  sendResponse(res, 200, true, 'Reviews retrieved successfully', result);
});

const getReviewById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  console.log('🔍 Get review by ID request:', id);

  const result = await reviewService.getReviewById(Array.isArray(id) ? id[0] : id);

  console.log('✅ Review retrieved successfully');
  sendResponse(res, 200, true, 'Review retrieved successfully', result);
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;
  const updateData: IUpdateReview = req.body;

  console.log('🔄 Update review request:', { id, userId, updateData });

  const result = await reviewService.updateReview(Array.isArray(id) ? id[0] : id, userId, updateData);

  console.log('✅ Review updated successfully');
  sendResponse(res, 200, true, 'Review updated successfully', result);
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;

  console.log('🗑️ Delete review request:', { id, userId });

  await reviewService.deleteReview(Array.isArray(id) ? id[0] : id, userId);

  console.log('✅ Review deleted successfully');
  sendResponse(res, 200, true, 'Review deleted successfully');
});

const getItemReviews = catchAsync(async (req: Request, res: Response) => {
  const { itemId } = req.params;
  const includeStats = req.query.includeStats !== 'false'; // Default true

  console.log('📋 Get item reviews request:', itemId);

  const result = await reviewService.getItemReviews(Array.isArray(itemId) ? itemId[0] : itemId, includeStats);

  console.log('✅ Item reviews retrieved successfully');
  sendResponse(res, 200, true, 'Item reviews retrieved successfully', result);
});

const getUserReviews = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  console.log('📋 Get user reviews request for:', userId);

  const result = await reviewService.getUserReviews(userId);

  console.log('✅ User reviews retrieved successfully');
  sendResponse(res, 200, true, 'User reviews retrieved successfully', result);
});

const getReviewStats = catchAsync(async (req: Request, res: Response) => {
  const itemId = req.query.itemId as string;

  console.log('📊 Get review stats request for item:', itemId || 'all items');

  const result = await reviewService.getReviewStats(itemId);

  console.log('✅ Review stats retrieved successfully');
  sendResponse(res, 200, true, 'Review stats retrieved successfully', result);
});

export const reviewController = {
  createReview,
  getReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getItemReviews,
  getUserReviews,
  getReviewStats,
};