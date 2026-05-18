import { ErrorRequestHandler } from 'express';
import ApiError from '../../errors/ApiError';

export const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = 'Something went wrong';
  let errorDetails = err;

  // Handle Prisma errors
  if (err?.code && typeof err.code === 'string') {
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        message = 'Duplicate entry';
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Record not found';
        break;
      default:
        statusCode = 400;
        message = 'Database error';
    }
  }

  // Handle custom ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorDetails = err;
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation error';
    errorDetails = err.issues;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorDetails: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
};