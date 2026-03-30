import type { User } from './user';

export type ProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed';
export type VisibilityScope = 'user' | 'area' | 'task' | 'system';

export const PROCESSING_STATUS_LABELS: Record<ProcessingStatus, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  ready: 'Listo',
  failed: 'Error',
};

export interface Attachment {
  id: number;
  uuid: string;
  task_id: number | null;
  area_id: number | null;
  owner_user_id: number | null;
  uploaded_by: number;
  original_name: string;
  mime_type: string;
  extension: string;
  size_original: number;
  size_processed: number | null;
  processing_status: ProcessingStatus;
  visibility_scope: VisibilityScope;
  checksum: string | null;
  metadata: Record<string, unknown> | null;
  uploader: Pick<User, 'id' | 'name'>;
  processed_at: string | null;
  uploaded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttachmentSignedUrl {
  url: string;
  expires_at: string;
}

export interface UploadAttachmentRequest {
  file: File;
  task_id?: number;
  area_id?: number;
}
