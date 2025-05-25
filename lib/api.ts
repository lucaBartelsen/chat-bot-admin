// lib/api.ts - Complete enhanced version with creator statistics
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Create an axios instance
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Function to get token - this will be called fresh each time
const getStoredToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    console.log('🔑 Getting fresh token from localStorage:', token ? 'FOUND' : 'NOT FOUND');
    if (token) {
      console.log('🔑 Token preview:', token.substring(0, 50) + '...');
    }
    return token;
  }
  return null;
};

// Request interceptor for adding auth token
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('🚀 Making API request to:', config.method?.toUpperCase(), config.url);
    
    // Get fresh token each time a request is made
    const token = getStoredToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Authorization header added:', `Bearer ${token.substring(0, 50)}...`);
    } else {
      console.log('❌ No token found - request will be sent without Authorization header');
      // Remove Authorization header if no token
      delete config.headers.Authorization;
    }
    
    console.log('📤 Request headers:', {
      'Content-Type': config.headers['Content-Type'],
      'Authorization': config.headers.Authorization ? `Bearer ${token?.substring(0, 20)}...` : 'NOT SET'
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config?.method?.toUpperCase(), response.config?.url);
    return response;
  },
  (error: AxiosError) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response?.status === 401) {
      console.log('🔒 401 Unauthorized detected - clearing stored auth data');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Only redirect if we're not already on login page
        if (!window.location.pathname.includes('/auth/login')) {
          console.log('🔄 Redirecting to login page');
          window.location.href = '/auth/login';
        }
      }
    }
    
    // Handle 404 Not Found errors
    if (error.response?.status === 404) {
      console.warn('🔍 404 Not Found:', error.config?.url);
    }
    
    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      console.error('🔥 500 Internal Server Error:', error.config?.url);
    }
    
    return Promise.reject(error);
  }
);

// Enhanced error interface
interface ApiError extends Error {
  status?: number;
  data?: any;
}

// Interface for API error response
interface ApiErrorResponse {
  detail?: string;
  message?: string;
  [key: string]: any;
}

// Type guard to check if response data has error properties
const isApiErrorResponse = (data: unknown): data is ApiErrorResponse => {
  return typeof data === 'object' && data !== null;
};

// Helper function to create a better error message
const createApiError = (error: AxiosError): ApiError => {
  let errorMessage = 'An unknown error occurred';
  
  // Try to extract error message from response data
  if (error.response?.data && isApiErrorResponse(error.response.data)) {
    errorMessage = error.response.data.detail || 
                   error.response.data.message || 
                   errorMessage;
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  const apiError = new Error(errorMessage) as ApiError;
  apiError.status = error.response?.status;
  apiError.data = error.response?.data;
  
  return apiError;
};

// Reusable API methods with enhanced error handling
export const apiClient = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.get(url, config)
      .then((response: AxiosResponse<T>) => response.data)
      .catch((error: AxiosError) => {
        throw createApiError(error);
      });
  },
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.post(url, data, config)
      .then((response: AxiosResponse<T>) => response.data)
      .catch((error: AxiosError) => {
        throw createApiError(error);
      });
  },
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.put(url, data, config)
      .then((response: AxiosResponse<T>) => response.data)
      .catch((error: AxiosError) => {
        throw createApiError(error);
      });
  },
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.patch(url, data, config)
      .then((response: AxiosResponse<T>) => response.data)
      .catch((error: AxiosError) => {
        throw createApiError(error);
      });
  },
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.delete(url, config)
      .then((response: AxiosResponse<T>) => response.data)
      .catch((error: AxiosError) => {
        throw createApiError(error);
      });
  },
};

// Type definitions for API responses
interface User {
  id: number;
  email: string;
  is_active: boolean;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

interface UserPreference {
  id: number;
  user_id: number;
  openai_api_key: string | null;
  default_model: string;
  suggestion_count: number;
  selected_creators: number[] | null;
}

interface UserWithPreferences extends User {
  preferences?: UserPreference;
}

interface UsersResponse {
  items: User[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  admin_users: number;
  verified_users: number;
  unverified_users: number;
}

interface Creator {
  id: number;
  name: string;
  description: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreatorsResponse {
  items: Creator[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Enhanced Creator Stats interface
interface CreatorStats {
  creator_id: number;
  creator_name: string;
  creator_active: boolean;
  creator_description?: string | null;
  style_examples_count: number;
  response_examples_count: number;
  total_individual_responses: number;
  total_examples: number;
  conversation_count: number;
  total_requests: number; // ADDED: This was missing
  style_examples_by_category: Record<string, number>;
  response_examples_by_category: Record<string, number>;
  recent_examples: Array<{
    id: number;
    fan_message: string;
    category: string | null;
    created_at: string;
  }>;
  has_style_config: boolean;
  created_at: string;
  updated_at: string;
  stats_generated_at: string;
}

interface BulkCreatorStats {
  [creatorId: number]: {
    creator_id: number;
    creator_name: string;
    creator_active: boolean;
    style_examples_count: number;
    response_examples_count: number;
    total_examples: number;
    total_requests: number; // ADDED: This was missing here too
    created_at: string;
    updated_at: string;
  };
}

interface DashboardStats {
  total_creators: number;
  active_creators: number;
  total_style_examples: number;
  total_response_examples: number;
  total_requests: number;
  success_rate: number;
  recent_activity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  action: string;
  user_email: string;
  timestamp: string;
  details?: string;
}

interface ApiUsageMetrics {
  date: string;
  requests: number;
  success_count: number;
  error_count: number;
  avg_response_time: number;
}

// Enhanced dashboard API functions
export const dashboardApi = {
  // Get comprehensive dashboard statistics
  getDashboardStats: () => apiClient.get<DashboardStats>('/dashboard/stats'),
  
  // Get API usage metrics for a date range
  getApiUsageMetrics: (params?: {
    start_date?: string;
    end_date?: string;
    period?: 'day' | 'week' | 'month';
  }) => apiClient.get<ApiUsageMetrics[]>('/dashboard/api-usage', { params }),
  
  // Get system health information
  getSystemHealth: () => apiClient.get('/dashboard/health'),
  
  // Get recent activity logs
  getRecentActivity: (params?: {
    limit?: number;
    offset?: number;
  }) => apiClient.get<ActivityItem[]>('/dashboard/activity', { params }),
};

// User Management API functions
export const usersApi = {
  // Get all users with pagination and filtering
  getUsers: (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
    is_admin?: boolean;
  }) => apiClient.get<UsersResponse>('/users/', { params }),
  
  // Get a single user by ID with preferences
  getUser: (id: number) => apiClient.get<UserWithPreferences>(`/users/${id}`),
  
  // Create a new user
  createUser: (data: {
    email: string;
    password: string;
    is_admin?: boolean;
    is_active?: boolean;
    openai_api_key?: string;
    default_model?: string;
    suggestion_count?: number;
  }) => apiClient.post<User>('/users/', data),
  
  // Update a user
  updateUser: (id: number, data: {
    email?: string;
    is_active?: boolean;
    is_admin?: boolean;
    is_verified?: boolean;
  }) => apiClient.patch<User>(`/users/${id}`, data),
  
  // Delete a user
  deleteUser: (id: number) => apiClient.delete(`/users/${id}`),
  
  // User status management
  activateUser: (id: number) => apiClient.post<User>(`/users/${id}/activate`),
  deactivateUser: (id: number) => apiClient.post<User>(`/users/${id}/deactivate`),
  
  // Admin role management
  makeAdmin: (id: number) => apiClient.post<User>(`/users/${id}/make-admin`),
  removeAdmin: (id: number) => apiClient.post<User>(`/users/${id}/remove-admin`),
  
  // Password management
  resetPassword: (id: number, data: { new_password: string }) => 
    apiClient.post(`/users/${id}/reset-password`, data),
  
  // User preferences
  getUserPreferences: (id: number) => apiClient.get<UserPreference>(`/users/${id}/preferences`),
  updateUserPreferences: (id: number, data: Partial<UserPreference>) => 
    apiClient.patch<UserPreference>(`/users/${id}/preferences`, data),
  
  // Statistics and bulk operations
  getUserStats: () => apiClient.get<UserStats>('/users/stats/summary'),
  bulkActivateUsers: (userIds: number[]) => apiClient.post('/users/bulk-activate', userIds),
  bulkDeactivateUsers: (userIds: number[]) => apiClient.post('/users/bulk-deactivate', userIds),
};

// Enhanced Creators API functions with statistics
export const creatorsApi = {
  // Get all creators with pagination and filtering
  getCreators: (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }) => apiClient.get<CreatorsResponse>('/creators', { params }),
  
  // Get a single creator by ID
  getCreator: (id: number) => apiClient.get<Creator>(`/creators/${id}`),
  
  // Create a new creator
  createCreator: (data: any) => apiClient.post<Creator>('/creators', data),
  
  // Update a creator
  updateCreator: (id: number, data: any) => apiClient.patch<Creator>(`/creators/${id}`, data),
  
  // Delete a creator
  deleteCreator: (id: number) => apiClient.delete(`/creators/${id}`),
  
  // Get creator style
  getCreatorStyle: (id: number) => apiClient.get(`/creators/${id}/style`),
  
  // Update creator style
  updateCreatorStyle: (id: number, data: any) => apiClient.patch(`/creators/${id}/style`, data),
  
  // Create creator style
  createCreatorStyle: (id: number, data: any) => apiClient.post(`/creators/${id}/style`, data),
  
  // Get style examples for a creator
  getStyleExamples: (id: number, params?: {
    skip?: number;
    limit?: number;
    category?: string;
    search?: string;
  }) => apiClient.get(`/creators/${id}/style-examples`, { params }),
  
  // Get response examples for a creator
  getResponseExamples: (id: number, params?: {
    skip?: number;
    limit?: number;
    category?: string;
    search?: string;
  }) => apiClient.get(`/creators/${id}/response-examples`, { params }),
  
  // NEW: Enhanced Statistics Endpoints
  getCreatorStats: (id: number) => apiClient.get<CreatorStats>(`/creators/${id}/stats`),
  
  getBulkCreatorStats: (creatorIds: number[]) => 
    apiClient.post<BulkCreatorStats>('/creators/bulk-stats', creatorIds),
  
  // Legacy statistics (keep for backward compatibility)
  getCreatorStatistics: (id: number) => apiClient.get(`/creators/${id}/statistics`),
  getCreatorCategories: (id: number) => apiClient.get(`/creators/${id}/categories`),
  
  // Creator status management
  activateCreator: (id: number) => apiClient.post<Creator>(`/creators/${id}/activate`),
  deactivateCreator: (id: number) => apiClient.post<Creator>(`/creators/${id}/deactivate`),
};

// Authentication API functions
export const authApi = {
  // Login user
  login: (credentials: { username: string; password: string }) => 
    apiClient.post('/auth/login', credentials, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }),
  
  // Register user (admin only)
  register: (data: { email: string; password: string }) => 
    apiClient.post('/auth/register', data),
  
  // Get current user
  getCurrentUser: () => apiClient.get('/auth/me'),
  
  // Get user preferences
  getUserPreferences: () => apiClient.get('/auth/preferences'),
  
  // Update user preferences
  updateUserPreferences: (preferences: any) => 
    apiClient.patch('/auth/preferences', preferences),
};

// Suggestions API functions
export const suggestionsApi = {
  // Get AI suggestions
  getSuggestions: (data: {
    creator_id: number;
    fan_message: string;
    model?: string;
    suggestion_count?: number;
    use_similar_conversations?: boolean;
    similarity_threshold?: number;
  }) => apiClient.post('/suggestions', data),
  
  // Get suggestion statistics
  getStats: () => apiClient.get('/suggestions/stats'),
  
  // Clear stored vectors
  clearVectors: (creator_id?: number) => 
    apiClient.post('/suggestions/clear', { creator_id }),
  
  // Store feedback
  storeFeedback: (data: {
    creator_id: number;
    fan_message: string;
    selected_response: string;
  }) => apiClient.post('/suggestions/store-feedback', data),
};

// Enhanced suggestions API with more statistics
export const enhancedSuggestionsApi = {
  ...suggestionsApi, // Extend existing suggestionsApi
  
  // Get detailed statistics
  getDetailedStats: () => apiClient.get('/suggestions/stats/detailed'),
  
  // Get usage analytics
  getUsageAnalytics: (params?: {
    start_date?: string;
    end_date?: string;
    creator_id?: number;
  }) => apiClient.get('/suggestions/analytics', { params }),
  
  // Get performance metrics
  getPerformanceMetrics: () => apiClient.get('/suggestions/performance'),
};


// Examples API functions (style and response examples)
export const examplesApi = {
  // Style Examples
  createStyleExample: (creatorId: number, data: {
    fan_message: string;
    creator_response: string;
    category?: string;
  }) => apiClient.post(`/creators/${creatorId}/style-examples`, data),
  
  updateStyleExample: (creatorId: number, exampleId: number, data: any) => 
    apiClient.patch(`/creators/${creatorId}/style-examples/${exampleId}`, data),
  
  deleteStyleExample: (creatorId: number, exampleId: number) => 
    apiClient.delete(`/creators/${creatorId}/style-examples/${exampleId}`),
  
  bulkCreateStyleExamples: (creatorId: number, examples: any[]) => 
    apiClient.post(`/creators/${creatorId}/bulk-style-examples`, examples),
  
  // Response Examples
  createResponseExample: (creatorId: number, data: {
    fan_message: string;
    responses: Array<{
      response_text: string;
      ranking?: number;
    }>;
    category?: string;
  }) => apiClient.post(`/creators/${creatorId}/response-examples`, data),
  
  getResponseExample: (creatorId: number, exampleId: number) => 
    apiClient.get(`/creators/${creatorId}/response-examples/${exampleId}`),
  
  deleteResponseExample: (creatorId: number, exampleId: number) => 
    apiClient.delete(`/creators/${creatorId}/response-examples/${exampleId}`),
  
  bulkCreateResponseExamples: (creatorId: number, examples: any[]) => 
    apiClient.post(`/creators/${creatorId}/bulk-response-examples`, examples),
  
  // Similarity search
  findSimilarStyleExamples: (creatorId: number, data: {
    fan_message: string;
    category?: string;
    similarity_threshold?: number;
    limit?: number;
  }) => apiClient.post(`/creators/${creatorId}/similar-style-examples`, data),
  
  findSimilarResponseExamples: (creatorId: number, data: {
    fan_message: string;
    category?: string;
    similarity_threshold?: number;
    limit?: number;
  }) => apiClient.post(`/creators/${creatorId}/similar-response-examples`, data),
};

// Health and diagnostics API functions
export const diagnosticsApi = {
  // Health check
  healthCheck: () => apiClient.get('/health'),
  
  // System information
  getSystemInfo: () => apiClient.get('/diagnostics/info'),
  
  // Database diagnostics
  getDatabaseDiagnostics: () => apiClient.get('/diagnostics/database'),
  
  // Routes information
  getRoutes: () => apiClient.get('/diagnostics/routes'),
  
  // OpenAPI schema
  getOpenApiSchema: () => apiClient.get('/diagnostics/openapi'),
};

// Export the organized API object for easy access
export const api = {
  users: usersApi,
  creators: creatorsApi,
  auth: authApi,
  dashboard: dashboardApi,
  suggestions: enhancedSuggestionsApi,
  examples: examplesApi,
  diagnostics: diagnosticsApi,
};

// Export types for use in components
export type {
  DashboardStats,
  ActivityItem,
  ApiUsageMetrics,
  User,
  UserPreference,
  UserWithPreferences,
  UsersResponse,
  UserStats,
  Creator,
  CreatorsResponse,
  CreatorStats,
  BulkCreatorStats,
  ApiError,
};

// Export the axios instance for direct use if needed
export { axiosInstance };

// Default export is the apiClient for backward compatibility
export default apiClient;