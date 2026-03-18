import { apiClient } from './client';
import type {
  Area,
  AreaMember,
  ClaimWorkerResponse,
  CreateAreaRequest,
  UpdateAreaRequest,
  ClaimWorkerRequest,
  User,
  PaginatedResponse,
} from '../types';

export const areasApi = {
  list: (page = 1, active?: boolean) => {
    const params = new URLSearchParams({ page: String(page) });
    if (active !== undefined) params.append('active', active ? '1' : '0');
    return apiClient.getPage<PaginatedResponse<Area>>(`/areas?${params}`);
  },

  listAll: async (): Promise<Area[]> => {
    const first = await apiClient.getPage<PaginatedResponse<Area>>('/areas?page=1');
    if (first.meta.last_page <= 1) return first.data;
    const rest = await Promise.all(
      Array.from({ length: first.meta.last_page - 1 }, (_, i) =>
        apiClient.getPage<PaginatedResponse<Area>>(`/areas?page=${i + 2}`).then((r) => r.data),
      ),
    );
    return [...first.data, ...rest.flat()];
  },

  get: (id: number) => apiClient.get<Area>(`/areas/${id}`),

  create: (data: CreateAreaRequest) =>
    apiClient.post<Area>('/areas', data),

  update: (id: number, data: UpdateAreaRequest) =>
    apiClient.put<Area>(`/areas/${id}`, data),

  assignManager: (id: number, managerUserId: number) =>
    apiClient.patch<Area>(`/areas/${id}/manager`, {
      manager_user_id: managerUserId,
    }),

  members: (id: number, page = 1, search?: string) => {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.append('search', search);
    return apiClient.getPage<PaginatedResponse<User>>(`/areas/${id}/members?${params}`);
  },

  membersAll: async (id: number): Promise<User[]> => {
    const first = await apiClient.getPage<PaginatedResponse<User>>(`/areas/${id}/members?page=1`);
    if (first.meta.last_page <= 1) return first.data;
    const rest = await Promise.all(
      Array.from({ length: first.meta.last_page - 1 }, (_, i) =>
        apiClient.getPage<PaginatedResponse<User>>(`/areas/${id}/members?page=${i + 2}`).then((r) => r.data),
      ),
    );
    return [...first.data, ...rest.flat()];
  },

  availableWorkers: (id: number, page = 1, search?: string) => {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.append('search', search);
    return apiClient.getPage<PaginatedResponse<User>>(`/areas/${id}/available-workers?${params}`);
  },

  claimWorker: (data: ClaimWorkerRequest) =>
    apiClient.post<ClaimWorkerResponse>('/areas/claim-worker', data),
};
