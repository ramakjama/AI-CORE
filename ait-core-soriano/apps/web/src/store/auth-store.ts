// Authentication Store - Zustand
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, AuthResponse, LoginCredentials, RegisterData } from '@/types';
import { apiClient } from '@/lib/api-client';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  checkAuth: () => Promise<boolean>;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        login: async (credentials) => {
          set({ isLoading: true, error: null });
          try {
            const response = await apiClient.post<AuthResponse>('/auth/login', credentials);

            if (!response.success || !response.data) {
              throw new Error(response.error?.message || 'Login failed');
            }

            const { user, accessToken, refreshToken } = response.data;

            // Store tokens in localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('refreshToken', refreshToken);
            }

            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error: any) {
            const errorMessage = error.message || 'Login failed';
            set({
              isLoading: false,
              error: errorMessage,
              isAuthenticated: false,
            });
            throw error;
          }
        },

        register: async (data) => {
          set({ isLoading: true, error: null });
          try {
            const response = await apiClient.post<AuthResponse>('/auth/register', data);

            if (!response.success || !response.data) {
              throw new Error(response.error?.message || 'Registration failed');
            }

            const { user, accessToken, refreshToken } = response.data;

            // Store tokens in localStorage
            if (typeof window !== 'undefined') {
              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('refreshToken', refreshToken);
            }

            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error: any) {
            const errorMessage = error.message || 'Registration failed';
            set({
              isLoading: false,
              error: errorMessage,
              isAuthenticated: false,
            });
            throw error;
          }
        },

        logout: async () => {
          try {
            await apiClient.post('/auth/logout');
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            // Clear tokens from localStorage
            if (typeof window !== 'undefined') {
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
            }

            set({
              ...initialState,
            });
          }
        },

        refreshAuth: async () => {
          const { refreshToken } = get();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          try {
            const response = await apiClient.post<{ accessToken: string }>('/auth/refresh', {
              refreshToken,
            });

            if (!response.success || !response.data) {
              throw new Error('Token refresh failed');
            }

            const { accessToken } = response.data;

            // Store new access token
            if (typeof window !== 'undefined') {
              localStorage.setItem('accessToken', accessToken);
            }

            set({ accessToken });
          } catch (error) {
            console.error('Refresh token error:', error);
            get().logout();
            throw error;
          }
        },

        updateUser: (userData) => {
          set((state) => ({
            user: state.user ? { ...state.user, ...userData } : null,
          }));
        },

        setUser: (user) => set({ user }),

        setTokens: (accessToken, refreshToken) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
          }
          set({ accessToken, refreshToken });
        },

        setLoading: (loading) => set({ isLoading: loading }),

        setError: (error) => set({ error }),

        clearError: () => set({ error: null }),

        checkAuth: async () => {
          const { accessToken } = get();
          if (!accessToken) {
            set({ isAuthenticated: false });
            return false;
          }

          try {
            const response = await apiClient.get<User>('/auth/me');
            if (response.success && response.data) {
              set({
                user: response.data,
                isAuthenticated: true,
              });
              return true;
            }
            return false;
          } catch (error) {
            console.error('Auth check failed:', error);
            get().logout();
            return false;
          }
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);
