"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const globalErrorHandler = (err, req, res, next) => {
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
    if (err instanceof ApiError_1.default) {
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
    res.status(statusCode).json({
        success: false,
        message,
        errorDetails: process.env.NODE_ENV === 'development' ? errorDetails : undefined,
    });
};
exports.default = globalErrorHandler;
