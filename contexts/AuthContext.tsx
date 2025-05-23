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
      console.log('🔄 Initializing auth...');
      setLoading(true);
      
      try {
        // Check if user is in localStorage
        if (isAuthenticated()) {
          console.log('✅ Token found in localStorage');
          const storedUser = getUser();
          
          if (storedUser) {
            console.log('👤 User found in localStorage:', storedUser.email);
            setUser(storedUser);
          } else {
            console.log('👤 No user in localStorage, fetching from API...');
            try {
              // If token exists but no user, fetch user
              const currentUser = await authService.getCurrentUser();
              console.log('✅ User fetched from API:', currentUser.email);
              setUser(currentUser);
            } catch (fetchError) {
              console.error('❌ Failed to fetch user from API:', fetchError);
              // Clear invalid token
              authService.logout();
              setUser(null);
            }
          }
          
          // If on a public route, redirect to dashboard
          if (publicRoutes.includes(pathname || '')) {
            console.log('🔄 On public route while authenticated, redirecting to dashboard');
            router.push('/dashboard');
          }
        } else {
          console.log('❌ No token found');
          setUser(null);
          
          // If not authenticated and not on a public route, redirect to login
          if (!publicRoutes.includes(pathname || '')) {
            console.log('🔄 Not authenticated and not on public route, redirecting to login');
            router.push('/auth/login');
          }
        }
      } catch (err) {
        console.error('❌ Auth initialization error:', err);
        // Clear any potentially invalid auth state
        authService.logout();
        setUser(null);
        setError('Authentication failed. Please log in again.');
      } finally {
        setLoading(false);
        console.log('✅ Auth initialization complete');
      }
    };
    
    initAuth();
  }, [pathname, router]);

  // Login function
  const login = async (email: string, password: string) => {
    console.log('🔐 Starting login process for:', email);
    setLoading(true);
    setError(null);
    
    try {
      const loggedInUser = await authService.login(email, password);
      console.log('✅ Login successful:', loggedInUser.email);
      setUser(loggedInUser);
      
      // Force a small delay to ensure token is stored
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('🔄 Redirecting to dashboard');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('❌ Login error:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Invalid email or password';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    console.log('🚪 Logging out user');
    authService.logout();
    setUser(null);
    setError(null);
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