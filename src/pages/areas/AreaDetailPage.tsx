import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { areasApi } from '../../api/areas';
import { tasksApi } from '../../api/tasks';
import { usersApi } from '../../api/users';
import { dashboardApi } from '../../api/dashboard';
import { useAuth } from '../../context/useAuth';
import { Role, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../types/enums';
import { ApiError } from '../../api/client';
import type { Area, AreaDashboard, AreaMember, Task, User } from '../../types';
import { HiOutlineArrowLeft, HiOutlineExclamationCircle, HiOutlineCheckCircle, HiOutlineUserAdd, HiOutlineX } from 'react-icons/hi';
import { AnimatePresence, motion } from 'framer-motion';
import { PageTransition, FadeIn, SlideDown, Badge, STATUS_BADGE_VARIANT, PRIORITY_BADGE_VARIANT, SkeletonDetail, Spinner } from '../../components/ui';

export function AreaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [area, setArea] = useState<Area | null>(null);
  const [dashboard, setDashboard] = useState<AreaDashboard | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<AreaMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');
  const [claimUserId, setClaimUserId] = useState('');
  const [assigningTaskId, setAssigningTaskId] = useState<number | null>(null);
  const [assignToUserId, setAssignToUserId] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignMsg, setAssignMsg] = useState('');
  const [managerCandidates, setManagerCandidates] = useState<User[]>([]);
  const [showManagerSelect, setShowManagerSelect] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [managerSaving, setManagerSaving] = useState(false);
  const [managerMsg, setManagerMsg] = useState('');

  const areaId = Number(id);
  const isManager = user?.role.slug === Role.AREA_MANAGER;
  const isSuperadmin = user?.role.slug === Role.SUPERADMIN;

  const loadData = useCallback(async () => {
    try {
      const [areaRes, dashRes, tasksRes, membersRes, usersRes] = await Promise.all([
        areasApi.get(areaId),
        dashboardApi.area(areaId).catch(() => null),
        tasksApi.list(`area_id=${areaId}`).catch(() => [] as Task[]),
        areasApi.members(areaId).catch(() => [] as AreaMember[]),
        usersApi.list().catch(() => [] as User[]),
      ]);
      setArea(areaRes);
      if (dashRes) setDashboard(dashRes);
      setTasks(Array.isArray(tasksRes) ? tasksRes : []);
      setMembers(Array.isArray(membersRes) ? membersRes : []);
      const allUsers = Array.isArray(usersRes) ? usersRes : [];
      setManagerCandidates(allUsers.filter((u) => u.role.slug === Role.AREA_MANAGER && u.active));
    } catch {
      navigate('/areas');
    } finally {
      setLoading(false);
    }
  }, [areaId, navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClaim = async () => {
    if (!claimUserId) return;
    setClaimError('');
    try {
      await areasApi.claimWorker({ area_id: areaId, user_id: Number(claimUserId) });
      setClaimSuccess('Trabajador agregado al área');
      setClaimUserId('');
      loadData();
      setTimeout(() => setClaimSuccess(''), 3000);
    } catch (error) {
      setClaimError(error instanceof ApiError ? error.data.message : 'Error al reclamar trabajador');
    }
  };

  const handleAssign = async (taskId: number) => {
    if (!assignToUserId) return;
    setAssignSaving(true);
    try {
      await tasksApi.delegate(taskId, { to_user_id: Number(assignToUserId) });
      setAssignMsg('Tarea asignada');
      setAssigningTaskId(null);
      setAssignToUserId('');
      loadData();
      setTimeout(() => setAssignMsg(''), 3000);
    } catch (error) {
      setAssignMsg(error instanceof ApiError ? error.data.message : 'Error al asignar');
    } finally {
      setAssignSaving(false);
    }
  };

  const handleAssignManager = async () => {
    if (!selectedManagerId) return;
    setManagerSaving(true);
    try {
      await areasApi.assignManager(areaId, Number(selectedManagerId));
      setManagerMsg('Encargado asignado');
      setShowManagerSelect(false);
      setSelectedManagerId('');
      loadData();
      setTimeout(() => setManagerMsg(''), 3000);
    } catch (error) {
      setManagerMsg(error instanceof ApiError ? error.data.message : 'Error al asignar encargado');
    } finally {
      setManagerSaving(false);
    }
  };

  if (loading) return <SkeletonDetail />;
  if (!area) return null;

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl">
        <button type="button" onClick={() => navigate('/areas')} className="mb-4 flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900">
          <HiOutlineArrowLeft className="h-4 w-4" /> Volver a áreas
        </button>

        <FadeIn className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{area.name}</h2>
              {area.description && <p className="mt-2 text-gray-600">{area.description}</p>}
            </div>
            <Badge variant={area.active ? 'green' : 'red'} size="md">{area.active ? 'Activa' : 'Inactiva'}</Badge>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Encargado</p>
              <div className="mt-1 flex items-center gap-2">
                {area.manager ? (
                  <>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-medium text-indigo-600">{area.manager.name.charAt(0)}</span>
                    <p className="text-sm text-gray-900">{area.manager.name}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">Sin asignar</p>
                )}
                {isSuperadmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowManagerSelect(!showManagerSelect);
                      setSelectedManagerId(area.manager_user_id ? String(area.manager_user_id) : '');
                    }}
                    className="rounded-lg border border-gray-200 px-2 py-0.5 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  >
                    {showManagerSelect ? 'Cancelar' : area.manager ? 'Cambiar' : 'Asignar'}
                  </button>
                )}
              </div>
              <AnimatePresence>
                {showManagerSelect && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 overflow-hidden"
                  >
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedManagerId}
                        onChange={(e) => setSelectedManagerId(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      >
                        <option value="">— Seleccionar —</option>
                        {managerCandidates.map((u) => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleAssignManager}
                        disabled={!selectedManagerId || managerSaving}
                        className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {managerSaving ? <Spinner size="sm" /> : null}
                        Asignar
                      </button>
                    </div>
                    {managerMsg && (
                      <p className="mt-1.5 text-xs font-medium text-green-600">{managerMsg}</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {area.process_identifier && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Proceso</p>
                <p className="mt-1 text-sm text-gray-900">{area.process_identifier}</p>
              </div>
            )}
          </div>
        </FadeIn>

        {isManager && (
          <FadeIn delay={0.05} className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-900">Reclamar trabajador</h3>
            <AnimatePresence>
              {claimError && (
                <SlideDown>
                  <div className="mb-3 flex items-center gap-2 rounded-xl bg-red-50 p-2 text-sm text-red-600 ring-1 ring-inset ring-red-200">
                    <HiOutlineExclamationCircle className="h-4 w-4 shrink-0" /> {claimError}
                  </div>
                </SlideDown>
              )}
              {claimSuccess && (
                <SlideDown>
                  <div className="mb-3 flex items-center gap-2 rounded-xl bg-green-50 p-2 text-sm text-green-600 ring-1 ring-inset ring-green-200">
                    <HiOutlineCheckCircle className="h-4 w-4 shrink-0" /> {claimSuccess}
                  </div>
                </SlideDown>
              )}
            </AnimatePresence>
            <div className="flex gap-3">
              <input
                type="number"
                value={claimUserId}
                onChange={(e) => setClaimUserId(e.target.value)}
                placeholder="ID del trabajador"
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button type="button" onClick={handleClaim} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]">
                Reclamar
              </button>
            </div>
          </FadeIn>
        )}

        {dashboard && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <FadeIn delay={0.1} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Tareas por estado</h3>
              <div className="space-y-2.5">
                {Object.entries(dashboard.tasks_by_status ?? {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <Badge variant={STATUS_BADGE_VARIANT[status] ?? 'gray'} size="sm">{TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] ?? status}</Badge>
                    <span className="font-semibold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={0.15} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Métricas</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Tasa de cumplimiento</span>
                  <span className="rounded-lg bg-green-50 px-2 py-0.5 font-semibold text-green-700">{dashboard.completion_rate ?? 0}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Vencidas</span>
                  <span className="rounded-lg bg-red-50 px-2 py-0.5 font-semibold text-red-600">{dashboard.overdue_tasks ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Sin avance</span>
                  <span className="rounded-lg bg-amber-50 px-2 py-0.5 font-semibold text-amber-600">{dashboard.tasks_without_progress ?? 0}</span>
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.2} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
              <h3 className="mb-4 font-semibold text-gray-900">Distribución por responsable</h3>
              <div className="space-y-2.5">
                {(dashboard.tasks_by_responsible ?? []).map((r) => (
                  <div key={r.user_id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-medium text-blue-600">{r.user_name.charAt(0)}</span>
                      <span className="text-gray-700">{r.user_name}</span>
                    </div>
                    <span className="rounded-lg bg-blue-50 px-2 py-0.5 font-semibold text-blue-700">{r.active_tasks}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        )}

        {/* Tasks list */}
        <FadeIn delay={0.25} className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
            <h3 className="font-semibold text-gray-900">Tareas del área</h3>
            <span className="rounded-lg bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">{tasks.length}</span>
          </div>

          {/* assign feedback */}
          <AnimatePresence>
            {assignMsg && (
              <SlideDown>
                <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-sm text-green-700 ring-1 ring-inset ring-green-200">
                  <HiOutlineCheckCircle className="h-4 w-4 shrink-0" /> {assignMsg}
                </div>
              </SlideDown>
            )}
          </AnimatePresence>

          {tasks.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">No hay tareas registradas para esta área.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {tasks.map((task) => (
                <div key={task.id} className="px-6 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: title + badges */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{task.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Badge variant={STATUS_BADGE_VARIANT[task.status] ?? 'gray'} size="sm">
                          {TASK_STATUS_LABELS[task.status] ?? task.status}
                        </Badge>
                        <Badge variant={PRIORITY_BADGE_VARIANT[task.priority] ?? 'gray'} size="sm">
                          {TASK_PRIORITY_LABELS[task.priority]}
                        </Badge>
                        {task.due_date && (
                          <span className={`text-xs ${task.is_overdue ? 'font-semibold text-red-600' : 'text-gray-400'}`}>
                            Vence: {new Date(task.due_date).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: responsible + assign button */}
                    <div className="flex shrink-0 items-center gap-3">
                      {task.current_responsible ? (
                        <div className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-200 text-xs font-bold text-indigo-700">
                            {task.current_responsible.name.charAt(0)}
                          </span>
                          <span className="text-xs font-medium text-indigo-700">{task.current_responsible.name}</span>
                        </div>
                      ) : (
                        <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-400">Sin asignar</span>
                      )}
                      {isManager && (
                        <button
                          type="button"
                          onClick={() => {
                            setAssigningTaskId(assigningTaskId === task.id ? null : task.id);
                            setAssignToUserId('');
                          }}
                          className={`rounded-lg p-1.5 transition-colors ${assigningTaskId === task.id ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'border border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                          title={assigningTaskId === task.id ? 'Cancelar' : 'Asignar'}
                        >
                          {assigningTaskId === task.id ? <HiOutlineX className="h-4 w-4" /> : <HiOutlineUserAdd className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline assign row */}
                  <AnimatePresence>
                    {assigningTaskId === task.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                          <select
                            value={assignToUserId}
                            onChange={(e) => setAssignToUserId(e.target.value)}
                            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          >
                            <option value="">— Seleccionar miembro —</option>
                            {members.filter((m) => m.is_active).map((m) => (
                              <option key={m.user_id} value={m.user_id}>{m.user.name}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleAssign(task.id)}
                            disabled={!assignToUserId || assignSaving}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-50"
                          >
                            {assignSaving ? <Spinner size="sm" /> : null}
                            Asignar
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </FadeIn>
      </div>
    </PageTransition>
  );
}
