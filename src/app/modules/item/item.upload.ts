import multer from 'multer';

// Memory storage for Cloudinary upload
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

// Multer configuration for item images with error handling
export const uploadItemImages = (req: any, res: any, next: any) => {
  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit per file
      files: 10, // Maximum 10 files
    },
  }).any();

  upload(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large',
          errorDetails: 'File size exceeds 10MB limit. Please upload smaller images.',
        });
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files',
          errorDetails: 'Maximum 10 images allowed.',
        });
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Unexpected field',
          errorDetails: 'Only image files in "images" field are allowed.',
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