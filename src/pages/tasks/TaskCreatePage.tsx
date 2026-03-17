import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTaskSchema, type CreateTaskFormData } from '../../schemas';
import { tasksApi } from '../../api/tasks';
import { usersApi } from '../../api/users';
import { areasApi } from '../../api/areas';
import { meetingsApi } from '../../api/meetings';
import { TASK_PRIORITY_LABELS } from '../../types/enums';
import { ApiError } from '../../api/client';
import type { User, Area, Meeting } from '../../types';

export function TaskCreatePage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema) as never,
    defaultValues: {
      priority: 'medium',
      requires_attachment: false,
      requires_completion_comment: false,
      requires_manager_approval: true,
      requires_completion_notification: false,
      requires_due_date: false,
      requires_progress_report: false,
      notify_on_due: true,
      notify_on_overdue: true,
      notify_on_completion: false,
    },
  });

  const assignToUser = useWatch({ control, name: 'assigned_to_user_id' });
  const assignToArea = useWatch({ control, name: 'assigned_to_area_id' });

  useEffect(() => {
    Promise.all([
      usersApi.list().catch(() => ({ data: [] })),
      areasApi.list().catch(() => ({ data: [] })),
      meetingsApi.list().catch(() => ({ data: [] })),
    ]).then(([usersRes, areasRes, meetingsRes]) => {
      setUsers(usersRes.data);
      setAreas(areasRes.data);
      setMeetings(meetingsRes.data);
    });
  }, []);

  const onSubmit = async (data: CreateTaskFormData) => {
    setServerError('');
    try {
      const payload = {
        ...data,
        assigned_to_user_id: data.assigned_to_user_id || undefined,
        assigned_to_area_id: data.assigned_to_area_id || undefined,
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

  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Nueva Tarea</h2>

      {serverError && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{serverError}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Información básica</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-gray-700">Título *</label>
              <input id="title" {...register('title')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
            </div>
            <div>
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700">Descripción</label>
              <textarea id="description" rows={3} {...register('description')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="priority" className="mb-1.5 block text-sm font-medium text-gray-700">Prioridad *</label>
                <select id="priority" {...register('priority')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
                  {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {errors.priority && <p className="mt-1 text-sm text-red-500">{errors.priority.message}</p>}
              </div>
              <div>
                <label htmlFor="meeting_id" className="mb-1.5 block text-sm font-medium text-gray-700">Reunión de origen</label>
                <select id="meeting_id" {...register('meeting_id', { setValueAs: (v: string) => v ? Number(v) : null })} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
                  <option value="">Sin reunión</option>
                  {meetings.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="start_date" className="mb-1.5 block text-sm font-medium text-gray-700">Fecha inicio</label>
                <input id="start_date" type="date" {...register('start_date')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label htmlFor="due_date" className="mb-1.5 block text-sm font-medium text-gray-700">Fecha límite</label>
                <input id="due_date" type="date" {...register('due_date')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Asignación</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="assigned_to_user_id" className="mb-1.5 block text-sm font-medium text-gray-700">Asignar a usuario</label>
              <select
                id="assigned_to_user_id"
                {...register('assigned_to_user_id', { setValueAs: (v: string) => v ? Number(v) : null })}
                disabled={!!assignToArea}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
              >
                <option value="">Sin asignar</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="assigned_to_area_id" className="mb-1.5 block text-sm font-medium text-gray-700">Asignar a área</label>
              <select
                id="assigned_to_area_id"
                {...register('assigned_to_area_id', { setValueAs: (v: string) => v ? Number(v) : null })}
                disabled={!!assignToUser}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
              >
                <option value="">Sin asignar</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Requisitos</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3">
              <input type="checkbox" {...register('requires_attachment')} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Requiere adjunto</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" {...register('requires_completion_comment')} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Requiere comentario de cierre</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" {...register('requires_manager_approval')} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Requiere aprobación del jefe</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" {...register('requires_progress_report')} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Requiere reportes de avance</span>
            </label>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Notificaciones</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3">
              <input type="checkbox" {...register('notify_on_due')} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Notificar al vencer</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" {...register('notify_on_overdue')} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Notificar si vencida</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" {...register('notify_on_completion')} className="h-4 w-4 rounded border-gray-300 text-blue-600" />
              <span className="text-sm text-gray-700">Notificar al completar</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/tasks')} className="rounded-lg border px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting ? 'Creando...' : 'Crear tarea'}
          </button>
        </div>
      </form>
    </div>
  );
}
