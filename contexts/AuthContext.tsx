// contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import authService, { User, isAuthenticated, getUser } from '../lib/auth';

// Interface for the context value
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Default context value
const defaultContextValue: AuthContextType = {
  user: null,
  loading: false,
  error: null,
  login: async () => {},
  logout: () => {},
  clearError: () => {},
};

// Create context
const AuthContext = createContext<AuthContextType>(defaultContextValue);

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Public routes that don't require authentication
const publicRoutes = ['/auth/login', '/auth/reset-password'];

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize user from localStorage
  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      
      try {
        // Check if user is in localStorage
        if (isAuthenticated()) {
          const storedUser = getUser();
          
          if (storedUser) {
            // If user exists in localStorage, set it in state
            setUser(storedUser);
          } else {
            // If token exists but no user, fetch user
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
          }
          
          // If on a public route, redirect to dashboard
          if (publicRoutes.includes(pathname || '')) {
            router.push('/dashboard');
          }
        } else {
          // If not authenticated and not on a public route, redirect to login
          if (!publicRoutes.includes(pathname || '')) {
            router.push('/auth/login');
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        // Clear any potentially invalid auth state
        authService.logout();
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, [pathname, router]);

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const loggedInUser = await authService.login(email, password);
      setUser(loggedInUser);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Invalid email or password');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    authService.logout();
    setUser(null);
    router.push('/auth/login');
  };

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}