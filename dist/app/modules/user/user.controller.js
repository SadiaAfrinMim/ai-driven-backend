"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const user_service_1 = require("./user.service");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const getProfile = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    console.log('📨 Get profile request for user ID:', userId);
    const result = await user_service_1.userService.getUserProfile(userId);
    console.log('✅ Profile retrieved successfully');
    (0, sendResponse_1.default)(res, 200, true, 'Profile retrieved successfully', result);
});
const updateProfile = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    const updateData = req.body;
    console.log('📨 Update profile request:', { userId, updateData });
    const result = await user_service_1.userService.updateUserProfile(userId, updateData);
    console.log('✅ Profile updated successfully');
    (0, sendResponse_1.default)(res, 200, true, 'Profile updated successfully', result);
});
const getStats = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    console.log('📨 Get stats request for user ID:', userId);
    const result = await user_service_1.userService.getUserStats(userId);
    console.log('✅ User stats retrieved successfully');
    (0, sendResponse_1.default)(res, 200, true, 'User stats retrieved successfully', result);
});
const deleteAccount = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.user.id;
    console.log('📨 Delete account request for user ID:', userId);
    await user_service_1.userService.deleteUserAccount(userId);
    console.log('✅ Account deleted successfully');
    (0, sendResponse_1.default)(res, 200, true, 'Account deleted successfully');
});
const getAllUsers = (0, catchAsync_1.default)(async (req, res) => {
    const currentUser = req.user;
    const currentUserRole = currentUser?.role;
    console.log('📨 Get all users request by:', currentUserRole);
    const result = await user_service_1.userService.getAllUsers(currentUserRole);
    console.log(`✅ Retrieved ${result.length} users`);
    (0, sendResponse_1.default)(res, 200, true, 'Users retrieved successfully', result);
});
const updateUserRole = (0, catchAsync_1.default)(async (req, res) => {
    const { userId, role } = req.body;
    if (!userId || !role) {
        throw new ApiError_1.default(400, 'User ID and role are required');
    }
    if (!['USER', 'MANAGER', 'ADMIN'].includes(role)) {
        throw new ApiError_1.default(400, 'Invalid role. Must be USER, MANAGER, or ADMIN');
    }
    console.log('📨 Update user role request:', { userId, role });
    const result = await user_service_1.userService.updateUserRole(userId, role);
    console.log('✅ User role updated successfully');
    (0, sendResponse_1.default)(res, 200, true, 'User role updated successfully', result);
});
exports.userController = {
    getProfile,
    updateProfile,
    getStats,
    deleteAccount,
    getAllUsers,
    updateUserRole,
};
