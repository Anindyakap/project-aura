// contexts/AuthContext.tsx
// Global authentication state management

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, getUser, getToken, removeToken, getCurrentUser } from '@/lib/api';

// ============================================
// TYPES
// ============================================
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// ============================================
// CONTEXT
// ============================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();

      if (token) {
        try {
          // Verify token is still valid
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Token is invalid/expired
          removeToken();
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Logout function
  const logout = () => {
    removeToken();
    setUser(null);
    window.location.href = '/auth/login';
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        setUser,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}