import { apiClient } from './client';
import type {
  ApiResponse,
  Meeting,
  CreateMeetingRequest,
  UpdateMeetingRequest,
  ApiMessageResponse,
} from '../types';

export const meetingsApi = {
  list: () => apiClient.get<ApiResponse<Meeting[]>>('/meetings'),

  get: (id: number) => apiClient.get<ApiResponse<Meeting>>(`/meetings/${id}`),

  create: (data: CreateMeetingRequest) =>
    apiClient.post<ApiResponse<Meeting>>('/meetings', data),

  update: (id: number, data: UpdateMeetingRequest) =>
    apiClient.put<ApiResponse<Meeting>>(`/meetings/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiMessageResponse>(`/meetings/${id}`),
};
