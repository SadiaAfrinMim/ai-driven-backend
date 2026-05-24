import { Request, Response, NextFunction } from 'express';
import ApiError from '../../errors/ApiError';

// Custom middleware to parse multipart form data text fields
export const parseMultipartData = (req: Request, res: Response, next: NextFunction) => {
  try {
    // If it's multipart data and body is empty, try to parse from raw data
    if (req.headers['content-type']?.includes('multipart/form-data') && Object.keys(req.body).length === 0) {
      console.log('🔍 Detected multipart form data, attempting to parse text fields...');

      // For multipart data, multer should have already parsed text fields
      // But if not, we can try to extract them from the raw request
      // For now, let's just log what's available
      console.log('📋 Available body fields:', Object.keys(req.body));
      console.log('📋 Raw body sample:', JSON.stringify(req.body).substring(0, 200));
    }

    next();
  } catch (error) {
    console.error('❌ Multipart parsing error:', error);
    next(new ApiError(400, 'Failed to parse request data'));
  }
};