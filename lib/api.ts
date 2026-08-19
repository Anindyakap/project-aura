// lib/api.ts
// API client for communicating with backend

import { CSRF_HEADER_NAME, getCsrfToken } from '@/lib/auth/csrf';

const API_URL = '/api/v1';

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
  };
}

export interface ApiError {
  error: boolean;
  message: string;
}

// ============================================
// LEGACY TOKEN CLEANUP
// ============================================

export const clearLegacyClientAuth = (): void => {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('aura_token');
  localStorage.removeItem('aura_user');
};

// ============================================
// API HELPER FUNCTIONS
// ============================================

// Base fetch function with auth headers
const apiFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!['GET', 'HEAD', 'OPTIONS'].includes(options.method || 'GET')) {
    const csrfToken = getCsrfToken();

    if (csrfToken) {
      headers[CSRF_HEADER_NAME] = csrfToken;
    }
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'same-origin',
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
export const logoutUser = async (): Promise<void> => {
  const response = await apiFetch('/auth/logout', {
    method: 'POST',
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Logout failed');
  }

  clearLegacyClientAuth();
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

// Start Shopify OAuth without exposing the Aura session token to browser code.
export const startShopifyConnect = async (
  shop: string,
  brandId: string
): Promise<string> => {
  const response = await apiFetch('/integrations/shopify/connect', {
    method: 'POST',
    body: JSON.stringify({ shop, brandId }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to start Shopify connection');
  }

  return data.data.authorizationUrl;
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

// ============================================
// METRICS API CALLS
// ============================================

export interface MetricValue {
  value: number;
  change: number;      // % change vs previous period, e.g. 12.5 = +12.5%
  formatted: string;   // ready-to-display string e.g. "$34,221.01"
}

export interface MetricsSummary {
  period: string;
  metrics: {
    revenue:       MetricValue;
    orders:        MetricValue;
    aov:           MetricValue;
    new_customers: MetricValue;
  };
}

export interface ChartPoint {
  date: string;   // "2026-02-25"
  value: number;  // e.g. 1231.16
}

// Fetch KPI summary (revenue, orders, AOV, new customers)
export const getMetricsSummary = async (
  brandId: string
): Promise<MetricsSummary> => {
  const response = await apiFetch(`/metrics/summary?brandId=${brandId}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch metrics');
  return data.data;
};

// Fetch daily data points for charts
export const getMetricsChart = async (
  brandId: string,
  metric: 'revenue' | 'orders' | 'new_customers' = 'revenue',
  days: number = 30
): Promise<ChartPoint[]> => {
  const response = await apiFetch(
    `/metrics/chart?brandId=${brandId}&metric=${metric}&days=${days}`
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch chart data');
  return data.data.points;
};

// ============================================
// INSIGHTS API CALLS
// ============================================

export interface Insight {
  id: string;
  insight_type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action_items: string[];
  related_data: Record<string, number>;
  is_read: boolean;
  created_at: string;
}

export interface InsightsResponse {
  insights: Insight[];
  unreadCount: number;
  total: number;
}

export const getInsights = async (brandId: string): Promise<InsightsResponse> => {
  const response = await apiFetch(`/insights?brandId=${brandId}`);
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to fetch insights');
  return data.data;
};

export const markInsightAsRead = async (insightId: string): Promise<void> => {
  const response = await apiFetch(`/insights/${insightId}/read`, { method: 'PATCH' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to mark as read');
};

export const markAllInsightsAsRead = async (brandId: string): Promise<void> => {
  const response = await apiFetch(`/insights/read-all?brandId=${brandId}`, { method: 'PATCH' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Failed to mark all as read');
};
