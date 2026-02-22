// lib/api.ts
// API client for communicating with backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// ============================================
// TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  is_active: boolean;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface ApiError {
  error: boolean;
  message: string;
}

// ============================================
// TOKEN MANAGEMENT
// ============================================

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('aura_token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('aura_token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('aura_token');
  localStorage.removeItem('aura_user');
};

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('aura_user');
  return user ? JSON.parse(user) : null;
};

export const setUser = (user: User): void => {
  localStorage.setItem('aura_user', JSON.stringify(user));
};

// ============================================
// API HELPER FUNCTIONS
// ============================================

// Base fetch function with auth headers
const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add auth token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
};

// ============================================
// AUTH API CALLS
// ============================================

// Register new user
export const registerUser = async (
  email: string,
  password: string,
  name?: string
): Promise<AuthResponse> => {
  const response = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Registration failed');
  }

  // Save token and user
  setToken(data.data.token);
  setUser(data.data.user);

  return data;
};

// Login user
export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const response = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Login failed');
  }

  // Save token and user
  setToken(data.data.token);
  setUser(data.data.user);

  return data;
};

// Get current user
export const getCurrentUser = async (): Promise<User> => {
  const response = await apiFetch('/auth/me');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to get user');
  }

  return data.data;
};

// Logout
export const logoutUser = (): void => {
  removeToken();
};

// Check if user is logged in
export const isAuthenticated = (): boolean => {
  return !!getToken();
};