import { useState } from 'react';
import { HiOutlineChevronDown, HiOutlineRefresh } from 'react-icons/hi';
import { tasksApi } from '../../api/tasks';
import { TaskStatus, Role } from '../../types/enums';
import type { Task } from '../../types';
import { ApiError } from '../../api/client';

type ActionKey = 'start' | 'submit_review' | 'approve' | 'reject' | 'cancel' | 'reopen' | 'claim';

interface Action {
  key: ActionKey;
  label: string;
}

function getAvailableActions(
  task: Task,
  userId: number | undefined,
  userRole: string | undefined,
): Action[] {
  if (!userId || !userRole) return [];

  const uid = Number(userId);
  const isResponsible =
    Number(task.current_responsible_user_id) === uid ||
    Number(task.current_responsible?.id) === uid ||
    Number(task.assigned_to_user_id) === uid ||
    Number(task.assigned_user?.id) === uid;
  const isCreator =
    Number(task.created_by) === uid ||
    Number(task.creator?.id) === uid;
  const isSuperAdmin = userRole === Role.SUPERADMIN;
  const isManager = userRole === Role.AREA_MANAGER;
  const terminal: string[] = [TaskStatus.COMPLETED, TaskStatus.CANCELLED];

  const actions: Action[] = [];

  // Manager/SuperAdmin can claim tasks in pending_assignment status
  if (
    (isSuperAdmin || isManager) &&
    task.status === TaskStatus.PENDING_ASSIGNMENT
  ) {
    actions.push({ key: 'claim', label: 'Reclamar tarea' });
  }

  if (
    isResponsible &&
    ([TaskStatus.PENDING, TaskStatus.OVERDUE, TaskStatus.REJECTED] as string[]).includes(task.status)
  ) {
    actions.push({ key: 'start', label: 'Iniciar tarea' });
  }

  if (isResponsible && task.status === TaskStatus.IN_PROGRESS) {
    actions.push({ key: 'submit_review', label: 'Enviar a revisión' });
  }

  if ((isSuperAdmin || isManager) && task.status === TaskStatus.IN_REVIEW) {
    actions.push({ key: 'approve', label: 'Aprobar' });
    actions.push({ key: 'reject', label: 'Rechazar' });
  }

  if ((isSuperAdmin || isManager || isCreator) && !terminal.includes(task.status)) {
    actions.push({ key: 'cancel', label: 'Cancelar tarea' });
  }

  const isWorker = userRole === Role.WORKER;
  if ((isSuperAdmin || isManager) && terminal.includes(task.status)) {
    actions.push({ key: 'reopen', label: 'Reabrir tarea' });
  } else if (isWorker && (isCreator || isResponsible) && terminal.includes(task.status)) {
    actions.push({ key: 'reopen', label: 'Reabrir tarea personal' });
  }

  return actions;
}

interface TaskStatusSelectProps {
  task: Task;
  userId: number | undefined;
  userRole: string | undefined;
  onUpdated: (updated: Task) => void;
}

export function TaskStatusSelect({ task, userId, userRole, onUpdated }: TaskStatusSelectProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingReject, setPendingReject] = useState(false);
  const [rejectNote, setRejectNote] = useState('');

  const actions = getAvailableActions(task, userId, userRole);
  if (actions.length === 0) return null;

  const reopenAction = actions.find((a) => a.key === 'reopen');
  const otherActions = actions.filter((a) => a.key !== 'reopen');

  const execute = async (key: ActionKey, note?: string) => {
    setLoading(true);
    setError('');
    try {
      let updated: Task;
      switch (key) {
        case 'start':
          updated = await tasksApi.start(task.id);
          break;
        case 'submit_review':
          updated = await tasksApi.submitReview(task.id);
          break;
        case 'approve':
          updated = await tasksApi.approve(task.id);
          break;
        case 'reject':
          updated = await tasksApi.reject(task.id, { note: note ?? '' });
          break;
        case 'cancel':
          updated = await tasksApi.cancel(task.id);
          break;
        case 'reopen':
          updated = await tasksApi.reopen(task.id);
          break;
        case 'claim':
          updated = await tasksApi.claim(task.id);
          break;
        default:
          setLoading(false);
          return;
      }
      setPendingReject(false);
      setRejectNote('');
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.data.message : 'Error al actualizar el estado');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value as ActionKey | '';
    e.target.value = '';
    if (!key) return;
    if (key === 'reject') {
      setPendingReject(true);
      setRejectNote('');
    } else {
      execute(key);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {reopenAction && (
        <button
          type="button"
          onClick={() => execute('reopen')}
          disabled={loading}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 px-3 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 transition-colors hover:border-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 disabled:opacity-60 cursor-pointer"
        >
          <HiOutlineRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Reabriendo...' : reopenAction.label}
        </button>
      )}
      {pendingReject ? (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 p-2.5 space-y-2 min-w-48">
          <p className="text-xs font-semibold text-red-700 dark:text-red-400">Motivo del rechazo</p>
          <textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            rows={2}
            placeholder="Escribe el motivo..."
            className="w-full rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20 resize-none text-gray-900 dark:text-gray-100"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => execute('reject', rejectNote)}
              disabled={loading || !rejectNote.trim()}
              className="flex-1 rounded-lg bg-red-600 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Rechazando...' : 'Confirmar'}
            </button>
            <button
              type="button"
              onClick={() => { setPendingReject(false); setRejectNote(''); }}
              className="rounded-lg bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-900/40"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        otherActions.length > 0 && (
        <div className="relative">
          <select
            onChange={handleChange}
            disabled={loading}
            defaultValue=""
            className="w-full appearance-none rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 py-2 pl-3 pr-8 text-sm font-medium text-blue-700 dark:text-blue-400 transition-colors hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 cursor-pointer"
          >
            <option value="" disabled>
              {loading ? 'Ejecutando...' : 'Cambiar estado'}
            </option>
            {otherActions.map((a) => (
              <option key={a.key} value={a.key}>
                {a.label}
              </option>
            ))}
          </select>
          <HiOutlineChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500 dark:text-blue-400" />
        </div>
        )
      )}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
