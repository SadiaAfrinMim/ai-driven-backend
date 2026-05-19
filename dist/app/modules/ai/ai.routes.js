"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importStar(require("../../middlewares/validateRequest"));
const ai_controller_1 = require("./ai.controller");
const ai_validation_1 = require("./ai.validation");
const router = express_1.default.Router();
// Generate content - USER, MANAGER, ADMIN
router.post('/generate-content', (0, auth_1.default)('USER', 'MANAGER', 'ADMIN'), (0, validateRequest_1.default)(ai_validation_1.aiValidations.contentGenerationValidationSchema), ai_controller_1.aiController.generateContent);
// Generate item content - USER, MANAGER, ADMIN
router.post('/generate-item-content', (0, auth_1.default)('USER', 'MANAGER', 'ADMIN'), (0, validateRequest_1.default)(ai_validation_1.aiValidations.contentGenerationValidationSchema), ai_controller_1.aiController.generateItemContent);
router.post('/discover', ai_controller_1.aiController.discoverProducts);
// Other authenticated routes
router.use((0, auth_1.default)()); // Apply auth middleware for all routes below
router.get('/recommendations', (0, validateRequest_1.validateQuery)(ai_validation_1.aiValidations.recommendationValidationSchema), ai_controller_1.aiController.getRecommendations);
router.post('/chat', (0, validateRequest_1.default)(ai_validation_1.aiValidations.chatValidationSchema), ai_controller_1.aiController.chatWithAI);
// Analytics - ADMIN only
router.get('/analytics', (0, auth_1.default)('ADMIN'), (0, validateRequest_1.validateQuery)(ai_validation_1.aiValidations.analyticsValidationSchema), ai_controller_1.aiController.generateAnalytics);
router.post('/generate-blog', (0, validateRequest_1.default)(ai_validation_1.aiValidations.generateBlogValidationSchema), ai_controller_1.aiController.generateBlog);
router.get('/chat-history', ai_controller_1.aiController.getChatHistory);
// Insights - MANAGER, ADMIN
router.get('/insights', (0, auth_1.default)('MANAGER', 'ADMIN'), ai_controller_1.aiController.getInsights);
// Advanced trending features 2026
router.post('/analyze-trends', (0, auth_1.default)('USER', 'MANAGER', 'ADMIN'), ai_controller_1.aiController.analyzeTrends);
router.post('/analyze-sentiment', (0, auth_1.default)('USER', 'MANAGER', 'ADMIN'), ai_controller_1.aiController.analyzeSentiment);
// Generate AI review text
router.post('/generate-review', (0, auth_1.default)('USER', 'MANAGER', 'ADMIN'), ai_controller_1.aiController.generateReview);
exports.default = router;
