"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRouter = void 0;
const express_1 = __importDefault(require("express"));
const auth_routes_1 = __importDefault(require("../modules/auth/auth.routes"));
const user_routes_1 = __importDefault(require("../modules/user/user.routes"));
const item_routes_1 = __importDefault(require("../modules/item/item.routes"));
const ai_routes_1 = __importDefault(require("../modules/ai/ai.routes"));
const review_routes_1 = __importDefault(require("../modules/review/review.routes"));
const notification_routes_1 = __importDefault(require("../modules/notification/notification.routes"));
const router = express_1.default.Router();
exports.BaseRouter = router;
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
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/items', item_routes_1.default);
router.use('/ai', ai_routes_1.default);
router.use('/reviews', review_routes_1.default);
router.use('/notifications', notification_routes_1.default);
