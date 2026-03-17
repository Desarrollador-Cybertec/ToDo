import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence } from 'framer-motion';
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
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineRefresh,
} from 'react-icons/hi';
import { PageTransition, FadeIn, SlideDown, StaggerList, StaggerItem } from '../../components/ui';
import { SkeletonDetail, Badge, STATUS_BADGE_VARIANT, PRIORITY_BADGE_VARIANT } from '../../components/ui';

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
      setTask(res);
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

  const commentForm = useForm<AddCommentFormData>({ resolver: zodResolver(addCommentSchema) });
  const onComment = async (data: AddCommentFormData) => {
    await handleAction(() => tasksApi.addComment(taskId, data), 'Comentario agregado');
    commentForm.reset();
    setShowCommentForm(false);
  };

  const updateForm = useForm<AddUpdateFormData>({ resolver: zodResolver(addUpdateSchema), defaultValues: { update_type: 'progress' } });
  const onUpdate = async (data: AddUpdateFormData) => {
    await handleAction(() => tasksApi.addUpdate(taskId, { ...data, progress_percent: data.progress_percent ?? undefined }), 'Avance reportado');
    updateForm.reset();
    setShowUpdateForm(false);
  };

  const rejectForm = useForm<RejectTaskFormData>({ resolver: zodResolver(rejectTaskSchema) });
  const onReject = async (data: RejectTaskFormData) => {
    await handleAction(() => tasksApi.reject(taskId, data), 'Tarea rechazada');
    rejectForm.reset();
    setShowRejectForm(false);
  };

  const reviewForm = useForm<SubmitReviewFormData>({ resolver: zodResolver(submitReviewSchema) });
  const onSubmitReview = async (data: SubmitReviewFormData) => {
    await handleAction(() => tasksApi.submitReview(taskId, data), 'Tarea enviada a revisión');
    reviewForm.reset();
    setShowReviewForm(false);
  };

  const delegateForm = useForm<DelegateTaskFormData>({ resolver: zodResolver(delegateTaskSchema) });
  const onDelegate = async (data: DelegateTaskFormData) => {
    await handleAction(() => tasksApi.delegate(taskId, data), 'Tarea delegada');
    delegateForm.reset();
    setShowDelegateForm(false);
  };

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
        setAreaMembers(res);
      } catch {
        setAreaMembers([]);
      }
    }
  };

  if (loading) return <SkeletonDetail />;
  if (!task) return null;

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl">
        <button type="button" onClick={() => navigate('/tasks')} className="mb-4 flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900">
          <HiOutlineArrowLeft className="h-4 w-4" /> Volver a tareas
        </button>

        <AnimatePresence>
          {actionError && (
            <SlideDown>
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600 ring-1 ring-inset ring-red-200">
                <HiOutlineExclamationCircle className="h-4 w-4 shrink-0" />
                {actionError}
              </div>
            </SlideDown>
          )}
          {actionSuccess && (
            <SlideDown>
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-600 ring-1 ring-inset ring-green-200">
                <HiOutlineCheckCircle className="h-4 w-4 shrink-0" />
                {actionSuccess}
              </div>
            </SlideDown>
          )}
        </AnimatePresence>

        {/* Task Header */}
        <FadeIn className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
              {task.description && <p className="mt-2 text-gray-600">{task.description}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={STATUS_BADGE_VARIANT[task.status]} size="md">
                {TASK_STATUS_LABELS[task.status]}
              </Badge>
              <Badge variant={PRIORITY_BADGE_VARIANT[task.priority]} size="md">
                {TASK_PRIORITY_LABELS[task.priority]}
              </Badge>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Creado por</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-medium text-blue-600">{task.creator?.name?.charAt(0) ?? '?'}</span>
                <p className="text-sm text-gray-900">{task.creator?.name ?? 'Desconocido'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Responsable</p>
              <div className="mt-1 flex items-center gap-2">
                {task.current_responsible ? (
                  <>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-medium text-indigo-600">{task.current_responsible.name.charAt(0)}</span>
                    <p className="text-sm text-gray-900">{task.current_responsible.name}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Sin asignar</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Área</p>
              <p className="mt-1 text-sm text-gray-900">{task.area?.name ?? task.assigned_area?.name ?? 'Sin área'}</p>
            </div>
            {task.due_date && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Fecha límite</p>
                <p className={`mt-1 flex items-center gap-1.5 text-sm ${task.is_overdue ? 'font-medium text-red-600' : 'text-gray-900'}`}>
                  <HiOutlineClock className="h-4 w-4" />
                  {new Date(task.due_date).toLocaleDateString('es-PE')}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Avance</p>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-linear-to-r from-blue-500 to-indigo-500 transition-all duration-500" style={{ width: `${task.progress_percent}%` }} />
                </div>
                <span className="text-sm font-semibold text-gray-900">{task.progress_percent}%</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Antigüedad</p>
              <p className="mt-1 text-sm text-gray-900">{task.age_days} días</p>
            </div>
            {task.meeting && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Reunión de origen</p>
                <p className="mt-1 text-sm text-gray-900">{task.meeting.title}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-gray-100 pt-4">
            {canStart && (
              <button type="button" onClick={() => handleAction(() => tasksApi.start(taskId), 'Tarea iniciada')} className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-700 active:scale-[0.98]">
                <HiOutlinePlay className="h-4 w-4" /> Iniciar
              </button>
            )}
            {canSubmitReview && (
              <button type="button" onClick={() => setShowReviewForm(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-purple-700 active:scale-[0.98]">
                <HiOutlinePencil className="h-4 w-4" /> Enviar a revisión
              </button>
            )}
            {canApprove && (
              <button type="button" onClick={() => handleAction(() => tasksApi.approve(taskId), 'Tarea aprobada')} className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-700 active:scale-[0.98]">
                <HiOutlineCheck className="h-4 w-4" /> Aprobar
              </button>
            )}
            {canReject && (
              <button type="button" onClick={() => setShowRejectForm(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-red-700 active:scale-[0.98]">
                <HiOutlineX className="h-4 w-4" /> Rechazar
              </button>
            )}
            {canDelegate && (
              <button type="button" onClick={handleDelegateOpen} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                <HiOutlineRefresh className="h-4 w-4" /> Delegar
              </button>
            )}
            {canUpdate && (
              <button type="button" onClick={() => setShowUpdateForm(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                Reportar avance
              </button>
            )}
            {canUpload && (
              <button type="button" onClick={() => setShowUploadForm(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                <HiOutlineUpload className="h-4 w-4" /> Adjuntar
              </button>
            )}
            <button type="button" onClick={() => setShowCommentForm(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
              <HiOutlineChatAlt className="h-4 w-4" /> Comentar
            </button>
            {canCancel && (
              <button type="button" onClick={() => handleAction(() => tasksApi.cancel(taskId), 'Tarea cancelada')} className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50">
                Cancelar tarea
              </button>
            )}
          </div>
        </FadeIn>

        {/* Modal forms */}
        <AnimatePresence>
          {showCommentForm && (
            <SlideDown className="mt-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-3 font-semibold text-gray-900">Agregar comentario</h3>
                <form onSubmit={commentForm.handleSubmit(onComment)} className="space-y-3">
                  <textarea {...commentForm.register('comment')} rows={3} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Escribe tu comentario..." />
                  {commentForm.formState.errors.comment && <p className="text-sm text-red-500">{commentForm.formState.errors.comment.message}</p>}
                  <div className="flex gap-2">
                    <button type="submit" disabled={commentForm.formState.isSubmitting} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Enviar</button>
                    <button type="button" onClick={() => setShowCommentForm(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
                  </div>
                </form>
              </div>
            </SlideDown>
          )}

          {showUpdateForm && (
            <SlideDown className="mt-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-3 font-semibold text-gray-900">Reportar avance</h3>
                <form onSubmit={updateForm.handleSubmit(onUpdate)} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <select {...updateForm.register('update_type')} className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
                      <option value="progress">Progreso</option>
                      <option value="evidence">Evidencia</option>
                      <option value="note">Nota</option>
                    </select>
                    <input type="number" {...updateForm.register('progress_percent', { valueAsNumber: true })} min={0} max={100} placeholder="% avance" className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
                  </div>
                  <textarea {...updateForm.register('comment')} rows={3} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" placeholder="Describe el avance..." />
                  <div className="flex gap-2">
                    <button type="submit" disabled={updateForm.formState.isSubmitting} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Reportar</button>
                    <button type="button" onClick={() => setShowUpdateForm(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
                  </div>
                </form>
              </div>
            </SlideDown>
          )}

          {showReviewForm && (
            <SlideDown className="mt-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-3 font-semibold text-gray-900">Enviar a revisión</h3>
                <form onSubmit={reviewForm.handleSubmit(onSubmitReview)} className="space-y-3">
                  <textarea {...reviewForm.register('completion_comment')} rows={3} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" placeholder="Comentario de cierre (opcional)..." />
                  <div className="flex gap-2">
                    <button type="submit" disabled={reviewForm.formState.isSubmitting} className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50">Enviar</button>
                    <button type="button" onClick={() => setShowReviewForm(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
                  </div>
                </form>
              </div>
            </SlideDown>
          )}

          {showRejectForm && (
            <SlideDown className="mt-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-3 font-semibold text-gray-900">Rechazar tarea</h3>
                <form onSubmit={rejectForm.handleSubmit(onReject)} className="space-y-3">
                  <textarea {...rejectForm.register('rejection_note')} rows={3} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" placeholder="Motivo del rechazo..." />
                  {rejectForm.formState.errors.rejection_note && <p className="text-sm text-red-500">{rejectForm.formState.errors.rejection_note.message}</p>}
                  <div className="flex gap-2">
                    <button type="submit" disabled={rejectForm.formState.isSubmitting} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">Rechazar</button>
                    <button type="button" onClick={() => setShowRejectForm(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
                  </div>
                </form>
              </div>
            </SlideDown>
          )}

          {showDelegateForm && (
            <SlideDown className="mt-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-3 font-semibold text-gray-900">Delegar tarea</h3>
                <form onSubmit={delegateForm.handleSubmit(onDelegate)} className="space-y-3">
                  <select {...delegateForm.register('to_user_id', { valueAsNumber: true })} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
                    <option value="">Seleccionar trabajador</option>
                    {areaMembers.filter(m => m.role.slug === 'worker').map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  {delegateForm.formState.errors.to_user_id && <p className="text-sm text-red-500">{delegateForm.formState.errors.to_user_id.message}</p>}
                  <textarea {...delegateForm.register('note')} rows={2} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" placeholder="Nota (opcional)..." />
                  <div className="flex gap-2">
                    <button type="submit" disabled={delegateForm.formState.isSubmitting} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Delegar</button>
                    <button type="button" onClick={() => setShowDelegateForm(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
                  </div>
                </form>
              </div>
            </SlideDown>
          )}

          {showUploadForm && (
            <SlideDown className="mt-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-3 font-semibold text-gray-900">Subir archivo</h3>
                <div className="space-y-3">
                  <select value={attachmentType} onChange={(e) => setAttachmentType(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
                    <option value="evidence">Evidencia</option>
                    <option value="support">Soporte</option>
                    <option value="final_delivery">Entrega final</option>
                  </select>
                  <input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-600 hover:file:bg-blue-100" />
                  <div className="flex gap-2">
                    <button type="button" onClick={onUpload} disabled={!uploadFile} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">Subir</button>
                    <button type="button" onClick={() => setShowUploadForm(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
                  </div>
                </div>
              </div>
            </SlideDown>
          )}
        </AnimatePresence>

      {/* Comments */}
      {(task.comments ?? []).length > 0 && (
        <FadeIn delay={0.1} className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <HiOutlineChatAlt className="h-5 w-5 text-blue-500" /> Comentarios
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">{(task.comments ?? []).length}</span>
          </h3>
          <StaggerList className="space-y-3">
            {(task.comments ?? []).map((c) => (
              <StaggerItem key={c.id}>
                <div className="rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">{c.user?.name?.charAt(0) ?? '?'}</span>
                      <span className="text-sm font-medium text-gray-900">{c.user?.name ?? 'Desconocido'}</span>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString('es-PE')}</span>
                  </div>
                  <p className="mt-2 pl-9 text-sm text-gray-700">{c.comment}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </FadeIn>
      )}

      {/* Attachments */}
      {(task.attachments ?? []).length > 0 && (
        <FadeIn delay={0.15} className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <HiOutlinePaperClip className="h-5 w-5 text-indigo-500" /> Adjuntos
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">{(task.attachments ?? []).length}</span>
          </h3>
          <StaggerList className="space-y-2">
            {(task.attachments ?? []).map((a) => (
              <StaggerItem key={a.id}>
                <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100/80">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                      <HiOutlinePaperClip className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.file_name}</p>
                      <p className="text-xs text-gray-500">{a.user?.name ?? 'Desconocido'} · <Badge variant="gray" size="sm">{a.attachment_type}</Badge></p>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </FadeIn>
      )}

      {/* Status History */}
      {(task.status_history ?? []).length > 0 && (
        <FadeIn delay={0.2} className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Historial de estados</h3>
          <div className="relative ml-3 border-l-2 border-gray-200 pl-6">
            {(task.status_history ?? []).map((h, index) => (
              <div key={h.id} className={`relative pb-4 ${index === (task.status_history ?? []).length - 1 ? 'pb-0' : ''}`}>
                <div className="absolute -left-7.75 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 ring-4 ring-white">
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {h.from_status ? (
                      <>
                        <Badge variant={STATUS_BADGE_VARIANT[h.from_status]} size="sm">{TASK_STATUS_LABELS[h.from_status]}</Badge>
                        <span className="mx-1.5 text-gray-400">→</span>
                      </>
                    ) : null}
                    <Badge variant={STATUS_BADGE_VARIANT[h.to_status]} size="sm">{TASK_STATUS_LABELS[h.to_status]}</Badge>
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{h.user?.name ?? 'Sistema'} · {new Date(h.created_at).toLocaleString('es-PE')}</p>
                  {h.note && <p className="mt-1 text-xs text-gray-600">{h.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      )}

      {/* Updates */}
      {(task.updates ?? []).length > 0 && (
        <FadeIn delay={0.25} className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Reportes de avance</h3>
          <StaggerList className="space-y-3">
            {(task.updates ?? []).map((u) => (
              <StaggerItem key={u.id}>
                <div className="rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-600">{u.user?.name?.charAt(0) ?? '?'}</span>
                      <span className="text-sm font-medium text-gray-900">{u.user?.name ?? 'Desconocido'}</span>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(u.created_at).toLocaleString('es-PE')}</span>
                  </div>
                  <div className="mt-2 pl-9">
                    {u.progress_percent !== null && (
                      <div className="mb-1 flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-gray-200">
                          <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${u.progress_percent}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-green-600">{u.progress_percent}%</span>
                      </div>
                    )}
                    {u.comment && <p className="text-sm text-gray-700">{u.comment}</p>}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </FadeIn>
      )}
      </div>
    </PageTransition>
  );
}
