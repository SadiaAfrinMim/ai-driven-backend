"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../../../config/database"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const createUser = async (payload) => {
    console.log('🔄 Creating user:', { name: payload.name, email: payload.email, role: payload.role });
    try {
        // Check if user already exists
        console.log('🔍 Checking if user exists...');
        const existingUser = await database_1.default.user.findUnique({
            where: { email: payload.email },
        });
        if (existingUser) {
            console.log('⚠️ User already exists:', existingUser.email);
            throw new ApiError_1.default(409, 'User already exists with this email');
        }
        console.log('✅ User does not exist, proceeding with creation...');
        // Hash password
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcryptjs_1.default.hash(payload.password, 12);
        console.log('✅ Password hashed successfully');
        // Validate and set role
        const validRoles = ['USER', 'ADMIN', 'MANAGER'];
        console.log('🔍 Available roles:', validRoles);
        console.log('🔍 Payload role:', payload.role);
        const userRole = payload.role && validRoles.includes(payload.role) ? payload.role : 'USER';
        console.log('🔍 Validating role:', { requested: payload.role, assigned: userRole });
        // Create user
        console.log('💾 Creating user in database...');
        const user = await database_1.default.user.create({
            data: {
                name: payload.name,
                email: payload.email,
                password: hashedPassword,
                role: userRole,
                bio: payload.bio,
                profileImage: payload.profileImage,
            },
        });
        console.log('✅ User created successfully:', { id: user.id, name: user.name, email: user.email });
        // Return user without password
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            bio: user.bio,
        };
    }
    catch (error) {
        console.error('❌ Error creating user:', error);
        throw error;
    }
};
const loginUser = async (payload) => {
    // Find user by email
    const user = await database_1.default.user.findUnique({
        where: { email: payload.email },
    });
    if (!user) {
        throw new ApiError_1.default(404, 'User not found');
    }
    // Check password
    const isPasswordValid = await bcryptjs_1.default.compare(payload.password, user.password);
    if (!isPasswordValid) {
        throw new ApiError_1.default(401, 'Invalid credentials');
    }
    // Generate tokens
    const jwtPayload = {
        id: user.id,
        email: user.email,
        role: user.role,
    };
    const accessToken = jsonwebtoken_1.default.sign(jwtPayload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
    });
    const refreshToken = jsonwebtoken_1.default.sign(jwtPayload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    });
    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileImage: user.profileImage,
            bio: user.bio,
        },
    };
};
const refreshToken = async (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Find user
        const user = await database_1.default.user.findUnique({
            where: { id: decoded.id },
        });
        if (!user) {
            throw new ApiError_1.default(404, 'User not found');
        }
        // Generate new access token
        const jwtPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
        };
        const accessToken = jsonwebtoken_1.default.sign(jwtPayload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
        });
        return {
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profileImage: user.profileImage,
                bio: user.bio,
            },
        };
    }
    catch (error) {
        throw new ApiError_1.default(401, 'Invalid refresh token');
    }
};
exports.authService = {
    createUser,
    loginUser,
    refreshToken,
};
