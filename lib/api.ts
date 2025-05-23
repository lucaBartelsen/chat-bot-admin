// lib/api.ts - Enhanced version with better error handling and logging
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Create an axios instance
const api = axios.create({
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
api.interceptors.request.use(
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
api.interceptors.response.use(
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
    return api.get(url, config)
      .then((response: AxiosResponse<T>) => response.data)
      .catch((error: AxiosError) => {
        throw createApiError(error);
      });
  },
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return api.post(url, data, config)
      .then((response: AxiosResponse<T>) => response.data)
      .catch((error: AxiosError) => {
        throw createApiError(error);
      });
  },
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return api.put(url, data, config)
      .then((response: AxiosResponse<T>) => response.data)
      .catch((error: AxiosError) => {
        throw createApiError(error);
      });
  },
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return api.patch(url, data, config)
      .then((response: AxiosResponse<T>) => response.data)
      .catch((error: AxiosError) => {
        throw createApiError(error);
      });
  },
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return api.delete(url, config)
      .then((response: AxiosResponse<T>) => response.data)
      .catch((error: AxiosError) => {
        throw createApiError(error);
      });
  },
};

// Specific API functions for common operations
export const creatorsApi = {
  // Get all creators with pagination and filtering
  getCreators: (params?: {
    skip?: number;
    limit?: number;
    search?: string;
    is_active?: boolean;
  }) => apiClient.get<{
    items: any[];
    total: number;
    page: number;
    size: number;
    pages: number;
  }>('/creators', { params }),
  
  // Get a single creator by ID
  getCreator: (id: number) => apiClient.get(`/creators/${id}`),
  
  // Create a new creator
  createCreator: (data: any) => apiClient.post('/creators', data),
  
  // Update a creator
  updateCreator: (id: number, data: any) => apiClient.patch(`/creators/${id}`, data),
  
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
};

// Export the axios instance for direct use if needed
export default api;