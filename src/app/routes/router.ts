import express from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/user/user.routes';
import itemRoutes from '../modules/item/item.routes';
import aiRoutes from '../modules/ai/ai.routes';
import reviewRoutes from '../modules/review/review.routes';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API version info
router.get('/version', (req, res) => {
  res.status(200).json({
    success: true,
    version: '1.0.0',
    api: 'v1',
  });
});

// Mount module routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/items', itemRoutes);
router.use('/ai', aiRoutes);
router.use('/reviews', reviewRoutes);

export { router as BaseRouter };