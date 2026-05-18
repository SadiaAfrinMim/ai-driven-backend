"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const auth = (...roles) => {
    return (req, res, next) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) {
                throw new ApiError_1.default(401, 'Access denied. No token provided.');
            }
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            if (roles.length > 0 && !roles.includes(decoded.role)) {
                throw new ApiError_1.default(403, 'Access denied. Insufficient permissions.');
            }
            req.user = decoded;
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.default = auth;
