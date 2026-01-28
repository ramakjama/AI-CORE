// Auth Hook
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useWebSocketStore } from '@/store/websocket-store';

export function useAuth(requireAuth: boolean = false) {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    checkAuth,
    clearError,
  } = useAuthStore();
  const { connect: connectWS, disconnect: disconnectWS } = useWebSocketStore();

  useEffect(() => {
    const initAuth = async () => {
      if (!isAuthenticated && requireAuth) {
        const isValid = await checkAuth();
        if (!isValid) {
          router.push('/auth/login');
        } else if (user) {
          // Connect WebSocket after successful auth
          const token = localStorage.getItem('accessToken');
          if (token) {
            connectWS(user.id, token);
          }
        }
      }
    };

    initAuth();
  }, [isAuthenticated, requireAuth, checkAuth, router, user, connectWS]);

  const handleLogin = async (email: string, password: string, rememberMe?: boolean) => {
    try {
      await login({ email, password, rememberMe });
      const token = localStorage.getItem('accessToken');
      const currentUser = useAuthStore.getState().user;
      if (token && currentUser) {
        connectWS(currentUser.id, token);
      }
    } catch (error) {
      throw error;
    }
  };

  const handleLogout = async () => {
    disconnectWS();
    await logout();
    router.push('/auth/login');
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    register,
    logout: handleLogout,
    clearError,
  };
}
