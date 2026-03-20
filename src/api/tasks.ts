import { apiClient } from './client';
import type {
  Task,
  PaginatedResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  DelegateTaskRequest,
  ApproveTaskRequest,
  RejectTaskRequest,
  AddCommentRequest,
  AddUpdateRequest,
  TaskComment,
  TaskAttachment,
  TaskUpdate,
  ApiMessageResponse,
} from '../types';

export const tasksApi = {
  list: (params?: string) =>
    apiClient.getPage<PaginatedResponse<Task>>(`/tasks${params ? `?${params}` : ''}`),

  get: (id: number) => apiClient.get<Task>(`/tasks/${id}`),

  create: (data: CreateTaskRequest) =>
    apiClient.post<Task>('/tasks', data),

  update: (id: number, data: UpdateTaskRequest) =>
    apiClient.put<Task>(`/tasks/${id}`, data),

  delegate: (id: number, data: DelegateTaskRequest) =>
    apiClient.post<Task>(`/tasks/${id}/delegate`, data),

  start: (id: number) =>
    apiClient.post<Task>(`/tasks/${id}/start`),

  submitReview: (id: number) =>
    apiClient.post<Task>(`/tasks/${id}/submit-review`),

  approve: (id: number, data?: ApproveTaskRequest) =>
    apiClient.post<Task>(`/tasks/${id}/approve`, data),

  reject: (id: number, data: RejectTaskRequest) =>
    apiClient.post<Task>(`/tasks/${id}/reject`, data),

  cancel: (id: number) =>
    apiClient.post<Task>(`/tasks/${id}/cancel`),

  reopen: (id: number) =>
    apiClient.post<Task>(`/tasks/${id}/reopen`),

  addComment: (id: number, data: AddCommentRequest) =>
    apiClient.post<TaskComment>(`/tasks/${id}/comment`, data),

  uploadAttachment: (id: number, formData: FormData) =>
    apiClient.post<TaskAttachment>(`/tasks/${id}/attachments`, formData),

  addUpdate: (id: number, data: AddUpdateRequest) =>
    apiClient.post<TaskUpdate>(`/tasks/${id}/updates`, data),

  claim: (id: number) =>
    apiClient.post<Task>(`/tasks/${id}/claim`),

  delete: (id: number) =>
    apiClient.delete<ApiMessageResponse>(`/tasks/${id}`),
};
