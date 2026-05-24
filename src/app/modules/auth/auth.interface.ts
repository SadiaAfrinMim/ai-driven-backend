import { UserRole } from "@prisma/client";


export interface ILoginUser {
  email: string;
  password: string;
}

export interface IRegisterUser {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  bio?: string;
  profileImage?: string;
}

export interface IAuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profileImage?: string | null;
  bio?: string | null;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: IAuthUser;
}

export interface IRefreshTokenResponse {
  accessToken: string;
  user: IAuthUser;
}

export interface IJwtPayload {
  id: string;
  email: string;
  role: UserRole;
}