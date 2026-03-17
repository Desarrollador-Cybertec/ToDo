import { apiClient } from './client';
import type {
  ApiMessageResponse,
  SystemSetting,
  MessageTemplate,
  UpdateMessageTemplateRequest,
} from '../types';

export const settingsApi = {
  listSettings: (group?: string) =>
    apiClient.get<SystemSetting[]>(`/settings${group ? `?group=${group}` : ''}`),

  updateSettings: (settings: { key: string; value: string }[]) =>
    apiClient.put<ApiMessageResponse>('/settings', { settings }),

  listTemplates: () =>
    apiClient.get<MessageTemplate[]>('/message-templates'),

  updateTemplate: (id: number, data: UpdateMessageTemplateRequest) =>
    apiClient.put<MessageTemplate>(`/message-templates/${id}`, data),
};

export const automationApi = {
  detectOverdue: () =>
    apiClient.post<ApiMessageResponse>('/automation/detect-overdue'),

  sendDailySummary: () =>
    apiClient.post<ApiMessageResponse>('/automation/send-summary'),

  sendDueReminders: () =>
    apiClient.post<ApiMessageResponse>('/automation/send-reminders'),

  detectInactive: () =>
    apiClient.post<ApiMessageResponse>('/automation/detect-inactivity'),
};

export const importApi = {
  importTasks: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<ApiMessageResponse>('/import/tasks', formData);
  },
};
