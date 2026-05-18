"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadMultipleImages = exports.uploadSingleImage = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
// Configure multer for memory storage (for Cloudinary upload)
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files are allowed'));
    }
};
// General multer instances for different use cases
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 10, // Maximum 10 files
    },
});
exports.uploadSingleImage = exports.upload.single('image'); // For single image uploads
exports.uploadMultipleImages = exports.upload.array('images', 10); // General multiple image upload
