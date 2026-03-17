import { apiClient } from './client';
import type {
  ApiResponse,
  GeneralDashboard,
  AreaDashboard,
  ConsolidatedDashboard,
  PersonalDashboard,
} from '../types';

export const dashboardApi = {
  general: () =>
    apiClient.get<ApiResponse<GeneralDashboard>>('/dashboard/general'),

  area: (id: number) =>
    apiClient.get<ApiResponse<AreaDashboard>>(`/dashboard/area/${id}`),

  consolidated: () =>
    apiClient.get<ApiResponse<ConsolidatedDashboard>>('/dashboard/consolidated'),

  personal: () =>
    apiClient.get<ApiResponse<PersonalDashboard>>('/dashboard/me'),
};
