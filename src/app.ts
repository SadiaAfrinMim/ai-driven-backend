import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { apiLimiter } from './app/middlewares/limiter.middleware';
import { globalErrorHandler } from './app/middlewares/error.middleware';
import { notFoundHandler } from './app/middlewares/notFound.middleware';
import { BaseRouter } from './app/routes/router';
import { cacheService } from './app/modules/ai/CacheService';

const app: Application = express();

// Initialize cache service
cacheService.connect().catch(err => {
  console.warn('⚠️ Cache service initialization warning:', err);
});

// Security middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-side)
      if (!origin) return callback(null, true);

      const allowed = [
        /^http:\/\/localhost(:\d+)?$/,
        /^http:\/\/127\.0\.0\.1(:\d+)?$/,
        "https://ai-project-flax-ten.vercel.app",
        // Add your production frontend domain here when ready
      ];

      const isAllowed = allowed.some((pattern) =>
        typeof pattern === "string" ? pattern === origin : pattern.test(origin)
      );

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', apiLimiter);

// Routes
app.use('/api/v1', BaseRouter);

// Health check
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    cacheAvailable: cacheService.isAvailable,
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

export default app;