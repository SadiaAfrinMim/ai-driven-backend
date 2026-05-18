"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userValidations = void 0;
const zod_1 = require("zod");
const updateProfileValidationSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters').optional(),
    bio: zod_1.z.string().max(500, 'Bio must be less than 500 characters').optional(),
    profileImage: zod_1.z.string().url('Invalid URL format').optional(),
});
exports.userValidations = {
    updateProfileValidationSchema,
};
