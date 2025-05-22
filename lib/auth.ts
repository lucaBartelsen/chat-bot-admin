// lib/auth.ts - Updated implementation

import { apiClient } from './api';

// Types
export interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface UserPreference {
  id: number;
  user_id: number;
  openai_api_key: string | null;
  default_model: string;
  suggestion_count: number;
  selected_creators: number[] | null;
}

// Store user data in localStorage
export const storeUser = (user: User) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// Get user data from localStorage
export const getUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
      }
    }
  }
  return null;
};

// Store token in localStorage
export const storeToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

// Get token from localStorage
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// Authentication service
const authService = {
  // Login user
  login: async (email: string, password: string): Promise<User> => {
    try {
      // Use the OAuth2 compatible endpoint format
      const loginResponse = await apiClient.post<LoginResponse>('/auth/login', 
        new URLSearchParams({
          username: email,
          password: password,
        }), 
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      
      // Store token
      storeToken(loginResponse.access_token);
      
      // Get user profile
      const user = await apiClient.get<User>('/auth/me');
      
      // Store user
      storeUser(user);
      
      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  // Register user (admin only)
  register: async (email: string, password: string): Promise<User> => {
    try {
      return await apiClient.post<User>('/auth/register', { email, password });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },
  
  // Get current user
  getCurrentUser: async (): Promise<User> => {
    try {
      const user = await apiClient.get<User>('/auth/me');
      storeUser(user); // Update stored user data
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },
  
  // Get user preferences
  getUserPreferences: async (): Promise<UserPreference> => {
    try {
      return await apiClient.get<UserPreference>('/auth/preferences');
    } catch (error) {
      console.error('Get user preferences error:', error);
      throw error;
    }
  },
  
  // Update user preferences
  updateUserPreferences: async (preferences: Partial<UserPreference>): Promise<UserPreference> => {
    try {
      return await apiClient.patch<UserPreference>('/auth/preferences', preferences);
    } catch (error) {
      console.error('Update user preferences error:', error);
      throw error;
    }
  },
  
  // Logout user
  logout: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
  },
};

export default authService;