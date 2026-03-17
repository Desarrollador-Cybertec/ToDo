import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { tasksApi } from '../../api/tasks';
import { areasApi } from '../../api/areas';
import { useAuth } from '../../context/useAuth';
import { Role, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../types/enums';
import type { Task, Area } from '../../types';
import { HiOutlinePlus, HiOutlineFilter, HiOutlineEye, HiOutlineClipboardList, HiOutlinePencil } from 'react-icons/hi';
import { PageTransition, StaggerList, StaggerItem } from '../../components/ui';
import { SkeletonList, EmptyState, Badge, STATUS_BADGE_VARIANT, PRIORITY_BADGE_VARIANT } from '../../components/ui';

export function TaskListPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterAreaId, setFilterAreaId] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');

  const canCreate = user?.role.slug === Role.SUPERADMIN || user?.role.slug === Role.AREA_MANAGER;
  const isSuperadmin = user?.role.slug === Role.SUPERADMIN;

  useEffect(() => {
    if (isSuperadmin) {
      areasApi.list()
        .then((res) => setAreas(Array.isArray(res) ? res : []))
        .catch(() => setAreas([]));
    }
  }, [isSuperadmin]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterAreaId) params.set('area_id', filterAreaId);
    if (sortBy) params.set('sort', sortBy);
    
    tasksApi.list(params.toString())
      .then((res) => { if (!cancelled) setTasks(res); })
      .catch(() => { if (!cancelled) setTasks([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filterStatus, filterAreaId, sortBy]);

  return (
    <PageTransition>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Tareas</h2>
        {canCreate && (
          <Link
            to="/tasks/create"
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-500/25 transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Nueva tarea
          </Link>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
        <HiOutlineFilter className="h-5 w-5 text-gray-400" />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none"
        >
          <option value="">Todos los estados</option>
          {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {isSuperadmin && (
          <select
            value={filterAreaId}
            onChange={(e) => setFilterAreaId(e.target.value)}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none"
          >
            <option value="">Todas las áreas</option>
            {areas.filter((a) => a.active).map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        )}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none"
        >
          <option value="">Más recientes</option>
          <option value="oldest">Más antiguas</option>
          <option value="due_date">Fecha de vencimiento</option>
          <option value="priority">Prioridad</option>
        </select>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <SkeletonList count={5} />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={<HiOutlineClipboardList className="h-8 w-8" />}
            title="No hay tareas"
            description="No se encontraron tareas con los filtros actuales."
            action={
              canCreate ? (
                <Link to="/tasks/create" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
                  <HiOutlinePlus className="h-4 w-4" /> Nueva tarea
                </Link>
              ) : undefined
            }
          />
        ) : (
          <StaggerList className="space-y-3">
            {tasks.map((task) => (
              <StaggerItem key={task.id}>
                <div className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-blue-100 hover:shadow-md">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <Link to={`/tasks/${task.id}`} className="text-base font-medium text-gray-900 transition-colors hover:text-blue-600">
                        {task.title}
                      </Link>
                      {task.description && (
                        <p className="mt-1 line-clamp-1 text-sm text-gray-500">{task.description}</p>
                      )}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <Badge variant={STATUS_BADGE_VARIANT[task.status]}>
                          {TASK_STATUS_LABELS[task.status]}
                        </Badge>
                        <Badge variant={PRIORITY_BADGE_VARIANT[task.priority]}>
                          {TASK_PRIORITY_LABELS[task.priority]}
                        </Badge>
                        {task.current_responsible && (
                          <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-medium text-gray-600">
                              {task.current_responsible.name.charAt(0)}
                            </span>
                            {task.current_responsible.name}
                          </span>
                        )}
                        {task.due_date && (
                          <span className={`text-xs ${task.is_overdue ? 'font-medium text-red-600' : 'text-gray-500'}`}>
                            Vence: {new Date(task.due_date).toLocaleDateString('es-PE')}
                          </span>
                        )}
                        {task.progress_percent > 0 && (
                          <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <div className="h-1.5 w-12 rounded-full bg-gray-200">
                              <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${task.progress_percent}%` }} />
                            </div>
                            {task.progress_percent}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canCreate && (
                        <Link
                          to={`/tasks/${task.id}?edit=1`}
                          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-sm text-gray-500 transition-all hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
                        >
                          <HiOutlinePencil className="h-4 w-4" />
                          Editar
                        </Link>
                      )}
                      <Link
                        to={`/tasks/${task.id}`}
                        className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-sm text-gray-500 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <HiOutlineEye className="h-4 w-4" />
                        Ver
                      </Link>
                    </div>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
