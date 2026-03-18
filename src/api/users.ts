import { apiClient } from './client';
import type {
  ApiMessageResponse,
  PaginatedResponse,
  User,
  CreateUserRequest,
  UpdateUserRequest,
} from '../types';

export const usersApi = {
  list: (page = 1) => apiClient.getPage<PaginatedResponse<User>>(`/users?page=${page}`),

  // All users across all pages – for select dropdowns
  listAll: async (): Promise<User[]> => {
    const first = await apiClient.getPage<PaginatedResponse<User>>('/users?page=1');
    if (first.meta.last_page <= 1) return first.data;
    const rest = await Promise.all(
      Array.from({ length: first.meta.last_page - 1 }, (_, i) =>
        apiClient.getPage<PaginatedResponse<User>>(`/users?page=${i + 2}`).then((r) => r.data),
      ),
    );
    return [...first.data, ...rest.flat()];
  },

  get: (id: number) => apiClient.get<User>(`/users/${id}`),

  create: (data: CreateUserRequest) =>
    apiClient.post<User>('/users', data),

  update: (id: number, data: UpdateUserRequest) =>
    apiClient.put<User>(`/users/${id}`, data),

  changeRole: (id: number, roleId: number) =>
    apiClient.patch<ApiMessageResponse>(`/users/${id}/role`, { role_id: roleId }),

  toggleActive: (id: number) =>
    apiClient.patch<ApiMessageResponse>(`/users/${id}/toggle-active`),
};
