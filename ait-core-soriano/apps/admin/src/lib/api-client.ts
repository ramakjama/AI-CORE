import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { API_BASE_URL, HTTP_STATUS, STORAGE_KEYS } from '@/utils/constants';
import type { ApiResponse, ApiError } from '@/types';

/**
 * Production-Ready API Client
 * Handles all HTTP requests with authentication, error handling, and retry logic
 */
class ApiClient {
  private client: AxiosInstance;
  private retryAttempts = 3;
  private retryDelay = 1000;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: number };

        // Handle 401 Unauthorized
        if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
          this.clearAuthToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }

        // Retry logic for network errors and 5xx errors
        if (this.shouldRetry(error) && (!originalRequest._retry || originalRequest._retry < this.retryAttempts)) {
          originalRequest._retry = (originalRequest._retry || 0) + 1;
          await this.delay(this.retryDelay * originalRequest._retry);
          return this.client(originalRequest);
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  /**
   * Check if request should be retried
   */
  private shouldRetry(error: AxiosError): boolean {
    if (!error.response) return true; // Network error
    const status = error.response.status;
    return status >= 500 && status < 600; // Server errors
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Format error for consistent error handling
   */
  private formatError(error: AxiosError): ApiError {
    if (error.response) {
      const data = error.response.data as any;
      return {
        code: data?.code || `HTTP_${error.response.status}`,
        message: data?.message || error.message,
        details: data?.details,
      };
    }

    if (error.request) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error. Please check your connection.',
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
    };
  }

  /**
   * Get authentication token
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Clear authentication token
   */
  private clearAuthToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Set authentication token
   */
  public setAuthToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  /**
   * Generic GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generic POST request
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generic PUT request
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generic PATCH request
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload file
   */
  async upload<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// API endpoint functions
export const api = {
  // Authentication
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiClient.post('/auth/login', credentials),
    logout: () => apiClient.post('/auth/logout'),
    refresh: () => apiClient.post('/auth/refresh'),
    getCurrentUser: () => apiClient.get('/auth/me'),
  },

  // Users
  users: {
    getAll: (params?: any) => apiClient.get('/users', { params }),
    getById: (id: string) => apiClient.get(`/users/${id}`),
    create: (data: any) => apiClient.post('/users', data),
    update: (id: string, data: any) => apiClient.put(`/users/${id}`, data),
    delete: (id: string) => apiClient.delete(`/users/${id}`),
    updatePassword: (id: string, data: any) => apiClient.patch(`/users/${id}/password`, data),
  },

  // Modules
  modules: {
    getAll: (params?: any) => apiClient.get('/modules', { params }),
    getById: (id: string) => apiClient.get(`/modules/${id}`),
    create: (data: any) => apiClient.post('/modules', data),
    update: (id: string, data: any) => apiClient.put(`/modules/${id}`, data),
    delete: (id: string) => apiClient.delete(`/modules/${id}`),
    updateStatus: (id: string, status: string) => apiClient.patch(`/modules/${id}/status`, { status }),
    execute: (id: string, params?: any) => apiClient.post(`/modules/${id}/execute`, params),
    getMetrics: (id: string) => apiClient.get(`/modules/${id}/metrics`),
  },

  // Agents
  agents: {
    getAll: (params?: any) => apiClient.get('/agents', { params }),
    getById: (id: string) => apiClient.get(`/agents/${id}`),
    create: (data: any) => apiClient.post('/agents', data),
    update: (id: string, data: any) => apiClient.put(`/agents/${id}`, data),
    delete: (id: string) => apiClient.delete(`/agents/${id}`),
    updateStatus: (id: string, status: string) => apiClient.patch(`/agents/${id}/status`, { status }),
    getTasks: (id: string) => apiClient.get(`/agents/${id}/tasks`),
    assignTask: (id: string, task: any) => apiClient.post(`/agents/${id}/tasks`, task),
    getMetrics: (id: string) => apiClient.get(`/agents/${id}/metrics`),
  },

  // System
  system: {
    getHealth: () => apiClient.get('/system/health'),
    getMetrics: (params?: any) => apiClient.get('/system/metrics', { params }),
    getAlerts: (params?: any) => apiClient.get('/system/alerts', { params }),
    acknowledgeAlert: (id: string) => apiClient.patch(`/system/alerts/${id}/acknowledge`),
    getComponents: () => apiClient.get('/system/components'),
    getLogs: (params?: any) => apiClient.get('/system/logs', { params }),
  },

  // Activity Logs
  activityLogs: {
    getAll: (params?: any) => apiClient.get('/activity-logs', { params }),
    getByUser: (userId: string, params?: any) => apiClient.get(`/activity-logs/user/${userId}`, { params }),
  },

  // Dashboard
  dashboard: {
    getOverview: () => apiClient.get('/dashboard/overview'),
    getStats: (timeRange?: string) => apiClient.get('/dashboard/stats', { params: { timeRange } }),
    getChartData: (type: string, timeRange?: string) =>
      apiClient.get(`/dashboard/charts/${type}`, { params: { timeRange } }),
  },

  // Settings
  settings: {
    getAll: () => apiClient.get('/settings'),
    update: (data: any) => apiClient.put('/settings', data),
    getByKey: (key: string) => apiClient.get(`/settings/${key}`),
    updateByKey: (key: string, value: any) => apiClient.put(`/settings/${key}`, { value }),
  },
};

export default apiClient;
