import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { tasksApi } from '../../api/tasks';
import { areasApi } from '../../api/areas';
import { useAuth } from '../../context/useAuth';
import { Role, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../types/enums';
import type { Task, Area } from '../../types';
import {
  HiOutlinePlus,
  HiOutlineEye,
  HiOutlineClipboardList,
  HiOutlinePencil,
  HiOutlineSearch,
  HiOutlineClock,
  HiOutlineExclamation,
} from 'react-icons/hi';
import { PageTransition, StaggerList, StaggerItem, FadeIn } from '../../components/ui';
import { SkeletonList, Badge, STATUS_BADGE_VARIANT, PRIORITY_BADGE_VARIANT } from '../../components/ui';
import { TaskStatusSelect } from '../../components/tasks/TaskStatusSelect';

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `Hace ${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? 's' : ''}`;
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Mañana';
  const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  if (diffDays <= 6) return weekdays[date.getDay()];
  return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

export function TaskListPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterAreaId, setFilterAreaId] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('');
  const [search, setSearch] = useState('');

  const canCreate = user?.role.slug === Role.SUPERADMIN || user?.role.slug === Role.AREA_MANAGER || user?.role.slug === Role.WORKER;
  const isSuperadmin = user?.role.slug === Role.SUPERADMIN;
  const isManager = user?.role.slug === Role.AREA_MANAGER;
  const canEdit = isSuperadmin || isManager;

  useEffect(() => {
    if (isSuperadmin) {
      areasApi.listAll()
        .then((res) => setAreas(Array.isArray(res) ? res : []))
        .catch(() => setAreas([]));
    }
  }, [isSuperadmin]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterAreaId) params.set('area_id', filterAreaId);
    if (filterPriority) params.set('priority', filterPriority);
    if (sortBy) params.set('sort', sortBy);

    tasksApi.list(params.toString())
      .then((res) => { if (!cancelled) { setTasks(res.data); setLoading(false); } })
      .catch(() => { if (!cancelled) { setTasks([]); setLoading(false); } });
    return () => { cancelled = true; };
  }, [filterStatus, filterAreaId, filterPriority, sortBy]);

  const filteredTasks = useMemo(() => {
    if (!search.trim()) return tasks;
    const q = search.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.current_responsible?.name.toLowerCase().includes(q) ||
        t.area?.name?.toLowerCase().includes(q)
    );
  }, [tasks, search]);

  const hasActiveFilters = !!filterStatus || !!filterAreaId || !!filterPriority || !!sortBy;

  const clearFilters = () => {
    setFilterStatus('');
    setFilterAreaId('');
    setFilterPriority('');
    setSortBy('');
    setSearch('');
  };

  return (
    <PageTransition>
      {/* Header */}
      <FadeIn className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <HiOutlineClipboardList className="h-7 w-7 text-blue-600" />
            Gestión de tareas
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {isSuperadmin ? 'Crea, asigna y gestiona tareas fácilmente' : isManager ? 'Administra las tareas de tu equipo' : 'Revisa y actualiza tus tareas asignadas'}
          </p>
        </div>
        {canCreate && (
          <Link
            to="/tasks/create"
            className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-500/25 transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Nueva tarea
          </Link>
        )}
      </FadeIn>

      {/* Search + Filters */}
      <FadeIn delay={0.05} className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative min-w-50 flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar tarea..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          {/* Filters */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none"
          >
            <option value="">Estado</option>
            {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none"
          >
            <option value="">Prioridad</option>
            {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {isSuperadmin && (
            <select
              value={filterAreaId}
              onChange={(e) => setFilterAreaId(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none"
            >
              <option value="">Área</option>
              {areas.filter((a) => a.active).map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          )}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm transition-colors focus:border-blue-500 focus:bg-white focus:outline-none"
          >
            <option value="">Más recientes</option>
            <option value="oldest">Más antiguas</option>
            <option value="due_date">Fecha de vencimiento</option>
            <option value="priority">Prioridad</option>
          </select>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl px-3 py-2.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </FadeIn>

      {/* Task list */}
      <AnimatePresence mode="wait">
        {loading ? (
          <SkeletonList count={5} />
        ) : filteredTasks.length === 0 ? (
          /* Empty state */
          <FadeIn className="rounded-2xl border-2 border-dashed border-gray-200 bg-white px-6 py-16">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50">
                <HiOutlineClipboardList className="h-10 w-10 text-blue-400" />
              </div>
              {tasks.length === 0 && !hasActiveFilters ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-900">Aún no hay tareas</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {canEdit
                      ? 'Empieza creando la primera tarea para tu equipo. Podrás asignar responsables, fechas y hacer seguimiento.'
                      : 'Cuando te asignen tareas, aparecerán aquí. Podrás ver el detalle y reportar tu avance.'}
                  </p>
                  {canCreate && (
                    <Link
                      to="/tasks/create"
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-blue-500/25 transition-all hover:shadow-lg hover:shadow-blue-500/30 active:scale-[0.98]"
                    >
                      <HiOutlinePlus className="h-4 w-4" /> Crear primera tarea
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-900">Sin resultados</h3>
                  <p className="mt-2 text-sm text-gray-500">No se encontraron tareas con los filtros actuales.</p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Limpiar filtros
                  </button>
                </>
              )}
            </div>
          </FadeIn>
        ) : (
          <FadeIn delay={0.1} className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            {/* List header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3">
              <p className="text-xs font-medium text-gray-400">
                {filteredTasks.length} tarea{filteredTasks.length !== 1 ? 's' : ''}
                {search && ` para "${search}"`}
              </p>
            </div>
            {/* Rows */}
            <StaggerList className="divide-y divide-gray-50">
              {filteredTasks.map((task) => (
                <StaggerItem key={task.id}>
                  <div className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-blue-50/30">
                    {/* Left: info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link to={`/tasks/${task.id}`} className="truncate text-sm font-medium text-gray-900 transition-colors group-hover:text-blue-700">
                          {task.title}
                        </Link>
                        {task.is_overdue && (
                          <span className="flex shrink-0 items-center gap-0.5 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 ring-1 ring-inset ring-red-200">
                            <HiOutlineExclamation className="h-3 w-3" /> Vencida
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        {task.current_responsible && (
                          <span className="flex items-center gap-1">
                            <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gray-200 text-[9px] font-semibold text-gray-600">
                              {task.current_responsible.name.charAt(0)}
                            </span>
                            {task.current_responsible.name}
                          </span>
                        )}
                        {task.due_date && (
                          <span className={`flex items-center gap-1 ${task.is_overdue ? 'font-medium text-red-600' : ''}`}>
                            <HiOutlineClock className="h-3.5 w-3.5" />
                            {formatRelativeDate(task.due_date)}
                          </span>
                        )}
                        {(task.area?.name || task.assigned_area?.name) && (
                          <span>{task.area?.name ?? task.assigned_area?.name}</span>
                        )}
                      </div>
                      {/* Progress + badges row */}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant={STATUS_BADGE_VARIANT[task.status]} size="sm">
                          {TASK_STATUS_LABELS[task.status]}
                        </Badge>
                        <Badge variant={PRIORITY_BADGE_VARIANT[task.priority]} size="sm">
                          {TASK_PRIORITY_LABELS[task.priority]}
                        </Badge>
                        {task.progress_percent > 0 && (
                          <span className="flex items-center gap-1.5 text-xs text-gray-500">
                            <div className="h-1.5 w-16 rounded-full bg-gray-200">
                              <div
                                className={`h-1.5 rounded-full transition-all ${task.progress_percent >= 100 ? 'bg-green-500' : task.progress_percent >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(task.progress_percent, 100)}%` }}
                              />
                            </div>
                            <span className="font-medium">{task.progress_percent}%</span>
                          </span>
                        )}
                        {task.requires_attachment && (
                          <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">Adjunto obligatorio</span>
                        )}
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      <TaskStatusSelect
                        task={task}
                        userId={user?.id}
                        userRole={user?.role.slug}
                        onUpdated={(updated) =>
                          setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
                        }
                      />
                      <Link
                        to={`/tasks/${task.id}`}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <HiOutlineEye className="h-3.5 w-3.5" />
                        Ver
                      </Link>
                      {canEdit && (
                        <Link
                          to={`/tasks/${task.id}?edit=1`}
                          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-blue-700 active:scale-[0.97]"
                        >
                          <HiOutlinePencil className="h-3.5 w-3.5" />
                          Editar
                        </Link>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          </FadeIn>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
