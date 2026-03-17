import { apiClient } from './client';
import type {
  ApiResponse,
  ApiMessageResponse,
  Area,
  CreateAreaRequest,
  UpdateAreaRequest,
  ClaimWorkerRequest,
} from '../types';

export const areasApi = {
  list: () => apiClient.get<ApiResponse<Area[]>>('/areas'),

  get: (id: number) => apiClient.get<ApiResponse<Area>>(`/areas/${id}`),

  create: (data: CreateAreaRequest) =>
    apiClient.post<ApiResponse<Area>>('/areas', data),

  update: (id: number, data: UpdateAreaRequest) =>
    apiClient.put<ApiResponse<Area>>(`/areas/${id}`, data),

  assignManager: (id: number, managerUserId: number) =>
    apiClient.patch<ApiMessageResponse>(`/areas/${id}/manager`, {
      manager_user_id: managerUserId,
    }),

  claimWorker: (data: ClaimWorkerRequest) =>
    apiClient.post<ApiMessageResponse>('/areas/claim-worker', data),
};
