export const USER_ROLE = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
} as const;

export type TUserRole = keyof typeof USER_ROLE;

export interface TUser {
  id: string;
  name: string;
  email: string;
  role: TUserRole;
}