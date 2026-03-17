import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tasksApi } from '../../api/tasks';
import { useAuth } from '../../context/useAuth';
import { Role, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../types/enums';
import type { Task } from '../../types';
import { HiOutlinePlus, HiOutlineFilter, HiOutlineEye } from 'react-icons/hi';

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

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

export function TaskListPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');

  const canCreate = user?.role.slug === Role.SUPERADMIN || user?.role.slug === Role.AREA_MANAGER;

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (sortBy) params.set('sort', sortBy);
    
    tasksApi.list(params.toString())
      .then((res) => { if (!cancelled) setTasks(res.data); })
      .catch(() => { if (!cancelled) setTasks([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filterStatus, sortBy]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Tareas</h2>
        {canCreate && (
          <Link
            to="/tasks/create"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Nueva tarea
          </Link>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <HiOutlineFilter className="h-5 w-5 text-gray-400" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Todos los estados</option>
          {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="">Más recientes</option>
          <option value="oldest">Más antiguas</option>
          <option value="due_date">Fecha de vencimiento</option>
          <option value="priority">Prioridad</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <p className="text-gray-500">No hay tareas para mostrar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1">
                  <Link to={`/tasks/${task.id}`} className="text-base font-medium text-gray-900 hover:text-blue-600">
                    {task.title}
                  </Link>
                  {task.description && (
                    <p className="mt-1 line-clamp-1 text-sm text-gray-500">{task.description}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[task.status] ?? 'bg-gray-100'}`}>
                      {TASK_STATUS_LABELS[task.status]}
                    </span>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${PRIORITY_COLORS[task.priority] ?? 'bg-gray-100'}`}>
                      {TASK_PRIORITY_LABELS[task.priority]}
                    </span>
                    {task.current_responsible && (
                      <span className="text-xs text-gray-500">
                        Responsable: {task.current_responsible.name}
                      </span>
                    )}
                    {task.due_date && (
                      <span className={`text-xs ${task.is_overdue ? 'font-medium text-red-600' : 'text-gray-500'}`}>
                        Vence: {new Date(task.due_date).toLocaleDateString('es-PE')}
                      </span>
                    )}
                    {task.progress_percent > 0 && (
                      <span className="text-xs text-gray-500">
                        Avance: {task.progress_percent}%
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  to={`/tasks/${task.id}`}
                  className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <HiOutlineEye className="h-4 w-4" />
                  Ver
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
