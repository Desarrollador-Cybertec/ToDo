import { apiClient } from './client';
import type {
  Meeting,
  CreateMeetingRequest,
  UpdateMeetingRequest,
  ApiMessageResponse,
} from '../types';

export const meetingsApi = {
  list: (params?: { area_id?: number; classification?: string }) => {
    const query = new URLSearchParams();
    if (params?.area_id) query.set('area_id', String(params.area_id));
    if (params?.classification) query.set('classification', params.classification);
    const qs = query.toString();
    return apiClient.get<Meeting[]>(`/meetings${qs ? `?${qs}` : ''}`);
  },

  get: (id: number) => apiClient.get<Meeting>(`/meetings/${id}`),

  create: (data: CreateMeetingRequest) =>
    apiClient.post<Meeting>('/meetings', data),

  update: (id: number, data: UpdateMeetingRequest) =>
    apiClient.put<Meeting>(`/meetings/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<ApiMessageResponse>(`/meetings/${id}`),
};
