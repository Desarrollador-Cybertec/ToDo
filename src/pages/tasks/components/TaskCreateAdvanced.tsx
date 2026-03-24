import { AnimatePresence, motion } from 'framer-motion';
import type { UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { HiOutlineShieldCheck, HiOutlineBell } from 'react-icons/hi';
import type { CreateTaskFormData } from '../../../schemas';
import type { Area, Meeting } from '../../../types';
import { FadeIn } from '../../../components/ui';
import { Spinner } from '../../../components/ui';

/* ── toggle sub-component ── */
function ToggleField({ label, description, checked, onChange }: {
  label: string; description?: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
      <div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        {description && <p className="text-xs text-gray-400 dark:text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white dark:bg-gray-900 shadow transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
      </button>
    </label>
  );
}

interface Props {
  register: UseFormRegister<CreateTaskFormData>;
  setValue: UseFormSetValue<CreateTaskFormData>;
  isWorker: boolean;
  isPersonalTask: boolean;
  isSubmitting: boolean;
  errors: Record<string, { message?: string }>;
  areas: Area[];
  meetings: Meeting[];
  hasUser: boolean;
  hasArea: boolean;
  hasExternalEmail: boolean;
  reqAttach: boolean;
  reqComment: boolean;
  reqApproval: boolean;
  reqProgress: boolean;
  notDue: boolean;
  notOverdue: boolean;
  notCompletion: boolean;
  onCancel: () => void;
}

export function TaskCreateAdvanced({
  register,
  setValue,
  isWorker,
  isPersonalTask,
  isSubmitting,
  errors,
  areas,
  meetings,
  hasUser,
  hasArea,
  hasExternalEmail,
  reqAttach,
  reqComment,
  reqApproval,
  reqProgress,
  notDue,
  notOverdue,
  notCompletion,
  onCancel,
}: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6 overflow-hidden"
      >
        {/* description + dates + meeting */}
        <FadeIn delay={0.05} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Detalles adicionales</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción</label>
              <textarea id="description" rows={3} {...register('description')} placeholder="Describe la tarea con más detalle…" className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div className={`grid gap-4 ${!isWorker ? 'sm:grid-cols-2' : ''}`}>
              <div>
                <label htmlFor="start_date" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha inicio</label>
                <input id="start_date" type="date" {...register('start_date')} className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              {!isWorker && (
              <div>
                <label htmlFor="meeting_id" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Reunión de origen</label>
                <select id="meeting_id" {...register('meeting_id', { setValueAs: (v: string) => v ? Number(v) : null })} className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
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
          <FadeIn delay={0.1} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">Asignación alternativa</h3>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Si ya seleccionaste un usuario arriba, estas opciones se deshabilitan automáticamente.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="assigned_to_area_id" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Asignar a área</label>
                <select
                  id="assigned_to_area_id"
                  {...register('assigned_to_area_id', { setValueAs: (v: string) => v ? Number(v) : null })}
                  disabled={hasUser || hasExternalEmail}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500"
                >
                  <option value="">Sin asignar</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <div>
                  <label htmlFor="external_email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Correo externo</label>
                  <input
                    id="external_email"
                    type="email"
                    {...register('external_email')}
                    disabled={hasUser || hasArea}
                    placeholder="correo@ejemplo.com"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500"
                  />
                  {errors.external_email && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{errors.external_email.message}</p>}
                </div>
                <div>
                  <label htmlFor="external_name" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre externo</label>
                  <input
                    id="external_name"
                    type="text"
                    {...register('external_name')}
                    disabled={hasUser || hasArea}
                    placeholder="Nombre del destinatario"
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500"
                  />
                </div>
              </div>
            </div>
          </FadeIn>
        )}

        {/* requirements */}
        <FadeIn delay={0.15} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            <HiOutlineShieldCheck className="h-5 w-5 text-blue-500 dark:text-blue-400" /> Requisitos
          </h3>
          <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">Configura qué necesita la tarea para completarse.</p>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <ToggleField label="Requiere adjunto" description="El responsable deberá subir evidencia." checked={!!reqAttach} onChange={(v) => setValue('requires_attachment', v)} />
            <ToggleField label="Comentario de cierre" description="Obligatorio al marcar como completada." checked={!!reqComment} onChange={(v) => setValue('requires_completion_comment', v)} />
            {!isWorker && !isPersonalTask && (
              <>
                <ToggleField label="Aprobación del jefe" description="Necesita validación antes de cerrarse." checked={!!reqApproval} onChange={(v) => setValue('requires_manager_approval', v)} />
                <ToggleField label="Reportes de avance" description="El responsable enviará actualizaciones periódicas." checked={!!reqProgress} onChange={(v) => setValue('requires_progress_report', v)} />
              </>
            )}
          </div>
        </FadeIn>

        {/* notifications */}
        {!isPersonalTask && (
        <FadeIn delay={0.2} className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            <HiOutlineBell className="h-5 w-5 text-yellow-500 dark:text-yellow-400" /> Notificaciones
          </h3>
          <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">Decide qué avisos quieres recibir.</p>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <ToggleField label="Al vencer" checked={!!notDue} onChange={(v) => setValue('notify_on_due', v)} />
            <ToggleField label="Si vencida" checked={!!notOverdue} onChange={(v) => setValue('notify_on_overdue', v)} />
            <ToggleField label="Al completar" checked={!!notCompletion} onChange={(v) => setValue('notify_on_completion', v)} />
          </div>
        </FadeIn>
        )}

        {/* bottom actions */}
        <div className="flex justify-end gap-3 pb-2">
          <button type="button" onClick={onCancel} className="rounded-xl border border-gray-200 dark:border-gray-700 px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
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
    </AnimatePresence>
  );
}
