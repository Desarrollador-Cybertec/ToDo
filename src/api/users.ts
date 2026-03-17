import { apiClient } from './client';
import type {
  ApiResponse,
  ApiMessageResponse,
  User,
  CreateUserRequest,
  UpdateUserRequest,
} from '../types';

export const usersApi = {
  list: () => apiClient.get<ApiResponse<User[]>>('/users'),

  get: (id: number) => apiClient.get<ApiResponse<User>>(`/users/${id}`),

  create: (data: CreateUserRequest) =>
    apiClient.post<ApiResponse<User>>('/users', data),

  update: (id: number, data: UpdateUserRequest) =>
    apiClient.put<ApiResponse<User>>(`/users/${id}`, data),

  changeRole: (id: number, roleId: number) =>
    apiClient.patch<ApiMessageResponse>(`/users/${id}/role`, { role_id: roleId }),

  toggleActive: (id: number) =>
    apiClient.patch<ApiMessageResponse>(`/users/${id}/toggle-active`),
};
