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

// ============================================
// BRANDS API CALLS
// ============================================

// Brand type definition
export interface Brand {
  id: string;
  name: string;
  domain: string | null;
  currency: string;
  timezone: string;
  created_at: string;
}

// Get all brands for logged-in user
export const getBrands = async (): Promise<Brand[]> => {
  const response = await apiFetch('/brands');
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch brands');
  }

  return data.data; // returns Brand[]
};

// Create a new brand
export const createBrand = async (
  name: string,
  domain?: string
): Promise<Brand> => {
  const response = await apiFetch('/brands', {
    method: 'POST',
    body: JSON.stringify({ name, domain }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create brand');
  }

  return data.data;
};

// ============================================
// SHOPIFY API CALLS
// ============================================

// Check if Shopify is connected for a brand
export const getShopifyStatus = async (brandId: string): Promise<{
  connected: boolean;
  integration?: {
    platform_account_id: string;    // the shop domain e.g. mystore.myshopify.com
    platform_account_name: string;  // the store name e.g. "My Store"
    status: string;
    last_sync_at: string | null;
  };
}> => {
  const response = await apiFetch(`/integrations/shopify/status?brandId=${brandId}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch Shopify status');
  }

  return data.data;
};

// Get the Shopify connect URL (redirects to Shopify OAuth)
// We build this URL and redirect the browser to it
export const getShopifyConnectUrl = (
  shop: string,    // e.g. mystore.myshopify.com
  brandId: string
): string => {
  const token = getToken();
  // We pass the token as a query param because this is a browser redirect
  // The backend will read it before redirecting to Shopify
  return `${API_URL}/integrations/shopify/connect?shop=${shop}&brandId=${brandId}&token=${token}`;
};

// Disconnect Shopify
export const disconnectShopify = async (brandId: string): Promise<void> => {
  const response = await apiFetch('/integrations/shopify/disconnect', {
    method: 'DELETE',
    body: JSON.stringify({ brandId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to disconnect Shopify');
  }
};