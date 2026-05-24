"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_controller_1 = require("./user.controller");
const user_validation_1 = require("./user.validation");
const router = express_1.default.Router();
// Profile routes - USER, MANAGER, ADMIN can access their own profile
router.get('/profile', (0, auth_1.default)('USER', 'MANAGER', 'ADMIN'), user_controller_1.userController.getProfile);
router.patch('/profile', (0, auth_1.default)('USER', 'MANAGER', 'ADMIN'), (0, validateRequest_1.default)(user_validation_1.userValidations.updateProfileValidationSchema), user_controller_1.userController.updateProfile);
// User statistics - USER, MANAGER, ADMIN can access their own stats
router.get('/stats', (0, auth_1.default)('USER', 'MANAGER', 'ADMIN'), user_controller_1.userController.getStats);
// Delete account - USER, MANAGER, ADMIN can delete their own account
router.delete('/account', (0, auth_1.default)('USER', 'MANAGER', 'ADMIN'), user_controller_1.userController.deleteAccount);
// Admin only routes - ADMIN role required
router.get('/all-users', (0, auth_1.default)('ADMIN', 'MANAGER'), user_controller_1.userController.getAllUsers);
router.patch('/update-role', (0, auth_1.default)('ADMIN'), user_controller_1.userController.updateUserRole);
exports.default = router;
