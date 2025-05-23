import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Create an axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
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
    return Promise.reject(error);
  }
);

// Reusable API methods
export const apiClient = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return api.get(url, config).then((response: AxiosResponse<T>) => response.data);
  },
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return api.post(url, data, config).then((response: AxiosResponse<T>) => response.data);
  },
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return api.put(url, data, config).then((response: AxiosResponse<T>) => response.data);
  },
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return api.patch(url, data, config).then((response: AxiosResponse<T>) => response.data);
  },
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return api.delete(url, config).then((response: AxiosResponse<T>) => response.data);
  },
};

// Export the axios instance for direct use if needed
export default api;