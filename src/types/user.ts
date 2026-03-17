import type { RoleType } from './enums';

export interface UserRole {
  id: number;
  name: string;
  slug: RoleType;
}

export interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
  role_id: number;
  role: UserRole;
  area_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role_id: number;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
}
