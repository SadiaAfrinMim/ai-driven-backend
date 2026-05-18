"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const catchAsync_1 = __importDefault(require("../../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const auth_service_1 = require("./auth.service");
const registerUser = (0, catchAsync_1.default)(async (req, res) => {
    console.log('📨 Register request received:', JSON.stringify(req.body, null, 2));
    const userData = req.body;
    console.log('🔄 Calling authService.createUser...');
    const result = await auth_service_1.authService.createUser(userData);
    console.log('✅ User registration successful, sending response...');
    (0, sendResponse_1.default)(res, 201, true, 'User registered successfully', result);
});
const loginUser = (0, catchAsync_1.default)(async (req, res) => {
    const loginData = req.body;
    const result = await auth_service_1.authService.loginUser(loginData);
    // Set refresh token in httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    // Remove refresh token from response body for security
    const { refreshToken, ...responseData } = result;
    (0, sendResponse_1.default)(res, 200, true, 'User logged in successfully', responseData);
});
const refreshToken = (0, catchAsync_1.default)(async (req, res) => {
    const { refreshToken: token } = req.cookies;
    const result = await auth_service_1.authService.refreshToken(token);
    (0, sendResponse_1.default)(res, 200, true, 'Token refreshed successfully', result);
});
const logoutUser = (0, catchAsync_1.default)(async (req, res) => {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    (0, sendResponse_1.default)(res, 200, true, 'User logged out successfully');
});
exports.authController = {
    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
};
