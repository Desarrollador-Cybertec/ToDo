import { z } from 'zod';
import { TaskPriority, UpdateType } from '../types/enums';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(255),
  description: z.string().max(5000).optional().or(z.literal('')),
  priority: z.enum(
    [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.URGENT],
    { message: 'Selecciona una prioridad' },
  ),
  due_date: z.string().optional().or(z.literal('')),
  start_date: z.string().optional().or(z.literal('')),
  assigned_to_user_id: z.number().int().positive().optional().nullable(),
  assigned_to_area_id: z.number().int().positive().optional().nullable(),
  meeting_id: z.number().int().positive().optional().nullable(),
  requires_attachment: z.boolean().default(false),
  requires_completion_comment: z.boolean().default(false),
  requires_manager_approval: z.boolean().default(true),
  requires_completion_notification: z.boolean().default(false),
  requires_due_date: z.boolean().default(false),
  requires_progress_report: z.boolean().default(false),
  notify_on_due: z.boolean().default(true),
  notify_on_overdue: z.boolean().default(true),
  notify_on_completion: z.boolean().default(false),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(255),
  description: z.string().max(5000).optional().or(z.literal('')),
  priority: z.enum(
    [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.URGENT],
    { message: 'Selecciona una prioridad' },
  ),
  due_date: z.string().optional().or(z.literal('')),
  start_date: z.string().optional().or(z.literal('')),
});

export const delegateTaskSchema = z.object({
  to_user_id: z.number({ message: 'Selecciona un trabajador' }).int().positive(),
  note: z.string().max(1000).optional().or(z.literal('')),
});

export const submitReviewSchema = z.object({
  completion_comment: z.string().max(2000).optional().or(z.literal('')),
});

export const rejectTaskSchema = z.object({
  rejection_note: z.string().min(1, 'El motivo de rechazo es obligatorio').max(2000),
});

export const addCommentSchema = z.object({
  comment: z.string().min(1, 'El comentario es obligatorio').max(2000),
});

export const addUpdateSchema = z.object({
  update_type: z.enum([UpdateType.PROGRESS, UpdateType.EVIDENCE, UpdateType.NOTE], {
    message: 'Selecciona un tipo de actualización',
  }),
  comment: z.string().max(2000).optional().or(z.literal('')),
  progress_percent: z.number().min(0).max(100).optional().nullable(),
});

export type CreateTaskFormData = z.infer<typeof createTaskSchema>;
export type UpdateTaskFormData = z.infer<typeof updateTaskSchema>;
export type DelegateTaskFormData = z.infer<typeof delegateTaskSchema>;
export type SubmitReviewFormData = z.infer<typeof submitReviewSchema>;
export type RejectTaskFormData = z.infer<typeof rejectTaskSchema>;
export type AddCommentFormData = z.infer<typeof addCommentSchema>;
export type AddUpdateFormData = z.infer<typeof addUpdateSchema>;
