import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
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
  approveTaskSchema,
  delegateTaskSchema,
  type AddCommentFormData,
  type AddUpdateFormData,
  type RejectTaskFormData,
  type ApproveTaskFormData,
  type DelegateTaskFormData,
} from '../../schemas';
import type { Task, User } from '../../types';
import { areasApi } from '../../api/areas';
import { usersApi } from '../../api/users';
import {
  HiOutlineArrowLeft,
  HiOutlinePencil,
  HiOutlineUpload,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineRefresh,
  HiOutlineTrash,
  HiOutlineChatAlt,
} from 'react-icons/hi';
import { PageTransition, FadeIn, SlideDown } from '../../components/ui';
import { SkeletonDetail, Badge, Spinner, STATUS_BADGE_VARIANT, PRIORITY_BADGE_VARIANT } from '../../components/ui';
import { TaskStatusSelect } from '../../components/tasks/TaskStatusSelect';
import { statusProgress } from '../../utils';
import { TaskEditForm } from './components/TaskEditForm';
import {
  CommentFormPanel,
  UpdateFormPanel,
  ApproveFormPanel,
  RejectFormPanel,
  DelegateFormPanel,
  UploadFormPanel,
} from './components/TaskActionForms';
import { TaskComments } from './components/TaskComments';
import { TaskAttachments } from './components/TaskAttachments';
import { TaskStatusHistory } from './components/TaskStatusHistory';
import { TaskUpdates } from './components/TaskUpdates';

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showDelegateForm, setShowDelegateForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [areaMembers, setAreaMembers] = useState<User[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editRequiresAttachment, setEditRequiresAttachment] = useState(false);
  const [editRequiresComment, setEditRequiresComment] = useState(false);
  const [editRequiresApproval, setEditRequiresApproval] = useState(false);
  const [editRequiresNotification, setEditRequiresNotification] = useState(false);
  const [editRequiresDueDate, setEditRequiresDueDate] = useState(false);
  const [editRequiresProgress, setEditRequiresProgress] = useState(false);
  const [editNotifyDue, setEditNotifyDue] = useState(false);
  const [editNotifyOverdue, setEditNotifyOverdue] = useState(false);
  const [editNotifyCompletion, setEditNotifyCompletion] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const taskId = Number(id);

  const loadTask = useCallback(async () => {
    try {
      const res = await tasksApi.get(taskId);
      // If the backend omits the creator relation for this role, fetch it by ID
      if (!res.creator && res.created_by) {
        res.creator = await usersApi.get(res.created_by).catch(() => null) as typeof res.creator;
      }
      setTask(res);
      if (searchParams.get('edit') === '1') {
        setEditing(true);
        setEditTitle(res.title);
        setEditDescription(res.description ?? '');
        setEditPriority(res.priority);
        setEditDueDate(res.due_date?.slice(0, 10) ?? '');
        setEditStartDate(res.start_date?.slice(0, 10) ?? '');
        setEditRequiresAttachment(res.requires_attachment);
        setEditRequiresComment(res.requires_completion_comment);
        setEditRequiresApproval(res.requires_manager_approval);
        setEditRequiresNotification(res.requires_completion_notification);
        setEditRequiresDueDate(res.requires_due_date);
        setEditRequiresProgress(res.requires_progress_report);
        setEditNotifyDue(res.notify_on_due);
        setEditNotifyOverdue(res.notify_on_overdue);
        setEditNotifyCompletion(res.notify_on_completion);
      }
    } catch {
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  }, [taskId, navigate, searchParams]);

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
  const isWorker = user?.role.slug === Role.WORKER;
  const uid = Number(user?.id);
  const isResponsible =
    Number(task?.current_responsible_user_id) === uid ||
    Number(task?.current_responsible?.id) === uid ||
    Number(task?.assigned_to_user_id) === uid ||
    Number(task?.assigned_user?.id) === uid;
  const isCreator =
    Number(task?.created_by) === uid ||
    Number(task?.creator?.id) === uid;
  const terminal = [TaskStatus.COMPLETED as string, TaskStatus.CANCELLED as string];
  const isPersonalTask = !task?.area_id && !task?.assigned_to_area_id;

  const canDelete = isSuperAdmin || (isWorker && isCreator && isPersonalTask);
  // Manager cannot delegate if the task is assigned to themselves (any responsible field)
  const taskAssignedToSelf =
    (task?.assigned_to_user_id != null && Number(task.assigned_to_user_id) === uid) ||
    (task?.current_responsible_user_id != null && Number(task.current_responsible_user_id) === uid) ||
    (task?.current_responsible?.id != null && Number(task.current_responsible.id) === uid) ||
    (task?.assigned_user?.id != null && Number(task.assigned_user.id) === uid);
  // Manager can only delegate tasks in their own area — not tasks sent to a different area
  const managerOwnsTask = isManager && !taskAssignedToSelf && (
    !task?.assigned_to_area_id ||
    Number(task.assigned_to_area_id) === Number(user?.area_id) ||
    Number(task?.area_id) === Number(user?.area_id)
  );
  const canDelegate = !terminal.includes(task?.status as string) && (isSuperAdmin || managerOwnsTask);
  const isParticipant = isResponsible || isCreator || isSuperAdmin || isManager;
  const isActive = !terminal.includes(task?.status as string);
  // Only show action buttons when the task has the corresponding requires_* flag active.
  const canUpdate = isActive && !!task?.requires_progress_report && (isSuperAdmin || isManager || isResponsible);
  const canUpload = isParticipant && isActive && !!task?.requires_attachment;
  const canComment = isParticipant && isActive && !!task?.requires_completion_comment;
  const canEdit =
    ((isSuperAdmin || isManager) && isActive) ||
    (isWorker && isCreator && isPersonalTask && isActive);

  const startEditing = () => {
    if (!task) return;
    setEditTitle(task.title);
    setEditDescription(task.description ?? '');
    setEditPriority(task.priority);
    setEditDueDate(task.due_date?.slice(0, 10) ?? '');
    setEditStartDate(task.start_date?.slice(0, 10) ?? '');
    setEditRequiresAttachment(task.requires_attachment);
    setEditRequiresComment(task.requires_completion_comment);
    setEditRequiresApproval(task.requires_manager_approval);
    setEditRequiresNotification(task.requires_completion_notification);
    setEditRequiresDueDate(task.requires_due_date);
    setEditRequiresProgress(task.requires_progress_report);
    setEditNotifyDue(task.notify_on_due);
    setEditNotifyOverdue(task.notify_on_overdue);
    setEditNotifyCompletion(task.notify_on_completion);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const saveEdit = async () => {
    if (!task) return;
    setEditSaving(true);
    try {
      const updates: Record<string, string | boolean> = {};
      if (editTitle !== task.title) updates.title = editTitle;
      if ((editDescription || '') !== (task.description || '')) updates.description = editDescription;
      if (editPriority !== task.priority) updates.priority = editPriority;
      if ((editDueDate || '') !== (task.due_date?.slice(0, 10) || '')) updates.due_date = editDueDate;
      if ((editStartDate || '') !== (task.start_date?.slice(0, 10) || '')) updates.start_date = editStartDate;
      if (editRequiresAttachment !== task.requires_attachment) updates.requires_attachment = editRequiresAttachment;
      if (editRequiresComment !== task.requires_completion_comment) updates.requires_completion_comment = editRequiresComment;
      if (editRequiresApproval !== task.requires_manager_approval) updates.requires_manager_approval = editRequiresApproval;
      if (editRequiresNotification !== task.requires_completion_notification) updates.requires_completion_notification = editRequiresNotification;
      if (editRequiresDueDate !== task.requires_due_date) updates.requires_due_date = editRequiresDueDate;
      if (editRequiresProgress !== task.requires_progress_report) updates.requires_progress_report = editRequiresProgress;
      if (editNotifyDue !== task.notify_on_due) updates.notify_on_due = editNotifyDue;
      if (editNotifyOverdue !== task.notify_on_overdue) updates.notify_on_overdue = editNotifyOverdue;
      if (editNotifyCompletion !== task.notify_on_completion) updates.notify_on_completion = editNotifyCompletion;
      if (Object.keys(updates).length > 0) {
        await tasksApi.update(taskId, updates);
        showMessage('Tarea actualizada');
        loadTask();
      }
      setEditing(false);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.data.message : 'Error al actualizar');
    } finally {
      setEditSaving(false);
    }
  };

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

  const approveForm = useForm<ApproveTaskFormData>({ resolver: zodResolver(approveTaskSchema) });
  const onApprove = async (data: ApproveTaskFormData) => {
    await handleAction(() => tasksApi.approve(taskId, data.note ? { note: data.note } : undefined), 'Tarea aprobada');
    approveForm.reset();
    setShowApproveForm(false);
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

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await tasksApi.delete(taskId);
      navigate('/tasks');
    } catch (error) {
      setActionError(error instanceof ApiError ? error.data.message : 'Error al eliminar la tarea');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleDelegateOpen = async () => {
    setShowDelegateForm(true);
    setMembersLoading(true);
    try {
      if (isSuperAdmin) {
        // Superadmin can access all users; /areas/{id}/members is restricted to area owners
        const allUsers = await usersApi.listAll();
        setAreaMembers(allUsers);
      } else {
        // For manager: resolve the area THEY manage (not just any area linked to the task)
        // Resolve the area the manager owns. Backend returns manager as nested { id } not manager_user_id.
        const uid = Number(user?.id);
        let areaId: number | null = null;
        if (task?.area && (Number(task.area.manager_user_id) === uid || Number(task.area.manager?.id) === uid)) {
          areaId = task.area.id;
        } else if (task?.assigned_area && (Number(task.assigned_area.manager_user_id) === uid || Number(task.assigned_area.manager?.id) === uid)) {
          areaId = task.assigned_area.id;
        } else if (user?.area_id) {
          areaId = user.area_id;
        } else {
          // Last resort: fetch areas list and find the one this manager owns
          const areas = await areasApi.listAll();
          const managedArea = areas.find((a) => (Number(a.manager_user_id) === uid || Number(a.manager?.id) === uid) && a.active);
          areaId = managedArea?.id ?? null;
        }
        if (areaId) {
          const members = await areasApi.membersAll(areaId);
          setAreaMembers(Array.isArray(members) ? members : []);
        }
      }
    } catch {
      setAreaMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  if (loading) return <SkeletonDetail />;
  if (!task) return null;

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl">
        <button type="button" onClick={() => navigate('/tasks')} className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 transition-colors hover:text-gray-900 dark:hover:text-gray-100">
          <HiOutlineArrowLeft className="h-4 w-4" /> Volver a tareas
        </button>

        <AnimatePresence>
          {actionError && (
            <SlideDown>
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600 dark:text-red-400 ring-1 ring-inset ring-red-200 dark:ring-red-800">
                <HiOutlineExclamationCircle className="h-4 w-4 shrink-0" />
                {actionError}
              </div>
            </SlideDown>
          )}
          {actionSuccess && (
            <SlideDown>
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/30 p-3 text-sm text-green-600 dark:text-green-400 ring-1 ring-inset ring-green-200 dark:ring-green-800">
                <HiOutlineCheckCircle className="h-4 w-4 shrink-0" />
                {actionSuccess}
              </div>
            </SlideDown>
          )}
        </AnimatePresence>

        {/* Task Header */}
        <FadeIn className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <AnimatePresence mode="wait">
            {editing ? (
              <TaskEditForm
                editTitle={editTitle}
                setEditTitle={setEditTitle}
                editDescription={editDescription}
                setEditDescription={setEditDescription}
                editPriority={editPriority}
                setEditPriority={setEditPriority}
                editDueDate={editDueDate}
                setEditDueDate={setEditDueDate}
                editStartDate={editStartDate}
                setEditStartDate={setEditStartDate}
                requirementFields={isWorker ? [
                  { label: 'Requiere adjunto', value: editRequiresAttachment, set: setEditRequiresAttachment },
                  { label: 'Requiere comentario de cierre', value: editRequiresComment, set: setEditRequiresComment },
                ] : [
                  { label: 'Requiere adjunto', value: editRequiresAttachment, set: setEditRequiresAttachment },
                  { label: 'Requiere comentario de cierre', value: editRequiresComment, set: setEditRequiresComment },
                  { label: 'Requiere aprobación del encargado', value: editRequiresApproval, set: setEditRequiresApproval },
                  { label: 'Requiere fecha límite', value: editRequiresDueDate, set: setEditRequiresDueDate },
                  { label: 'Requiere reporte de avance', value: editRequiresProgress, set: setEditRequiresProgress },
                ]}
                notificationFields={isWorker ? [] : [
                  { label: 'Notificar al vencer', value: editNotifyDue, set: setEditNotifyDue },
                  { label: 'Notificar si vencida', value: editNotifyOverdue, set: setEditNotifyOverdue },
                  { label: 'Notificar al completarse', value: editNotifyCompletion, set: setEditNotifyCompletion },
                  { label: 'Notificar al completar (usuario)', value: editRequiresNotification, set: setEditRequiresNotification },
                ]}
                saving={editSaving}
                onSave={saveEdit}
                onCancel={cancelEditing}
              />
            ) : (
              <motion.div key="view-mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{task.title}</h2>
              {task.description && <p className="mt-2 text-gray-600 dark:text-gray-400">{task.description}</p>}
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
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Creado por</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/30 text-xs font-medium text-blue-600 dark:text-blue-400">{task.creator?.name?.charAt(0) ?? '?'}</span>
                <p className="text-sm text-gray-900 dark:text-gray-100">{task.creator?.name ?? 'Desconocido'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Responsable</p>
              <div className="mt-1 flex items-center gap-2">
                {task.current_responsible ? (
                  <>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-xs font-medium text-indigo-600 dark:text-indigo-400">{task.current_responsible.name.charAt(0)}</span>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{task.current_responsible.name}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500">Sin asignar</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Área</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{task.area?.name ?? task.assigned_area?.name ?? 'Sin área'}</p>
            </div>
            {task.due_date && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Fecha límite</p>
                <p className={`mt-1 flex items-center gap-1.5 text-sm ${task.is_overdue ? 'font-medium text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                  <HiOutlineClock className="h-4 w-4" />
                  {new Date(task.due_date).toLocaleDateString('es-PE')}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Avance</p>
              <div className="mt-1.5 flex items-center gap-2">
                {(() => {
                  const pct = statusProgress(task.status);
                  const barColor =
                    pct >= 100 ? 'from-green-500 to-emerald-500' :
                    pct >= 75 ? 'from-purple-500 to-violet-500' :
                    pct >= 25 ? 'from-blue-500 to-indigo-500' :
                    'from-gray-300 to-gray-300';
                  return (
                    <>
                      <div className="h-2 flex-1 rounded-full bg-gray-100 dark:bg-gray-700">
                        <div className={`h-2 rounded-full bg-linear-to-r ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{pct}%</span>
                    </>
                  );
                })()}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Antigüedad</p>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{task.age_days} días</p>
            </div>
            {task.meeting && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Reunión de origen</p>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{task.meeting.title}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-t border-gray-100 dark:border-gray-800 pt-4">
            <TaskStatusSelect
              task={task}
              userId={user?.id}
              userRole={user?.role.slug}
              onUpdated={(updated) => {
                setTask(updated);
                showMessage('Estado actualizado correctamente');
              }}
            />
            {canEdit && (
              <button type="button" onClick={startEditing} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98]">
                <HiOutlinePencil className="h-4 w-4" /> Editar
              </button>
            )}
            {canDelegate && (
              <button type="button" onClick={handleDelegateOpen} className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                <HiOutlineRefresh className="h-4 w-4" /> Delegar
              </button>
            )}
            {canUpdate && (
              <button type="button" onClick={() => setShowUpdateForm(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                Reportar avance
              </button>
            )}
            {canUpload && (
              <button type="button" onClick={() => setShowUploadForm(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                <HiOutlineUpload className="h-4 w-4" /> Adjuntar
              </button>
            )}
            {canComment && (
              <button type="button" onClick={() => setShowCommentForm(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                <HiOutlineChatAlt className="h-4 w-4" /> Comentar
              </button>
            )}
            {canDelete && (
              confirmDelete ? (
                <div className="flex items-center gap-2 rounded-xl border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/30 px-4 py-2">
                  <span className="text-sm text-red-700 dark:text-red-400">¿Eliminar?</span>
                  <button type="button" onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-red-700 disabled:opacity-50">
                    {deleting ? <Spinner size="sm" /> : null}
                    Sí, eliminar
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-red-100 dark:hover:bg-red-900/40">
                    No
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-red-200 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30">
                  <HiOutlineTrash className="h-4 w-4" /> Eliminar
                </button>
              )
            )}
          </div>
              </motion.div>
            )}
          </AnimatePresence>
        </FadeIn>

        {/* Modal forms */}
        <AnimatePresence>
          {showCommentForm && (
            <CommentFormPanel form={commentForm} onSubmit={onComment} onClose={() => setShowCommentForm(false)} />
          )}
          {showUpdateForm && (
            <UpdateFormPanel form={updateForm} onSubmit={onUpdate} onClose={() => setShowUpdateForm(false)} />
          )}
          {showApproveForm && (
            <ApproveFormPanel form={approveForm} onSubmit={onApprove} onClose={() => setShowApproveForm(false)} />
          )}
          {showRejectForm && (
            <RejectFormPanel form={rejectForm} onSubmit={onReject} onClose={() => setShowRejectForm(false)} />
          )}
          {showDelegateForm && (
            <DelegateFormPanel form={delegateForm} onSubmit={onDelegate} onClose={() => setShowDelegateForm(false)} members={areaMembers} loading={membersLoading} />
          )}
          {showUploadForm && (
            <UploadFormPanel file={uploadFile} setFile={setUploadFile} attachmentType={attachmentType} setAttachmentType={setAttachmentType} onUpload={onUpload} onClose={() => setShowUploadForm(false)} />
          )}
        </AnimatePresence>

      <TaskComments comments={task.comments ?? []} />
      <TaskAttachments attachments={task.attachments ?? []} />
      <TaskStatusHistory history={task.status_history ?? []} isSuperAdmin={isSuperAdmin} isManager={isManager} userId={user?.id} />
      <TaskUpdates updates={task.updates ?? []} />
      </div>
    </PageTransition>
  );
}
