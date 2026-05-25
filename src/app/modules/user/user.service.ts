import prisma from '../../../config/database';
import { IProfileUpdate, IUserProfile, IProfileStats } from './user.interface';
import { UserRole } from '@prisma/client';
import ApiError from '../../../errors/ApiError';
import { uploadImage } from '../../../shared/cloudinary';

const getUserProfile = async (userId: string): Promise<IUserProfile> => {
  console.log('🔍 Getting user profile for ID:', userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      bio: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    console.log('❌ User not found:', userId);
    throw new ApiError(404, 'User not found');
  }

  console.log('✅ User profile retrieved:', user.name);
  return user;
};

const updateUserProfile = async (userId: string, payload: IProfileUpdate): Promise<IUserProfile> => {
   console.log('🔄 Updating user profile for ID:', userId, payload);

   // Check if user exists
   const existingUser = await prisma.user.findUnique({
     where: { id: userId },
   });

   if (!existingUser) {
     console.log('❌ User not found for update:', userId);
     throw new ApiError(404, 'User not found');
   }

   // Handle profile image upload to Cloudinary if it's a base64 string
   let imageToUpdate = payload.profileImage;
   if (payload.profileImage && typeof payload.profileImage === 'string' && payload.profileImage.startsWith('data:image')) {
     console.log('📤 Detected base64 image, uploading to Cloudinary...');
     try {
       const uploadResult = await uploadImage(payload.profileImage, 'profile-images');
       imageToUpdate = uploadResult.secure_url;
       console.log('✅ Image uploaded to Cloudinary:', imageToUpdate);
     } catch (error) {
       console.error('❌ Cloudinary upload failed:', error);
       throw new ApiError(500, 'Failed to upload profile image');
     }
   }

   // Update user profile
   const updatedUser = await prisma.user.update({
     where: { id: userId },
     data: {
       name: payload.name,
       bio: payload.bio,
       profileImage: imageToUpdate,
     },
     select: {
       id: true,
       name: true,
       email: true,
       role: true,
       profileImage: true,
       bio: true,
       createdAt: true,
       updatedAt: true,
     },
   });

   console.log('✅ User profile updated successfully:', updatedUser.name);
   return updatedUser;
 };

const getUserStats = async (userId: string): Promise<IProfileStats> => {
  console.log('📊 Getting user stats for ID:', userId);

  const [itemCount, reviewCount, blogCount] = await Promise.all([
    prisma.item.count({ where: { ownerId: userId } }),
    prisma.review.count({ where: { userId } }),
    prisma.blog.count({ where: { authorId: userId } }),
  ]);

  const stats = {
    totalItems: itemCount,
    totalReviews: reviewCount,
    totalBlogs: blogCount,
  };

  console.log('✅ User stats retrieved:', stats);
  return stats;
};

const deleteUserAccount = async (userId: string): Promise<void> => {
  console.log('🗑️ Deleting user account for ID:', userId);

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    console.log('❌ User not found for deletion:', userId);
    throw new ApiError(404, 'User not found');
  }

  // Delete user (this will cascade delete related records due to Prisma relations)
  await prisma.user.delete({
    where: { id: userId },
  });

  console.log('✅ User account deleted successfully');
};

const getAllUsers = async (requesterRole?: string) => {
  console.log('📋 Getting all users for role:', requesterRole);

  const where: any = {};

  // Managers can only see regular USER accounts
  if (requesterRole === 'MANAGER') {
    where.role = 'USER';
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      bio: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return users;
};

const updateUserRole = async (userId: string, newRole: string) => {
  console.log('🔄 Updating user role:', { userId, newRole });

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new ApiError(404, 'User not found');
  }

  // Prevent admin from changing their own role to avoid lockout
  if (existingUser.role === 'ADMIN' && newRole !== 'ADMIN') {
    // This check would need to be done in controller based on current user
    // For now, we'll allow it but add logging
    console.log('⚠️ Warning: Admin role being changed');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole as UserRole },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

export const userService = {
  getUserProfile,
  updateUserProfile,
  getUserStats,
  deleteUserAccount,
  getAllUsers,
  updateUserRole,
};