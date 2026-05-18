"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const limiter_middleware_1 = require("./app/middlewares/limiter.middleware");
const error_middleware_1 = require("./app/middlewares/error.middleware");
const notFound_middleware_1 = require("./app/middlewares/notFound.middleware");
const router_1 = require("./app/routes/router");
const CacheService_1 = require("./app/modules/ai/CacheService");
const app = (0, express_1.default)();
// Initialize cache service
CacheService_1.cacheService.connect().catch(err => {
    console.warn('⚠️ Cache service initialization warning:', err);
});
// Security middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: true, // Allow all origins for development
    credentials: true,
}));
// Body parser
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Rate limiting
app.use('/api', limiter_middleware_1.apiLimiter);
// Routes
app.use('/api/v1', router_1.BaseRouter);
// Health check
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        cacheAvailable: CacheService_1.cacheService.isAvailable,
    });
});
// 404 handler
app.use(notFound_middleware_1.notFoundHandler);
// Global error handler
app.use(error_middleware_1.globalErrorHandler);
exports.default = app;
