"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfileImage = void 0;
const multer_1 = __importDefault(require("multer"));
// Memory storage for Cloudinary upload
const storage = multer_1.default.memoryStorage();
// File filter for images only
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files are allowed'));
    }
};
// Multer configuration for single profile image upload (max 5MB)
const uploadProfileImage = (req, res, next) => {
    const upload = (0, multer_1.default)({
        storage,
        fileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB limit
        },
    }).single('profileImage');
    upload(req, res, (error) => {
        if (error) {
            console.error('❌ Multer error during profile image upload:', error);
        }
        if (error instanceof multer_1.default.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File too large',
                    errorDetails: 'Profile image size exceeds 5MB limit. Please upload a smaller image.',
                });
            }
            if (error.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    success: false,
                    message: 'Unexpected field',
                    errorDetails: 'Only image files in "profileImage" field are allowed.',
                });
            }
        }
        if (error && error.message === 'Only image files are allowed') {
            return res.status(400).json({
                success: false,
                message: 'Invalid file type',
                errorDetails: 'Only image files (JPEG, PNG, WebP, etc.) are allowed.',
            });
        }
        // No error, continue
        next();
    });
};
exports.uploadProfileImage = uploadProfileImage;
