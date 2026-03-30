import { apiClient } from './client';
import type {
  Attachment,
  AttachmentSignedUrl,
  PaginatedResponse,
  ApiMessageResponse,
} from '../types';

export const attachmentsApi = {
  /** Upload a file (POST /api/attachments) */
  upload: (formData: FormData) =>
    apiClient.post<Attachment>('/attachments', formData),

  /** List attachments for a task (GET /api/tasks/{task}/attachments-v2) */
  listByTask: (taskId: number, params?: string) =>
    apiClient.getPage<PaginatedResponse<Attachment>>(
      `/tasks/${taskId}/attachments-v2${params ? `?${params}` : ''}`,
    ),

  /** List attachments for an area (GET /api/areas/{area}/attachments) */
  listByArea: (areaId: number, params?: string) =>
    apiClient.getPage<PaginatedResponse<Attachment>>(
      `/areas/${areaId}/attachments${params ? `?${params}` : ''}`,
    ),

  /** Get a signed URL for viewing/downloading (GET /api/attachments/{id}/signed-url) */
  getSignedUrl: (id: number, download = false) =>
    apiClient.get<AttachmentSignedUrl>(
      `/attachments/${id}/signed-url${download ? '?download=true' : ''}`,
    ),

  /** Delete an attachment (DELETE /api/attachments/{id}) */
  delete: (id: number) =>
    apiClient.delete<ApiMessageResponse>(`/attachments/${id}`),
};
