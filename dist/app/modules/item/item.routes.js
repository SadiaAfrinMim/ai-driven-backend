"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const item_upload_1 = require("./item.upload");
const item_controller_1 = require("./item.controller");
const router = express_1.default.Router();
// Public routes (no authentication required)
router.get('/', item_controller_1.itemController.getItems);
// Authenticated routes (authentication required)
router.use((0, auth_1.default)()); // All routes below require authentication
// Create item - MANAGER, ADMIN only
router.post('/', (0, auth_1.default)('MANAGER', 'ADMIN'), item_upload_1.uploadItemImages, item_controller_1.itemController.createItem);
// Get user's own items - USER, MANAGER, ADMIN
router.get('/my-items', (0, auth_1.default)('USER', 'MANAGER', 'ADMIN'), item_controller_1.itemController.getMyItems);
// Admin Approval Routes
router.get('/pending', (0, auth_1.default)('ADMIN'), item_controller_1.itemController.getPendingItems);
router.patch('/:id/approve', (0, auth_1.default)('ADMIN'), item_controller_1.itemController.approveItem);
router.patch('/:id/reject', (0, auth_1.default)('ADMIN'), item_controller_1.itemController.rejectItem);
// Specific ID routes (must come after more specific routes)
router.get('/:id', item_controller_1.itemController.getItemById);
router.patch('/:id', (0, auth_1.default)('MANAGER', 'ADMIN'), item_controller_1.itemController.updateItem);
router.delete('/:id', (0, auth_1.default)('ADMIN'), item_controller_1.itemController.deleteItem);
exports.default = router;
