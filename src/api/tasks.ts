import { apiClient } from './client';
import type {
  ApiMessageResponse,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  DelegateTaskRequest,
  SubmitReviewRequest,
  RejectTaskRequest,
  AddCommentRequest,
  AddUpdateRequest,
  TaskComment,
  TaskAttachment,
  TaskUpdate,
} from '../types';

export const tasksApi = {
  list: (params?: string) =>
    apiClient.get<Task[]>(`/tasks${params ? `?${params}` : ''}`),

  get: (id: number) => apiClient.get<Task>(`/tasks/${id}`),

  create: (data: CreateTaskRequest) =>
    apiClient.post<Task>('/tasks', data),

  update: (id: number, data: UpdateTaskRequest) =>
    apiClient.put<Task>(`/tasks/${id}`, data),

  delegate: (id: number, data: DelegateTaskRequest) =>
    apiClient.post<ApiMessageResponse>(`/tasks/${id}/delegate`, data),

  start: (id: number) =>
    apiClient.post<ApiMessageResponse>(`/tasks/${id}/start`),

  submitReview: (id: number, data?: SubmitReviewRequest) =>
    apiClient.post<ApiMessageResponse>(`/tasks/${id}/submit-review`, data),

  approve: (id: number) =>
    apiClient.post<ApiMessageResponse>(`/tasks/${id}/approve`),

  reject: (id: number, data: RejectTaskRequest) =>
    apiClient.post<ApiMessageResponse>(`/tasks/${id}/reject`, data),

  cancel: (id: number) =>
    apiClient.post<ApiMessageResponse>(`/tasks/${id}/cancel`),

  addComment: (id: number, data: AddCommentRequest) =>
    apiClient.post<TaskComment>(`/tasks/${id}/comment`, data),

  uploadAttachment: (id: number, formData: FormData) =>
    apiClient.post<TaskAttachment>(`/tasks/${id}/attachments`, formData),

  addUpdate: (id: number, data: AddUpdateRequest) =>
    apiClient.post<TaskUpdate>(`/tasks/${id}/updates`, data),
};
