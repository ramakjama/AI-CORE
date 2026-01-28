import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

// Base configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Token management
let accessToken: string | null = null;
let refreshToken: string | null = null;
let tokenRefreshPromise: Promise<string> | null = null;

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== 'undefined') {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }
}

export function getAccessToken(): string | null {
  if (!accessToken && typeof window !== 'undefined') {
    accessToken = localStorage.getItem('access_token');
  }
  return accessToken;
}

export function getRefreshToken(): string | null {
  if (!refreshToken && typeof window !== 'undefined') {
    refreshToken = localStorage.getItem('refresh_token');
  }
  return refreshToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
}

// Refresh access token
async function refreshAccessToken(): Promise<string> {
  // Prevent multiple simultaneous refresh requests
  if (tokenRefreshPromise) {
    return tokenRefreshPromise;
  }

  tokenRefreshPromise = (async () => {
    try {
      const refresh = getRefreshToken();
      if (!refresh) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refresh_token: refresh,
      });

      const newAccessToken = response.data.access_token;
      const newRefreshToken = response.data.refresh_token || refresh;

      setTokens(newAccessToken, newRefreshToken);
      return newAccessToken;
    } catch (error) {
      clearTokens();
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw error;
    } finally {
      tokenRefreshPromise = null;
    }
  })();

  return tokenRefreshPromise;
}

// API Client class
export class ApiClient {
  private instance: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.instance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newAccessToken = await refreshAccessToken();
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            return this.instance(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // HTTP methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }

  // File upload
  async upload<T = any>(
    url: string,
    file: File | Blob,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    };

    return this.post<T>(url, formData, config);
  }

  // Download file
  async download(url: string, filename?: string): Promise<void> {
    const response = await this.instance.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

// Service-specific API clients
export const authApi = new ApiClient(`${API_BASE_URL}/auth`);
export const storageApi = new ApiClient(`${API_BASE_URL}/storage`);
export const documentsApi = new ApiClient(`${API_BASE_URL}/documents`);
export const mailApi = new ApiClient(`${API_BASE_URL}/mail`);
export const calendarApi = new ApiClient(`${API_BASE_URL}/calendar`);
export const tasksApi = new ApiClient(`${API_BASE_URL}/tasks`);
export const crmApi = new ApiClient(`${API_BASE_URL}/crm`);
export const analyticsApi = new ApiClient(`${API_BASE_URL}/analytics`);
export const collaborationApi = new ApiClient(`${API_BASE_URL}/collaboration`);
export const spreadsheetsApi = new ApiClient(`${API_BASE_URL}/spreadsheets`);
export const presentationsApi = new ApiClient(`${API_BASE_URL}/presentations`);
export const assistantApi = new ApiClient(`${API_BASE_URL}/assistant`);

// Default API client
export const api = new ApiClient();

// Auth API methods
export const auth = {
  login: (email: string, password: string) =>
    authApi.post('/login', { email, password }),

  register: (data: { email: string; password: string; name: string }) =>
    authApi.post('/register', data),

  logout: () => authApi.post('/logout'),

  me: () => authApi.get('/me'),

  refreshToken: (refreshToken: string) =>
    authApi.post('/refresh', { refresh_token: refreshToken }),

  forgotPassword: (email: string) =>
    authApi.post('/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    authApi.post('/reset-password', { token, password }),

  verifyEmail: (token: string) => authApi.post('/verify-email', { token }),

  changePassword: (currentPassword: string, newPassword: string) =>
    authApi.post('/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    }),
};

// Storage API methods
export const storage = {
  listFiles: (folderId?: string) =>
    storageApi.get(`/files${folderId ? `?folder_id=${folderId}` : ''}`),

  uploadFile: (file: File, folderId?: string, onProgress?: (progress: number) => void) => {
    const url = `/upload${folderId ? `?folder_id=${folderId}` : ''}`;
    return storageApi.upload(url, file, onProgress);
  },

  downloadFile: (fileId: string, filename?: string) =>
    storageApi.download(`/files/${fileId}/download`, filename),

  deleteFile: (fileId: string) => storageApi.delete(`/files/${fileId}`),

  createFolder: (name: string, parentId?: string) =>
    storageApi.post('/folders', { name, parent_id: parentId }),

  renameFile: (fileId: string, name: string) =>
    storageApi.patch(`/files/${fileId}`, { name }),

  moveFile: (fileId: string, folderId: string) =>
    storageApi.patch(`/files/${fileId}`, { folder_id: folderId }),

  shareFile: (fileId: string, userIds: string[], permission: 'view' | 'edit') =>
    storageApi.post(`/files/${fileId}/share`, { user_ids: userIds, permission }),

  getFileShares: (fileId: string) =>
    storageApi.get(`/files/${fileId}/shares`),

  searchFiles: (query: string) =>
    storageApi.get(`/search?q=${encodeURIComponent(query)}`),
};

// Documents API methods
export const documents = {
  list: () => documentsApi.get('/'),

  get: (documentId: string) => documentsApi.get(`/${documentId}`),

  create: (data: { title: string; content?: string; folderId?: string }) =>
    documentsApi.post('/', data),

  update: (documentId: string, data: { title?: string; content?: string }) =>
    documentsApi.patch(`/${documentId}`, data),

  delete: (documentId: string) => documentsApi.delete(`/${documentId}`),

  export: (documentId: string, format: 'pdf' | 'docx' | 'html') =>
    documentsApi.get(`/${documentId}/export?format=${format}`),
};

// Mail API methods
export const mail = {
  listEmails: (params?: { folder?: string; page?: number; limit?: number }) =>
    mailApi.get('/emails', { params }),

  getEmail: (emailId: string) => mailApi.get(`/emails/${emailId}`),

  sendEmail: (data: {
    to: string[];
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
    attachments?: string[];
  }) => mailApi.post('/emails/send', data),

  deleteEmail: (emailId: string) => mailApi.delete(`/emails/${emailId}`),

  markAsRead: (emailId: string) =>
    mailApi.patch(`/emails/${emailId}`, { is_read: true }),

  markAsUnread: (emailId: string) =>
    mailApi.patch(`/emails/${emailId}`, { is_read: false }),

  moveToFolder: (emailId: string, folder: string) =>
    mailApi.patch(`/emails/${emailId}`, { folder }),
};

// Calendar API methods
export const calendar = {
  listEvents: (params?: { start?: string; end?: string }) =>
    calendarApi.get('/events', { params }),

  getEvent: (eventId: string) => calendarApi.get(`/events/${eventId}`),

  createEvent: (data: {
    title: string;
    start: string;
    end: string;
    description?: string;
    location?: string;
    attendees?: string[];
  }) => calendarApi.post('/events', data),

  updateEvent: (eventId: string, data: any) =>
    calendarApi.patch(`/events/${eventId}`, data),

  deleteEvent: (eventId: string) => calendarApi.delete(`/events/${eventId}`),
};

// Tasks API methods
export const tasks = {
  listTasks: (params?: { project_id?: string; status?: string }) =>
    tasksApi.get('/tasks', { params }),

  getTask: (taskId: string) => tasksApi.get(`/tasks/${taskId}`),

  createTask: (data: {
    title: string;
    description?: string;
    due_date?: string;
    priority?: string;
    project_id?: string;
    assignee_id?: string;
  }) => tasksApi.post('/tasks', data),

  updateTask: (taskId: string, data: any) =>
    tasksApi.patch(`/tasks/${taskId}`, data),

  deleteTask: (taskId: string) => tasksApi.delete(`/tasks/${taskId}`),

  listProjects: () => tasksApi.get('/projects'),

  createProject: (data: { name: string; description?: string }) =>
    tasksApi.post('/projects', data),
};

// CRM API methods
export const crm = {
  listContacts: (params?: { page?: number; limit?: number; search?: string }) =>
    crmApi.get('/contacts', { params }),

  getContact: (contactId: string) => crmApi.get(`/contacts/${contactId}`),

  createContact: (data: {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    notes?: string;
  }) => crmApi.post('/contacts', data),

  updateContact: (contactId: string, data: any) =>
    crmApi.patch(`/contacts/${contactId}`, data),

  deleteContact: (contactId: string) => crmApi.delete(`/contacts/${contactId}`),

  addNote: (contactId: string, content: string) =>
    crmApi.post(`/contacts/${contactId}/notes`, { content }),
};

// Collaboration API methods
export const collaboration = {
  joinSession: (documentId: string) =>
    collaborationApi.post(`/sessions/${documentId}/join`),

  leaveSession: (sessionId: string) =>
    collaborationApi.post(`/sessions/${sessionId}/leave`),

  sendCursorPosition: (sessionId: string, position: any) =>
    collaborationApi.post(`/sessions/${sessionId}/cursor`, { position }),

  getActiveSessions: (documentId: string) =>
    collaborationApi.get(`/documents/${documentId}/sessions`),
};

// AI Assistant API methods
export const assistant = {
  sendMessage: (message: string, conversationId?: string) =>
    assistantApi.post('/messages', { message, conversation_id: conversationId }),

  listConversations: () => assistantApi.get('/conversations'),

  getConversation: (conversationId: string) =>
    assistantApi.get(`/conversations/${conversationId}`),

  deleteConversation: (conversationId: string) =>
    assistantApi.delete(`/conversations/${conversationId}`),

  clearHistory: () => assistantApi.delete('/conversations'),
};
