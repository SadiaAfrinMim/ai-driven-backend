import { UserRole } from '@prisma/client';

export interface IProfileUpdate {
  name?: string;
  bio?: string;
  profileImage?: string;
}

export interface IUserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileImage?: string | null;
  bio?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProfileStats {
  totalItems: number;
  totalReviews: number;
  totalBlogs: number;
}