import { Link } from 'react-router-dom';
import { TaskStatus, TASK_PRIORITY_LABELS } from '../../../types/enums';
import type { UpcomingTask, ResponsibleLoad } from '../../../types';
import {
  HiOutlineEye,
  HiOutlineLightningBolt,
  HiOutlineChevronRight,
} from 'react-icons/hi';
import { Badge, PRIORITY_BADGE_VARIANT } from '../../../components/ui';
import { formatRelativeDate } from '../../../utils';

export function ResponsibleRow({ responsible, max }: { responsible: ResponsibleLoad; max: number }) {
  const ratio = max > 0 ? responsible.active_tasks / max : 0;
  const pct = Math.round(ratio * 100);
  const barColor = responsible.active_tasks === 0
    ? 'bg-gray-200'
    : ratio > 0.75
    ? 'bg-red-500'
    : ratio > 0.4
    ? 'bg-amber-500'
    : 'bg-blue-400';
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
        {responsible.user_name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <p className="truncate text-sm font-medium text-gray-900">{responsible.user_name}</p>
          <span className="ml-2 shrink-0 text-sm font-semibold text-gray-900">{responsible.active_tasks}</span>
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
          <div className={`h-1.5 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

export function MiniStat({ label, value, icon, color, alert }: { label: string; value: number; icon: React.ReactNode; color: string; alert?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-3 transition-colors ${alert ? 'border-red-200 bg-red-50/40' : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'}`}>
      <div className="flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${color}`}>{icon}</span>
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`mt-1.5 text-xl font-bold ${alert ? 'text-red-700' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

export function UrgentTaskRow({ task }: { task: UpcomingTask }) {
  const isOverdue = task.is_overdue ?? task.status === TaskStatus.OVERDUE;
  return (
    <div className="flex items-center justify-between gap-3 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{task.title}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {isOverdue ? (
            <span className="font-medium text-red-600">Vencida · {formatRelativeDate(task.due_date)}</span>
          ) : (
            <>Vence {task.due_date ? formatRelativeDate(task.due_date) : 'sin fecha'}</>
          )}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant={PRIORITY_BADGE_VARIANT[task.priority]} size="sm">{TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS]}</Badge>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link to={`/tasks/${task.id}`} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50">
          <HiOutlineEye className="inline h-3.5 w-3.5" /> Ver
        </Link>
        <Link to={`/tasks/${task.id}`} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700">
          <HiOutlineLightningBolt className="inline h-3.5 w-3.5" /> Gestionar
        </Link>
      </div>
    </div>
  );
}

export function TaskRow({ task }: { task: UpcomingTask }) {
  return (
    <div className="flex items-center justify-between gap-3 px-6 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-900">{task.title}</p>
        <p className="mt-0.5 text-xs text-gray-500">
          {task.due_date ? formatRelativeDate(task.due_date) : 'Sin fecha límite'}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <Badge variant={PRIORITY_BADGE_VARIANT[task.priority]} size="sm">{TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS]}</Badge>
          {task.status === TaskStatus.OVERDUE && <Badge variant="red" size="sm">Vencida</Badge>}
          {task.status === TaskStatus.IN_REVIEW && <Badge variant="purple" size="sm">En revisión</Badge>}
        </div>
      </div>
      <Link
        to={`/tasks/${task.id}`}
        className="flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
      >
        Revisar <HiOutlineChevronRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
