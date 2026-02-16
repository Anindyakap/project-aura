// src/types/user.types.ts
// User-related type definitions

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  created_at: Date;
  is_active: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

// Helper to exclude password from user object
export const excludePassword = (user: User): UserResponse => {
  const { password_hash, updated_at, ...userWithoutPassword } = user;
  return userWithoutPassword;
};