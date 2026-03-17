import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth';
import { getToken, removeToken } from '../api/client';
import { ApiError } from '../api/client';
import type { AuthState } from '../types';
import { AuthContext } from './authContextDef';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: getToken(),
    isAuthenticated: false,
    isLoading: true,
  });

  const fetchUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const response = await authApi.me();
      setState({
        user: response.user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      removeToken();
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setState({
      user: response.user,
      token: response.token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401)) {
        throw error;
      }
    } finally {
      removeToken();
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
