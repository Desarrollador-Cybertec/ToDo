import { apiClient } from './client';
import type {
  ApiMessageResponse,
  Area,
  AreaMember,
  CreateAreaRequest,
  UpdateAreaRequest,
  ClaimWorkerRequest,
} from '../types';

export const areasApi = {
  list: () => apiClient.get<Area[]>('/areas'),

  get: (id: number) => apiClient.get<Area>(`/areas/${id}`),

  create: (data: CreateAreaRequest) =>
    apiClient.post<Area>('/areas', data),

  update: (id: number, data: UpdateAreaRequest) =>
    apiClient.put<Area>(`/areas/${id}`, data),

  assignManager: (id: number, managerUserId: number) =>
    apiClient.patch<ApiMessageResponse>(`/areas/${id}/manager`, {
      manager_user_id: managerUserId,
    }),

  members: (id: number) =>
    apiClient.get<AreaMember[]>(`/areas/${id}/members`),

  claimWorker: (data: ClaimWorkerRequest) =>
    apiClient.post<ApiMessageResponse>('/areas/claim-worker', data),
};
