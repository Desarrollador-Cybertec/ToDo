import type { User } from './user';
import type { Area } from './area';
import type { Meeting } from './meeting';
import type {
  TaskStatusType,
  TaskPriorityType,
  CommentTypeValue,
  AttachmentTypeValue,
  UpdateTypeValue,
} from './enums';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatusType;
  priority: TaskPriorityType;
  due_date: string | null;
  start_date: string | null;
  progress_percent: number;
  requires_attachment: boolean;
  requires_completion_comment: boolean;
  requires_manager_approval: boolean;
  requires_completion_notification: boolean;
  requires_due_date: boolean;
  requires_progress_report: boolean;
  notify_on_due: boolean;
  notify_on_overdue: boolean;
  notify_on_completion: boolean;
  meeting_id: number | null;
  assigned_to_user_id: number | null;
  assigned_to_area_id: number | null;
  current_responsible_user_id: number | null;
  area_id: number | null;
  external_email: string | null;
  external_name: string | null;
  created_by: number;
  closed_by: number | null;
  cancelled_by: number | null;
  creator: User;
  assigned_user: User | null;
  assigned_area: Area | null;
  delegator: User | null;
  current_responsible: User | null;
  area: Area | null;
  meeting: Meeting | null;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  status_history: TaskStatusHistory[];
  delegations: TaskDelegation[];
  updates: TaskUpdate[];
  age_days: number;
  days_without_update: number;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  comment: string;
  type: CommentTypeValue;
  user: User;
  created_at: string;
}

export interface TaskAttachment {
  id: number;
  task_id: number;
  uploaded_by: number;
  file_name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  attachment_type: AttachmentTypeValue;
  user: User;
  created_at: string;
}

export interface TaskStatusHistory {
  id: number;
  task_id: number;
  changed_by: number;
  from_status: TaskStatusType | null;
  to_status: TaskStatusType;
  note: string | null;
  user: User;
  created_at: string;
}

export interface TaskDelegation {
  id: number;
  task_id: number;
  from_user: User;
  to_user: User;
  note: string | null;
  created_at: string;
}

export interface TaskUpdate {
  id: number;
  task_id: number;
  user_id: number;
  update_type: UpdateTypeValue;
  comment: string | null;
  progress_percent: number | null;
  user: User;
  created_at: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: TaskPriorityType;
  due_date?: string;
  start_date?: string;
  assigned_to_user_id?: number;
  assigned_to_area_id?: number;
  external_email?: string;
  external_name?: string;
  meeting_id?: number;
  requires_attachment?: boolean;
  requires_completion_comment?: boolean;
  requires_manager_approval?: boolean;
  requires_completion_notification?: boolean;
  requires_due_date?: boolean;
  requires_progress_report?: boolean;
  notify_on_due?: boolean;
  notify_on_overdue?: boolean;
  notify_on_completion?: boolean;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriorityType;
  due_date?: string;
  start_date?: string;
  requires_attachment?: boolean;
  requires_completion_comment?: boolean;
  requires_manager_approval?: boolean;
  requires_completion_notification?: boolean;
  requires_due_date?: boolean;
  requires_progress_report?: boolean;
  notify_on_due?: boolean;
  notify_on_overdue?: boolean;
  notify_on_completion?: boolean;
}

export interface DelegateTaskRequest {
  to_user_id: number;
  note?: string;
}

export interface ApproveTaskRequest {
  note?: string;
}

export interface RejectTaskRequest {
  note: string;
}

export interface AddCommentRequest {
  comment: string;
  type?: 'comment' | 'progress' | 'completion_note';
}

export interface AddUpdateRequest {
  update_type: UpdateTypeValue;
  comment?: string;
  progress_percent?: number;
}
