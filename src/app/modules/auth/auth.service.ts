import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../../../config/database';
import { ILoginUser, IRegisterUser, IJwtPayload, IAuthUser } from './auth.interface';
import ApiError from '../../../errors/ApiError';

const createUser = async (payload: IRegisterUser): Promise<any> => {
  console.log('🔄 Creating user:', { name: payload.name, email: payload.email, role: payload.role });

  try {
    // Check if user already exists
    console.log('🔍 Checking if user exists...');
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (existingUser) {
      console.log('⚠️ User already exists:', existingUser.email);
      throw new ApiError(409, 'User already exists with this email');
    }

    console.log('✅ User does not exist, proceeding with creation...');

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(payload.password, 12);
    console.log('✅ Password hashed successfully');

    // Validate and set role
    const validRoles = ['USER', 'ADMIN', 'MANAGER'];
    console.log('🔍 Available roles:', validRoles);
    console.log('🔍 Payload role:', payload.role);
    const userRole = payload.role && validRoles.includes(payload.role) ? payload.role : 'USER';
    console.log('🔍 Validating role:', { requested: payload.role, assigned: userRole });

    // Create user
    console.log('💾 Creating user in database...');
    const user = await prisma.user.create({
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

    // Generate JWT token for immediate login after registration
    const jwtPayload: IJwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(jwtPayload, process.env.JWT_SECRET as string, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
    } as SignOptions);

    // Return user + token (so frontend can auto-login)
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
  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  }
};

const loginUser = async (payload: ILoginUser) => {
  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Generate tokens
  const jwtPayload: IJwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(jwtPayload, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
  } as SignOptions);

  const refreshToken = jwt.sign(jwtPayload, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  } as SignOptions);

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

const refreshToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJwtPayload;

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Generate new access token
    const jwtPayload: IJwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(jwtPayload, process.env.JWT_SECRET as string, {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
    } as SignOptions);

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
  } catch (error) {
    throw new ApiError(401, 'Invalid refresh token');
  }
};

export const authService = {
  createUser,
  loginUser,
  refreshToken,
};