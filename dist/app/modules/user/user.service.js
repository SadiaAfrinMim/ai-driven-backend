"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const database_1 = __importDefault(require("../../../config/database"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const getUserProfile = async (userId) => {
    console.log('🔍 Getting user profile for ID:', userId);
    const user = await database_1.default.user.findUnique({
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
        throw new ApiError_1.default(404, 'User not found');
    }
    console.log('✅ User profile retrieved:', user.name);
    return user;
};
const updateUserProfile = async (userId, payload) => {
    console.log('🔄 Updating user profile for ID:', userId, payload);
    // Check if user exists
    const existingUser = await database_1.default.user.findUnique({
        where: { id: userId },
    });
    if (!existingUser) {
        console.log('❌ User not found for update:', userId);
        throw new ApiError_1.default(404, 'User not found');
    }
    // Update user profile
    const updatedUser = await database_1.default.user.update({
        where: { id: userId },
        data: {
            name: payload.name,
            bio: payload.bio,
            profileImage: payload.profileImage,
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
const getUserStats = async (userId) => {
    console.log('📊 Getting user stats for ID:', userId);
    const [itemCount, reviewCount, blogCount] = await Promise.all([
        database_1.default.item.count({ where: { ownerId: userId } }),
        database_1.default.review.count({ where: { userId } }),
        database_1.default.blog.count({ where: { authorId: userId } }),
    ]);
    const stats = {
        totalItems: itemCount,
        totalReviews: reviewCount,
        totalBlogs: blogCount,
    };
    console.log('✅ User stats retrieved:', stats);
    return stats;
};
const deleteUserAccount = async (userId) => {
    console.log('🗑️ Deleting user account for ID:', userId);
    // Check if user exists
    const existingUser = await database_1.default.user.findUnique({
        where: { id: userId },
    });
    if (!existingUser) {
        console.log('❌ User not found for deletion:', userId);
        throw new ApiError_1.default(404, 'User not found');
    }
    // Delete user (this will cascade delete related records due to Prisma relations)
    await database_1.default.user.delete({
        where: { id: userId },
    });
    console.log('✅ User account deleted successfully');
};
const getAllUsers = async (requesterRole) => {
    console.log('📋 Getting all users for role:', requesterRole);
    const where = {};
    // Managers can only see regular USER accounts
    if (requesterRole === 'MANAGER') {
        where.role = 'USER';
    }
    const users = await database_1.default.user.findMany({
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
const updateUserRole = async (userId, newRole) => {
    console.log('🔄 Updating user role:', { userId, newRole });
    // Check if user exists
    const existingUser = await database_1.default.user.findUnique({
        where: { id: userId },
    });
    if (!existingUser) {
        throw new ApiError_1.default(404, 'User not found');
    }
    // Prevent admin from changing their own role to avoid lockout
    if (existingUser.role === 'ADMIN' && newRole !== 'ADMIN') {
        // This check would need to be done in controller based on current user
        // For now, we'll allow it but add logging
        console.log('⚠️ Warning: Admin role being changed');
    }
    const updatedUser = await database_1.default.user.update({
        where: { id: userId },
        data: { role: newRole },
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
exports.userService = {
    getUserProfile,
    updateUserProfile,
    getUserStats,
    deleteUserAccount,
    getAllUsers,
    updateUserRole,
};
