import { apiClient, setToken, removeToken } from './client';
import type { LoginRequest, LoginResponse, User } from '../types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/login', credentials);
    setToken(response.token);
    return response;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/logout');
    removeToken();
  },

  me: () => apiClient.get<{ user: User }>('/me'),
};
