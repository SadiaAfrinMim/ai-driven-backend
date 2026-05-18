import { Request, Response } from 'express';
import catchAsync from '../../../utils/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { authService } from './auth.service';
import { ILoginUser, IRegisterUser } from './auth.interface';

const registerUser = catchAsync(async (req: Request, res: Response) => {
  console.log('📨 Register request received:', JSON.stringify(req.body, null, 2));

  const userData: IRegisterUser = req.body;

  console.log('🔄 Calling authService.createUser...');
  const result = await authService.createUser(userData);

  console.log('✅ User registration successful, sending response...');
  sendResponse(res, 201, true, 'User registered successfully', result);
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const loginData: ILoginUser = req.body;

  const result = await authService.loginUser(loginData);

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  // Remove refresh token from response body for security
  const { refreshToken, ...responseData } = result;

  sendResponse(res, 200, true, 'User logged in successfully', responseData);
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken: token } = req.cookies;

  const result = await authService.refreshToken(token);

  sendResponse(res, 200, true, 'Token refreshed successfully', result);
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  sendResponse(res, 200, true, 'User logged out successfully');
});

export const authController = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
};