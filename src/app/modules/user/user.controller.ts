import { Request, Response } from 'express';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { userService } from './user.service';
import { IProfileUpdate } from './user.interface';
import ApiError from '../../../errors/ApiError';

const getProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  console.log('📨 Get profile request for user ID:', userId);

  const result = await userService.getUserProfile(userId);

  console.log('✅ Profile retrieved successfully');
  sendResponse(res, 200, true, 'Profile retrieved successfully', result);
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;
  const updateData: IProfileUpdate = req.body;

  console.log('📨 Update profile request:', { userId, updateData });

  const result = await userService.updateUserProfile(userId, updateData);

  console.log('✅ Profile updated successfully');
  sendResponse(res, 200, true, 'Profile updated successfully', result);
});

const getStats = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  console.log('📨 Get stats request for user ID:', userId);

  const result = await userService.getUserStats(userId);

  console.log('✅ User stats retrieved successfully');
  sendResponse(res, 200, true, 'User stats retrieved successfully', result);
});

const deleteAccount = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  console.log('📨 Delete account request for user ID:', userId);

  await userService.deleteUserAccount(userId);

  console.log('✅ Account deleted successfully');
  sendResponse(res, 200, true, 'Account deleted successfully');
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const currentUser = (req as any).user;
  const currentUserRole = currentUser?.role;

  console.log('📨 Get all users request by:', currentUserRole);

  const result = await userService.getAllUsers(currentUserRole);

  console.log(`✅ Retrieved ${result.length} users`);
  sendResponse(res, 200, true, 'Users retrieved successfully', result);
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { userId, role } = req.body;

  if (!userId || !role) {
    throw new ApiError(400, 'User ID and role are required');
  }

  if (!['USER', 'MANAGER', 'ADMIN'].includes(role)) {
    throw new ApiError(400, 'Invalid role. Must be USER, MANAGER, or ADMIN');
  }

  console.log('📨 Update user role request:', { userId, role });

  const result = await userService.updateUserRole(userId, role);

  console.log('✅ User role updated successfully');
  sendResponse(res, 200, true, 'User role updated successfully', result);
});

export const userController = {
  getProfile,
  updateProfile,
  getStats,
  deleteAccount,
  getAllUsers,
  updateUserRole,
};