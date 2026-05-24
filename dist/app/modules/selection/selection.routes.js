"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const selection_controller_1 = require("./selection.controller");
const router = express_1.default.Router();
console.log('✅ Selection routes module loaded');
// Auth required for all selection routes
router.use((0, auth_1.default)());
// User: create a selection (reserve product) - primarily for USER role, but allow others if needed
router.post('/', (0, auth_1.default)('USER', 'MANAGER', 'ADMIN'), selection_controller_1.selectionController.createSelection);
// Get own selections
router.get('/my-selections', selection_controller_1.selectionController.getMySelections);
// Get approved selections for current user (for cards display)
router.get('/approved', selection_controller_1.selectionController.getApprovedForMe);
// Fallback for bare /selections (some places may call this) - returns current user's selections
router.get('/', selection_controller_1.selectionController.getMySelections);
// Manager/Admin: view pending selections to approve
router.get('/pending', (0, auth_1.default)('MANAGER', 'ADMIN'), selection_controller_1.selectionController.getPendingSelections);
// Approve / Reject a selection
router.patch('/:id/approve', (0, auth_1.default)('MANAGER', 'ADMIN'), selection_controller_1.selectionController.approveSelection);
router.patch('/:id/reject', (0, auth_1.default)('MANAGER', 'ADMIN'), selection_controller_1.selectionController.rejectSelection);
exports.default = router;
