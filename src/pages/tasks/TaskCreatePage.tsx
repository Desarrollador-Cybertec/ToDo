import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HiOutlineExclamationCircle,
  HiOutlineLightBulb,
  HiOutlineEye,
  HiOutlineChevronDown,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlinePaperClip,
  HiOutlineBell,
  HiOutlineShieldCheck,
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

/* ── constants ── */
const PRIORITY_STYLES: Record<string, { ring: string; bg: string; text: string; dot: string }> = {
  low:      { ring: 'ring-green-300', bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
  medium:   { ring: 'ring-yellow-300', bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  high:     { ring: 'ring-orange-300', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  critical: { ring: 'ring-red-300',    bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500' },
};

const TIPS = [
  'Un título claro ayuda a entender la tarea de un vistazo.',
  'Asigna una fecha límite para mantener el control de los plazos.',
  'Usa la prioridad para resaltar lo más urgente.',
  'Activa "Requiere adjunto" si necesitas evidencia de cumplimiento.',
];

/* ── toggle sub-component ── */
function ToggleField({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50">
      <div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {description && <p className="text-xs text-gray-400">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
}

export function TaskCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [serverError, setServerError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const isWorker = user?.role.slug === Role.WORKER;

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
    ]).then(([u, a, m]) => {
      setUsers(u);
      setAreas(a);
      setMeetings(m);
    });
  }, []);

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
    if (isWorker) return user?.name ?? '';
    if (hasUser) return users.find((u) => String(u.id) === String(watchAssignedUser))?.name ?? '';
    if (hasArea) return areas.find((a) => String(a.id) === String(watchAssignedArea))?.name ?? '';
    if (hasExternalEmail) return watchExternalEmail ?? '';
    return 'Sin asignar';
  })();

  const pStyle = PRIORITY_STYLES[watchPriority] ?? PRIORITY_STYLES.medium;

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
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">Responsable</label>
                        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700">
                          <HiOutlineUser className="h-4 w-4 text-gray-400" />
                          {user?.name} (tú)
                        </div>
                        <input type="hidden" {...register('assigned_to_user_id', { value: user?.id })} />
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
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
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
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6 overflow-hidden"
                  >
                    {/* description + dates + meeting */}
                    <FadeIn delay={0.05} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                      <h3 className="mb-4 text-base font-semibold text-gray-900">Detalles adicionales</h3>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700">Descripción</label>
                          <textarea id="description" rows={3} {...register('description')} placeholder="Describe la tarea con más detalle…" className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                        <div className={`grid gap-4 ${!isWorker ? 'sm:grid-cols-2' : ''}`}>
                          <div>
                            <label htmlFor="start_date" className="mb-1.5 block text-sm font-medium text-gray-700">Fecha inicio</label>
                            <input id="start_date" type="date" {...register('start_date')} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
                          </div>
                          {!isWorker && (
                            <div>
                              <label htmlFor="meeting_id" className="mb-1.5 block text-sm font-medium text-gray-700">Reunión de origen</label>
                              <select id="meeting_id" {...register('meeting_id', { setValueAs: (v: string) => v ? Number(v) : null })} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
                                <option value="">Sin reunión</option>
                                {meetings.map((m) => (
                                  <option key={m.id} value={m.id}>{m.title}</option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </FadeIn>

                    {/* area / external (non-worker) */}
                    {!isWorker && (
                      <FadeIn delay={0.1} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-base font-semibold text-gray-900">Asignación alternativa</h3>
                        <p className="mb-3 text-xs text-gray-500">Si ya seleccionaste un usuario arriba, estas opciones se deshabilitan automáticamente.</p>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor="assigned_to_area_id" className="mb-1.5 block text-sm font-medium text-gray-700">Asignar a área</label>
                            <select
                              id="assigned_to_area_id"
                              {...register('assigned_to_area_id', { setValueAs: (v: string) => v ? Number(v) : null })}
                              disabled={hasUser || hasExternalEmail}
                              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                            >
                              <option value="">Sin asignar</option>
                              {areas.map((a) => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <label htmlFor="external_email" className="mb-1.5 block text-sm font-medium text-gray-700">Correo externo</label>
                              <input
                                id="external_email"
                                type="email"
                                {...register('external_email')}
                                disabled={hasUser || hasArea}
                                placeholder="correo@ejemplo.com"
                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                              />
                              {errors.external_email && <p className="mt-1 text-sm text-red-500">{errors.external_email.message}</p>}
                            </div>
                            <div>
                              <label htmlFor="external_name" className="mb-1.5 block text-sm font-medium text-gray-700">Nombre externo</label>
                              <input
                                id="external_name"
                                type="text"
                                {...register('external_name')}
                                disabled={hasUser || hasArea}
                                placeholder="Nombre del destinatario"
                                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                              />
                            </div>
                          </div>
                        </div>
                      </FadeIn>
                    )}

                    {/* requirements */}
                    {!isWorker && <FadeIn delay={0.15} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                      <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-gray-900">
                        <HiOutlineShieldCheck className="h-5 w-5 text-blue-500" /> Requisitos
                      </h3>
                      <p className="mb-3 text-xs text-gray-400">Configura qué necesita la tarea para completarse.</p>
                      <div className="divide-y divide-gray-100">
                        <ToggleField label="Requiere adjunto" description="El responsable deberá subir evidencia." checked={!!reqAttach} onChange={(v) => setValue('requires_attachment', v)} />
                        <ToggleField label="Comentario de cierre" description="Obligatorio al marcar como completada." checked={!!reqComment} onChange={(v) => setValue('requires_completion_comment', v)} />
                        <ToggleField label="Aprobación del jefe" description="Necesita validación antes de cerrarse." checked={!!reqApproval} onChange={(v) => setValue('requires_manager_approval', v)} />
                        <ToggleField label="Reportes de avance" description="El responsable enviará actualizaciones periódicas." checked={!!reqProgress} onChange={(v) => setValue('requires_progress_report', v)} />
                      </div>
                    </FadeIn>}

                    {/* notifications */}
                    {!isWorker && <FadeIn delay={0.2} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                      <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-gray-900">
                        <HiOutlineBell className="h-5 w-5 text-yellow-500" /> Notificaciones
                      </h3>
                      <p className="mb-3 text-xs text-gray-400">Decide qué avisos quieres recibir.</p>
                      <div className="divide-y divide-gray-100">
                        <ToggleField label="Al vencer" checked={!!notDue} onChange={(v) => setValue('notify_on_due', v)} />
                        <ToggleField label="Si vencida" checked={!!notOverdue} onChange={(v) => setValue('notify_on_overdue', v)} />
                        <ToggleField label="Al completar" checked={!!notCompletion} onChange={(v) => setValue('notify_on_completion', v)} />
                      </div>
                    </FadeIn>}

                    {/* bottom actions */}
                    <div className="flex justify-end gap-3 pb-2">
                      <button type="button" onClick={() => navigate('/tasks')} className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-500/25 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-50"
                      >
                        {isSubmitting ? <><Spinner size="sm" className="border-white border-t-transparent" /> Creando...</> : 'Crear tarea'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ─── RIGHT SIDEBAR (1/3) ─── */}
            <div className="hidden space-y-6 lg:block">
              {/* live preview */}
              <div className="sticky top-6 space-y-6">
                <FadeIn delay={0.1} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <HiOutlineEye className="h-4 w-4 text-blue-500" /> Vista previa
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-xs font-medium text-gray-400">Título</span>
                      <p className={`font-medium ${watchTitle ? 'text-gray-900' : 'italic text-gray-300'}`}>
                        {watchTitle || 'Sin título'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-400">Prioridad</span>
                      <span className={`ml-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${pStyle.bg} ${pStyle.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${pStyle.dot}`} />
                        {TASK_PRIORITY_LABELS[watchPriority as keyof typeof TASK_PRIORITY_LABELS] ?? watchPriority}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-400">Responsable</span>
                      <p className="flex items-center gap-1 text-gray-700">
                        <HiOutlineUser className="h-3.5 w-3.5 text-gray-400" /> {assigneeName}
                      </p>
                    </div>
                    {watchDueDate && (
                      <div>
                        <span className="text-xs font-medium text-gray-400">Fecha límite</span>
                        <p className="flex items-center gap-1 text-gray-700">
                          <HiOutlineCalendar className="h-3.5 w-3.5 text-gray-400" /> {watchDueDate}
                        </p>
                      </div>
                    )}
                    {(reqAttach || reqComment || reqApproval || reqProgress) && (
                      <div>
                        <span className="text-xs font-medium text-gray-400">Requisitos activos</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {reqAttach   && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600"><HiOutlinePaperClip className="mr-0.5 inline h-3 w-3" />Adjunto</span>}
                          {reqComment  && <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-600">Comentario</span>}
                          {reqApproval && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-600">Aprobación</span>}
                          {reqProgress && <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-600">Avance</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </FadeIn>

                {/* tips */}
                <FadeIn delay={0.15} className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 shadow-sm">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-800">
                    <HiOutlineLightBulb className="h-4 w-4" /> Consejos
                  </h4>
                  <ul className="space-y-2">
                    {TIPS.map((tip, i) => (
                      <li key={i} className="flex gap-2 text-xs text-amber-700">
                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </FadeIn>
              </div>
            </div>
          </div>
        </form>
      </div>
    </PageTransition>
  );
}
