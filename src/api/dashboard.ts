import { apiClient } from './client';
import type {
  GeneralDashboard,
  AreaDashboard,
  ConsolidatedDashboard,
  PersonalDashboard,
} from '../types';

export const dashboardApi = {
  general: () =>
    apiClient.get<GeneralDashboard>('/dashboard/general'),

  area: (id: number) =>
    apiClient.get<AreaDashboard>(`/dashboard/area/${id}`),

  consolidated: () =>
    apiClient.get<ConsolidatedDashboard>('/dashboard/consolidated'),

  personal: () =>
    apiClient.get<PersonalDashboard>('/dashboard/me'),
};
