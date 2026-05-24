"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authValidations = void 0;
const zod_1 = require("zod");
const loginUserValidationSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
const registerUserValidationSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    role: zod_1.z.enum(['USER', 'ADMIN', 'MANAGER'], 'Role must be USER, ADMIN, or MANAGER').optional(),
    bio: zod_1.z.string().optional(),
    profileImage: zod_1.z.string().url('Invalid URL format').optional(),
});
exports.authValidations = {
    loginUserValidationSchema,
    registerUserValidationSchema,
};
