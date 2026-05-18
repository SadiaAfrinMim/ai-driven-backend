"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const auth_controller_1 = require("./auth.controller");
const auth_validation_1 = require("./auth.validation");
const router = express_1.default.Router();
// Register user
router.post('/register', (0, validateRequest_1.default)(auth_validation_1.authValidations.registerUserValidationSchema), auth_controller_1.authController.registerUser);
// Login user
router.post('/login', (0, validateRequest_1.default)(auth_validation_1.authValidations.loginUserValidationSchema), auth_controller_1.authController.loginUser);
// Refresh token
router.post('/refresh-token', auth_controller_1.authController.refreshToken);
// Logout user
router.post('/logout', auth_controller_1.authController.logoutUser);
exports.default = router;
