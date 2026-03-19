import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence } from 'framer-motion';
import {
  HiOutlineExclamationCircle,
  HiOutlineChevronDown,
  HiOutlineUser,
} from 'react-icons/hi';
import { createTaskSchema, type CreateTaskFormData } from '../../schemas';
import { tasksApi } from '../../api/tasks';
import { usersApi } from '../../api/users';
import { areasApi } from '../../api/areas';
import { meetingsApi } from '../../api/meetings';
import { useAuth } from '../../context/useAuth';
import { Role, TASK_PRIORITY_LABELS } from '../../types/enums';
import { ApiError } from '../../api/client';
import type { User, Area, Meeting } from '../../types';
import { PageTransition, SlideDown, FadeIn } from '../../components/ui';
import { Spinner } from '../../components/ui';
import { TaskCreatePreview } from './components/TaskCreatePreview';
import { TaskCreateAdvanced } from './components/TaskCreateAdvanced';

/* ── constants ── */
const PRIORITY_STYLES: Record<string, { ring: string; bg: string; text: string; dot: string }> = {
  low:      { ring: 'ring-green-300', bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
  medium:   { ring: 'ring-yellow-300', bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  high:     { ring: 'ring-orange-300', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  critical: { ring: 'ring-red-300',    bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500' },
};

export function TaskCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [serverError, setServerError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [areaMembers, setAreaMembers] = useState<User[]>([]);
  const [workerDest, setWorkerDest] = useState<'self' | 'external'>('self');

  const isWorker = user?.role.slug === Role.WORKER;
  const isManager = user?.role.slug === Role.AREA_MANAGER;
  const isSuperadmin = user?.role.slug === Role.SUPERADMIN;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema) as never,
    defaultValues: {
      priority: 'medium',
      start_date: new Date().toISOString().slice(0, 10),
      requires_attachment: false,
      requires_completion_comment: false,
      requires_manager_approval: true,
      requires_completion_notification: false,
      requires_due_date: false,
      requires_progress_report: false,
      notify_on_due: true,
      notify_on_overdue: true,
      notify_on_completion: false,
      ...(isWorker ? { assigned_to_user_id: user?.id } : {}),
    },
  });

  /* watches for live preview & mutual-exclusion */
  const watchTitle = useWatch({ control, name: 'title' }) || '';
  const watchPriority = useWatch({ control, name: 'priority' }) || 'medium';
  const watchDueDate = useWatch({ control, name: 'due_date' });
  const watchAssignedUser = useWatch({ control, name: 'assigned_to_user_id' });
  const watchAssignedArea = useWatch({ control, name: 'assigned_to_area_id' });
  const watchExternalEmail = useWatch({ control, name: 'external_email' });

  const hasUser = !!watchAssignedUser;
  const hasArea = !!watchAssignedArea;
  const hasExternalEmail = !!watchExternalEmail;

  /* requirement / notification watches */
  const reqAttach   = useWatch({ control, name: 'requires_attachment' });
  const reqComment  = useWatch({ control, name: 'requires_completion_comment' });
  const reqApproval = useWatch({ control, name: 'requires_manager_approval' });
  const reqProgress = useWatch({ control, name: 'requires_progress_report' });
  const notDue        = useWatch({ control, name: 'notify_on_due' });
  const notOverdue    = useWatch({ control, name: 'notify_on_overdue' });
  const notCompletion = useWatch({ control, name: 'notify_on_completion' });

  useEffect(() => {
    Promise.all([
      usersApi.listAll().catch(() => [] as User[]),
      areasApi.listAll().catch(() => [] as Area[]),
      meetingsApi.list().catch(() => [] as Meeting[]),
    ]).then(async ([u, a, m]) => {
      setUsers(u);
      setAreas(a);
      setMeetings(m);

      // For managers: load actual members of their managed areas
      if (isManager && user?.id) {
        const uid = Number(user.id);
        // 1. Prefer area_id from /me; 2. scan areas list; 3. fallback to first area
        let areaIdsToFetch: number[] = [];
        if (user.area_id) {
          areaIdsToFetch = [Number(user.area_id)];
        } else {
          const matched = a.filter(
            (area) =>
              Number(area.manager_user_id) === uid ||
              (area.manager?.id != null && Number(area.manager.id) === uid),
          );
          areaIdsToFetch = matched.length ? matched.map((area) => area.id) : a.length ? [a[0].id] : [];
        }

        if (areaIdsToFetch.length) {
          const memberLists = await Promise.all(
            areaIdsToFetch.map((id) => areasApi.membersAll(id).catch(() => [] as User[])),
          );
          const memberMap = new Map<number, User>();
          memberLists.flat().forEach((member) => memberMap.set(member.id, member));
          setAreaMembers([...memberMap.values()]);
        }
      }
    });
  }, [isManager, user?.id, user?.area_id]);

  /* Filter users based on role */
  const availableUsers = (() => {
    if (isSuperadmin) return users;
    if (isManager) {
      // Real area members + the manager themselves (for personal tasks)
      const memberMap = new Map<number, User>(areaMembers.map((m) => [m.id, m]));
      if (user) memberMap.set(user.id, user as User);
      return [...memberMap.values()];
    }
    return [];
  })();

  const onSubmit = async (data: CreateTaskFormData) => {
    setServerError('');
    try {
      const payload = {
        ...data,
        assigned_to_user_id: data.assigned_to_user_id || undefined,
        assigned_to_area_id: data.assigned_to_area_id || undefined,
        external_email: data.external_email || undefined,
        external_name: data.external_name || undefined,
        meeting_id: data.meeting_id || undefined,
        description: data.description || undefined,
        due_date: data.due_date || undefined,
        start_date: data.start_date || undefined,
      };
      await tasksApi.create(payload);
      navigate('/tasks');
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.data.message);
      } else {
        setServerError('Error al crear la tarea');
      }
    }
  };

  const assigneeName = (() => {
    if (isWorker && workerDest === 'self') return user?.name ?? '';
    if (isWorker && workerDest === 'external') return watchExternalEmail || 'Sin correo';
    if (hasUser) return users.find((u) => String(u.id) === String(watchAssignedUser))?.name ?? '';
    if (hasArea) return areas.find((a) => String(a.id) === String(watchAssignedArea))?.name ?? '';
    if (hasExternalEmail) return watchExternalEmail ?? '';
    return 'Sin asignar';
  })();

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl">
        {/* header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Nueva Tarea</h2>
          <p className="mt-1 text-sm text-gray-500">Completa los datos esenciales y crea tu tarea rápidamente.</p>
        </div>

        <AnimatePresence>
          {serverError && (
            <SlideDown>
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600 ring-1 ring-inset ring-red-200">
                <HiOutlineExclamationCircle className="h-4 w-4 shrink-0" />
                {serverError}
              </div>
            </SlideDown>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-6 lg:grid-cols-3">
            {/* ─── LEFT COLUMN (2/3) ─── */}
            <div className="space-y-6 lg:col-span-2">

              {/* quick creation card */}
              <FadeIn delay={0.05} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                  ⚡ Creación rápida
                </h3>
                <div className="space-y-4">
                  {/* title */}
                  <div>
                    <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-gray-700">Título *</label>
                    <input
                      id="title"
                      {...register('title')}
                      placeholder="Ej: Enviar informe semanal"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* responsible */}
                    {isWorker ? (
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">Destino</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { setWorkerDest('self'); setValue('assigned_to_user_id', user?.id ?? null); setValue('external_email', ''); setValue('external_name', ''); }}
                            className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                              workerDest === 'self'
                                ? 'border-blue-300 bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <HiOutlineUser className="mr-1 inline h-4 w-4" />
                            Para mí
                          </button>
                          <button
                            type="button"
                            onClick={() => { setWorkerDest('external'); setValue('assigned_to_user_id', null); }}
                            className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                              workerDest === 'external'
                                ? 'border-blue-300 bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            ✉️ Correo externo
                          </button>
                        </div>
                        {workerDest === 'self' && (
                          <>
                            <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700">
                              <HiOutlineUser className="h-4 w-4 text-gray-400" />
                              {user?.name} (tú)
                            </div>
                            <input type="hidden" {...register('assigned_to_user_id', { value: user?.id })} />
                          </>
                        )}
                        {workerDest === 'external' && (
                          <div className="mt-2 space-y-2">
                            <input
                              type="email"
                              {...register('external_email')}
                              placeholder="correo@ejemplo.com"
                              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                            />
                            {errors.external_email && <p className="mt-1 text-sm text-red-500">{errors.external_email.message}</p>}
                            <input
                              type="text"
                              {...register('external_name')}
                              placeholder="Nombre del destinatario"
                              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <label htmlFor="assigned_to_user_id" className="mb-1.5 block text-sm font-medium text-gray-700">Responsable</label>
                        <select
                          id="assigned_to_user_id"
                          {...register('assigned_to_user_id', { setValueAs: (v: string) => v ? Number(v) : null })}
                          disabled={hasArea || hasExternalEmail}
                          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                        >
                          <option value="">Seleccionar usuario</option>
                          {availableUsers.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}{u.id === user?.id ? ' (tú)' : ''}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* due date */}
                    <div>
                      <label htmlFor="due_date" className="mb-1.5 block text-sm font-medium text-gray-700">Fecha límite</label>
                      <input id="due_date" type="date" {...register('due_date')} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
                    </div>
                  </div>

                  {/* priority pills */}
                  <div>
                    <span className="mb-2 block text-sm font-medium text-gray-700">Prioridad</span>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => {
                        const s = PRIORITY_STYLES[value] ?? PRIORITY_STYLES.medium;
                        const active = watchPriority === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setValue('priority', value as CreateTaskFormData['priority'])}
                            className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition-all ${active ? `${s.bg} ${s.text} ${s.ring} shadow-sm` : 'bg-white text-gray-500 ring-gray-200 hover:bg-gray-50'}`}
                          >
                            <span className={`h-2 w-2 rounded-full ${active ? s.dot : 'bg-gray-300'}`} />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    {errors.priority && <p className="mt-1 text-sm text-red-500">{errors.priority.message}</p>}
                  </div>
                </div>

                {/* toggle advanced */}
                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced((v) => !v)}
                    className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    <HiOutlineChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    {showAdvanced ? 'Ocultar opciones avanzadas' : 'Mostrar opciones avanzadas'}
                  </button>

                  {!showAdvanced && (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-md shadow-blue-500/25 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
                    >
                      {isSubmitting ? <><Spinner size="sm" className="border-white border-t-transparent" /> Creando...</> : 'Crear tarea'}
                    </button>
                  )}
                </div>
              </FadeIn>

              {/* ─── ADVANCED SECTION (collapsible) ─── */}
              {showAdvanced && (
                <TaskCreateAdvanced
                  register={register}
                  setValue={setValue}
                  isWorker={isWorker}
                  isSubmitting={isSubmitting}
                  errors={errors as Record<string, { message?: string }>}
                  areas={areas}
                  meetings={meetings}
                  hasUser={hasUser}
                  hasArea={hasArea}
                  hasExternalEmail={hasExternalEmail}
                  reqAttach={!!reqAttach}
                  reqComment={!!reqComment}
                  reqApproval={!!reqApproval}
                  reqProgress={!!reqProgress}
                  notDue={!!notDue}
                  notOverdue={!!notOverdue}
                  notCompletion={!!notCompletion}
                  onCancel={() => navigate('/tasks')}
                />
              )}
            </div>

            {/* ─── RIGHT SIDEBAR (1/3) ─── */}
            <TaskCreatePreview
              title={watchTitle}
              priority={watchPriority}
              assigneeName={assigneeName}
              dueDate={watchDueDate}
              reqAttach={!!reqAttach}
              reqComment={!!reqComment}
              reqApproval={!!reqApproval}
              reqProgress={!!reqProgress}
            />
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
