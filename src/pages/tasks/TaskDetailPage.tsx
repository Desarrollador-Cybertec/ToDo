import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tasksApi } from '../../api/tasks';
import { useAuth } from '../../context/useAuth';
import { ApiError } from '../../api/client';
import {
  Role,
  TaskStatus,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
} from '../../types/enums';
import {
  addCommentSchema,
  addUpdateSchema,
  rejectTaskSchema,
  submitReviewSchema,
  delegateTaskSchema,
  type AddCommentFormData,
  type AddUpdateFormData,
  type RejectTaskFormData,
  type SubmitReviewFormData,
  type DelegateTaskFormData,
} from '../../schemas';
import type { Task, User } from '../../types';
import { usersApi } from '../../api/users';
import {
  HiOutlineArrowLeft,
  HiOutlinePaperClip,
  HiOutlineChatAlt,
  HiOutlinePlay,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlinePencil,
  HiOutlineUpload,
} from 'react-icons/hi';

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showDelegateForm, setShowDelegateForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [areaMembers, setAreaMembers] = useState<User[]>([]);

  const taskId = Number(id);

  const loadTask = useCallback(async () => {
    try {
      const res = await tasksApi.get(taskId);
      setTask(res.data);
    } catch {
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  }, [taskId, navigate]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const showMessage = (msg: string) => {
    setActionSuccess(msg);
    setActionError('');
    setTimeout(() => setActionSuccess(''), 3000);
  };

  const handleAction = async (action: () => Promise<unknown>, successMsg: string) => {
    setActionError('');
    try {
      await action();
      showMessage(successMsg);
      loadTask();
    } catch (error) {
      setActionError(error instanceof ApiError ? error.data.message : 'Error al ejecutar la acción');
    }
  };

  const isSuperAdmin = user?.role.slug === Role.SUPERADMIN;
  const isManager = user?.role.slug === Role.AREA_MANAGER;
  const isResponsible = task?.current_responsible_user_id === user?.id;

  const canStart = isResponsible && task?.status === TaskStatus.PENDING;
  const canSubmitReview = isResponsible && task?.status === TaskStatus.IN_PROGRESS;
  const canApprove = (isSuperAdmin || isManager) && task?.status === TaskStatus.IN_REVIEW;
  const canReject = (isSuperAdmin || isManager) && task?.status === TaskStatus.IN_REVIEW;
  const canCancel = isSuperAdmin && task?.status !== TaskStatus.COMPLETED && task?.status !== TaskStatus.CANCELLED;
  const canDelegate = (isSuperAdmin || isManager) && task?.status !== TaskStatus.COMPLETED && task?.status !== TaskStatus.CANCELLED;
  const canUpdate = isResponsible && task?.status === TaskStatus.IN_PROGRESS;
  const canUpload = isResponsible || isSuperAdmin || isManager;

  // Comment form
  const commentForm = useForm<AddCommentFormData>({ resolver: zodResolver(addCommentSchema) });
  const onComment = async (data: AddCommentFormData) => {
    await handleAction(() => tasksApi.addComment(taskId, data), 'Comentario agregado');
    commentForm.reset();
    setShowCommentForm(false);
  };

  // Update form
  const updateForm = useForm<AddUpdateFormData>({ resolver: zodResolver(addUpdateSchema), defaultValues: { update_type: 'progress' } });
  const onUpdate = async (data: AddUpdateFormData) => {
    await handleAction(() => tasksApi.addUpdate(taskId, { ...data, progress_percent: data.progress_percent ?? undefined }), 'Avance reportado');
    updateForm.reset();
    setShowUpdateForm(false);
  };

  // Reject form
  const rejectForm = useForm<RejectTaskFormData>({ resolver: zodResolver(rejectTaskSchema) });
  const onReject = async (data: RejectTaskFormData) => {
    await handleAction(() => tasksApi.reject(taskId, data), 'Tarea rechazada');
    rejectForm.reset();
    setShowRejectForm(false);
  };

  // Submit review form
  const reviewForm = useForm<SubmitReviewFormData>({ resolver: zodResolver(submitReviewSchema) });
  const onSubmitReview = async (data: SubmitReviewFormData) => {
    await handleAction(() => tasksApi.submitReview(taskId, data), 'Tarea enviada a revisión');
    reviewForm.reset();
    setShowReviewForm(false);
  };

  // Delegate form
  const delegateForm = useForm<DelegateTaskFormData>({ resolver: zodResolver(delegateTaskSchema) });
  const onDelegate = async (data: DelegateTaskFormData) => {
    await handleAction(() => tasksApi.delegate(taskId, data), 'Tarea delegada');
    delegateForm.reset();
    setShowDelegateForm(false);
  };

  // File upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [attachmentType, setAttachmentType] = useState('evidence');
  const onUpload = async () => {
    if (!uploadFile) return;
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('attachment_type', attachmentType);
    await handleAction(() => tasksApi.uploadAttachment(taskId, formData), 'Archivo subido');
    setUploadFile(null);
    setShowUploadForm(false);
  };

  const handleDelegateOpen = async () => {
    setShowDelegateForm(true);
    if (task?.area_id) {
      try {
        const res = await usersApi.list();
        setAreaMembers(res.data);
      } catch {
        setAreaMembers([]);
      }
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  if (!task) return null;

  const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    pending_assignment: 'bg-yellow-100 text-yellow-700',
    pending: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-indigo-100 text-indigo-700',
    in_review: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    cancelled: 'bg-gray-100 text-gray-500',
    overdue: 'bg-red-100 text-red-800',
  };

  return (
    <div className="mx-auto max-w-4xl">
      <button type="button" onClick={() => navigate('/tasks')} className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
        <HiOutlineArrowLeft className="h-4 w-4" /> Volver a tareas
      </button>

      {actionError && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{actionError}</div>}
      {actionSuccess && <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">{actionSuccess}</div>}

      {/* Task Header */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
            {task.description && <p className="mt-2 text-gray-600">{task.description}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[task.status]}`}>
              {TASK_STATUS_LABELS[task.status]}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
              {TASK_PRIORITY_LABELS[task.priority]}
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Creado por</p>
            <p className="text-sm text-gray-900">{task.creator.name}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Responsable</p>
            <p className="text-sm text-gray-900">{task.current_responsible?.name ?? 'Sin asignar'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Área</p>
            <p className="text-sm text-gray-900">{task.area?.name ?? task.assigned_area?.name ?? 'Sin área'}</p>
          </div>
          {task.due_date && (
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">Fecha límite</p>
              <p className={`text-sm ${task.is_overdue ? 'font-medium text-red-600' : 'text-gray-900'}`}>
                {new Date(task.due_date).toLocaleDateString('es-PE')}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Avance</p>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-gray-200">
                <div className="h-2 rounded-full bg-blue-600" style={{ width: `${task.progress_percent}%` }} />
              </div>
              <span className="text-sm font-medium text-gray-900">{task.progress_percent}%</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Antigüedad</p>
            <p className="text-sm text-gray-900">{task.age_days} días</p>
          </div>
          {task.meeting && (
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">Reunión de origen</p>
              <p className="text-sm text-gray-900">{task.meeting.title}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-2 border-t pt-4">
          {canStart && (
            <button type="button" onClick={() => handleAction(() => tasksApi.start(taskId), 'Tarea iniciada')} className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
              <HiOutlinePlay className="h-4 w-4" /> Iniciar
            </button>
          )}
          {canSubmitReview && (
            <button type="button" onClick={() => setShowReviewForm(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
              <HiOutlinePencil className="h-4 w-4" /> Enviar a revisión
            </button>
          )}
          {canApprove && (
            <button type="button" onClick={() => handleAction(() => tasksApi.approve(taskId), 'Tarea aprobada')} className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
              <HiOutlineCheck className="h-4 w-4" /> Aprobar
            </button>
          )}
          {canReject && (
            <button type="button" onClick={() => setShowRejectForm(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
              <HiOutlineX className="h-4 w-4" /> Rechazar
            </button>
          )}
          {canDelegate && (
            <button type="button" onClick={handleDelegateOpen} className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Delegar
            </button>
          )}
          {canUpdate && (
            <button type="button" onClick={() => setShowUpdateForm(true)} className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Reportar avance
            </button>
          )}
          {canUpload && (
            <button type="button" onClick={() => setShowUploadForm(true)} className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              <HiOutlineUpload className="h-4 w-4" /> Adjuntar
            </button>
          )}
          <button type="button" onClick={() => setShowCommentForm(true)} className="inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <HiOutlineChatAlt className="h-4 w-4" /> Comentar
          </button>
          {canCancel && (
            <button type="button" onClick={() => handleAction(() => tasksApi.cancel(taskId), 'Tarea cancelada')} className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
              Cancelar tarea
            </button>
          )}
        </div>
      </div>

      {/* Modal forms */}
      {showCommentForm && (
        <div className="mt-4 rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold text-gray-900">Agregar comentario</h3>
          <form onSubmit={commentForm.handleSubmit(onComment)} className="space-y-3">
            <textarea {...commentForm.register('comment')} rows={3} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" placeholder="Escribe tu comentario..." />
            {commentForm.formState.errors.comment && <p className="text-sm text-red-500">{commentForm.formState.errors.comment.message}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={commentForm.formState.isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Enviar</button>
              <button type="button" onClick={() => setShowCommentForm(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {showUpdateForm && (
        <div className="mt-4 rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold text-gray-900">Reportar avance</h3>
          <form onSubmit={updateForm.handleSubmit(onUpdate)} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <select {...updateForm.register('update_type')} className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
                <option value="progress">Progreso</option>
                <option value="evidence">Evidencia</option>
                <option value="note">Nota</option>
              </select>
              <input type="number" {...updateForm.register('progress_percent', { valueAsNumber: true })} min={0} max={100} placeholder="% avance" className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
            </div>
            <textarea {...updateForm.register('comment')} rows={3} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" placeholder="Describe el avance..." />
            <div className="flex gap-2">
              <button type="submit" disabled={updateForm.formState.isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Reportar</button>
              <button type="button" onClick={() => setShowUpdateForm(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {showReviewForm && (
        <div className="mt-4 rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold text-gray-900">Enviar a revisión</h3>
          <form onSubmit={reviewForm.handleSubmit(onSubmitReview)} className="space-y-3">
            <textarea {...reviewForm.register('completion_comment')} rows={3} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" placeholder="Comentario de cierre (opcional)..." />
            <div className="flex gap-2">
              <button type="submit" disabled={reviewForm.formState.isSubmitting} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">Enviar</button>
              <button type="button" onClick={() => setShowReviewForm(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {showRejectForm && (
        <div className="mt-4 rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold text-gray-900">Rechazar tarea</h3>
          <form onSubmit={rejectForm.handleSubmit(onReject)} className="space-y-3">
            <textarea {...rejectForm.register('rejection_note')} rows={3} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" placeholder="Motivo del rechazo..." />
            {rejectForm.formState.errors.rejection_note && <p className="text-sm text-red-500">{rejectForm.formState.errors.rejection_note.message}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={rejectForm.formState.isSubmitting} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">Rechazar</button>
              <button type="button" onClick={() => setShowRejectForm(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {showDelegateForm && (
        <div className="mt-4 rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold text-gray-900">Delegar tarea</h3>
          <form onSubmit={delegateForm.handleSubmit(onDelegate)} className="space-y-3">
            <select {...delegateForm.register('user_id', { valueAsNumber: true })} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
              <option value="">Seleccionar trabajador</option>
              {areaMembers.filter(m => m.role.slug === 'worker').map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            {delegateForm.formState.errors.user_id && <p className="text-sm text-red-500">{delegateForm.formState.errors.user_id.message}</p>}
            <textarea {...delegateForm.register('note')} rows={2} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" placeholder="Nota (opcional)..." />
            <div className="flex gap-2">
              <button type="submit" disabled={delegateForm.formState.isSubmitting} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Delegar</button>
              <button type="button" onClick={() => setShowDelegateForm(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {showUploadForm && (
        <div className="mt-4 rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-3 font-semibold text-gray-900">Subir archivo</h3>
          <div className="space-y-3">
            <select value={attachmentType} onChange={(e) => setAttachmentType(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
              <option value="evidence">Evidencia</option>
              <option value="support">Soporte</option>
              <option value="final_delivery">Entrega final</option>
            </select>
            <input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} className="w-full text-sm text-gray-600" />
            <div className="flex gap-2">
              <button type="button" onClick={onUpload} disabled={!uploadFile} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Subir</button>
              <button type="button" onClick={() => setShowUploadForm(false)} className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Comments */}
      {task.comments.length > 0 && (
        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <HiOutlineChatAlt className="h-5 w-5" /> Comentarios ({task.comments.length})
          </h3>
          <div className="space-y-3">
            {task.comments.map((c) => (
              <div key={c.id} className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{c.user.name}</span>
                  <span className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString('es-PE')}</span>
                </div>
                <p className="mt-1 text-sm text-gray-700">{c.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachments */}
      {task.attachments.length > 0 && (
        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <HiOutlinePaperClip className="h-5 w-5" /> Adjuntos ({task.attachments.length})
          </h3>
          <div className="space-y-2">
            {task.attachments.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{a.file_name}</p>
                  <p className="text-xs text-gray-500">{a.user.name} · {a.attachment_type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status History */}
      {task.status_history.length > 0 && (
        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Historial de estados</h3>
          <div className="space-y-3">
            {task.status_history.map((h) => (
              <div key={h.id} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500" />
                <div>
                  <p className="text-sm text-gray-900">
                    {h.from_status ? `${TASK_STATUS_LABELS[h.from_status]} → ` : ''}
                    {TASK_STATUS_LABELS[h.to_status]}
                  </p>
                  <p className="text-xs text-gray-500">{h.user.name} · {new Date(h.created_at).toLocaleString('es-PE')}</p>
                  {h.note && <p className="mt-1 text-xs text-gray-600">{h.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Updates */}
      {task.updates.length > 0 && (
        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Reportes de avance</h3>
          <div className="space-y-3">
            {task.updates.map((u) => (
              <div key={u.id} className="rounded-lg bg-gray-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{u.user.name}</span>
                  <span className="text-xs text-gray-500">{new Date(u.created_at).toLocaleString('es-PE')}</span>
                </div>
                {u.progress_percent !== null && <p className="text-sm text-blue-600">Avance: {u.progress_percent}%</p>}
                {u.comment && <p className="mt-1 text-sm text-gray-700">{u.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
