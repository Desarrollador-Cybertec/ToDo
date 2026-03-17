import { apiClient } from './client';
import type {
  ApiResponse,
  ApiMessageResponse,
  SystemSetting,
  UpdateSettingRequest,
  MessageTemplate,
  UpdateMessageTemplateRequest,
} from '../types';

export const settingsApi = {
  listSettings: () =>
    apiClient.get<ApiResponse<SystemSetting[]>>('/settings'),

  updateSetting: (id: number, data: UpdateSettingRequest) =>
    apiClient.put<ApiResponse<SystemSetting>>(`/settings/${id}`, data),

  listTemplates: () =>
    apiClient.get<ApiResponse<MessageTemplate[]>>('/message-templates'),

  updateTemplate: (id: number, data: UpdateMessageTemplateRequest) =>
    apiClient.put<ApiResponse<MessageTemplate>>(`/message-templates/${id}`, data),
};

export const automationApi = {
  detectOverdue: () =>
    apiClient.post<ApiMessageResponse>('/automation/detect-overdue'),

  sendDailySummary: () =>
    apiClient.post<ApiMessageResponse>('/automation/send-daily-summary'),

  sendDueReminders: () =>
    apiClient.post<ApiMessageResponse>('/automation/send-due-reminders'),

  detectInactive: () =>
    apiClient.post<ApiMessageResponse>('/automation/detect-inactive'),
};

export const importApi = {
  importTasks: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<ApiMessageResponse>('/import/tasks', formData);
  },
};
