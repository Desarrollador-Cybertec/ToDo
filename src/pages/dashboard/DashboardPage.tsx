import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/useAuth';
import { dashboardApi } from '../../api/dashboard';
import { Role, TASK_STATUS_LABELS } from '../../types/enums';
import type { GeneralDashboard, PersonalDashboard } from '../../types';
import { HiOutlineClipboardList, HiOutlineClock, HiOutlineExclamation, HiOutlineCheckCircle, HiOutlineChevronRight } from 'react-icons/hi';
import { PageTransition, FadeIn, StaggerList, StaggerItem } from '../../components/ui';
import { SkeletonDashboard, Badge, STATUS_BADGE_VARIANT } from '../../components/ui';

function StatCard({ label, value, icon, color, delay = 0 }: { label: string; value: number | string; icon: React.ReactNode; color: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} transition-transform group-hover:scale-105`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}

function DashboardCard({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <FadeIn delay={delay} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
      {children}
    </FadeIn>
  );
}

function SuperAdminDashboard() {
  const [data, setData] = useState<GeneralDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.general().then((res) => {
      setData(res);
      setLoading(false);
    }).catch((err) => {
      console.error('Dashboard general error:', err);
      setLoading(false);
    });
  }, []);

  if (loading) return <SkeletonDashboard />;
  if (!data) return <p className="text-gray-500">No se pudo cargar el dashboard.</p>;

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tareas activas" value={data.total_active ?? 0} icon={<HiOutlineClipboardList className="h-6 w-6 text-blue-600" />} color="bg-blue-50" delay={0} />
        <StatCard label="Completadas" value={data.total_completed ?? 0} icon={<HiOutlineCheckCircle className="h-6 w-6 text-green-600" />} color="bg-green-50" delay={0.05} />
        <StatCard label="Vencidas" value={data.total_overdue ?? 0} icon={<HiOutlineExclamation className="h-6 w-6 text-red-600" />} color="bg-red-50" delay={0.1} />
        <StatCard label="Tasa de cumplimiento" value={`${data.completion_rate ?? 0}%`} icon={<HiOutlineClock className="h-6 w-6 text-amber-600" />} color="bg-amber-50" delay={0.15} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Tareas por estado" delay={0.2}>
          <StaggerList className="space-y-3">
            {Object.entries(data.tasks_by_status ?? {}).map(([status, count]) => (
              <StaggerItem key={status}>
                <div className="flex items-center justify-between rounded-lg px-1 py-0.5">
                  <Badge variant={STATUS_BADGE_VARIANT[status]}>{TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] ?? status}</Badge>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </DashboardCard>

        <DashboardCard title="Top responsables" delay={0.25}>
          <StaggerList className="space-y-3">
            {(data.top_responsible ?? []).map((r) => (
              <StaggerItem key={r.user_id}>
                <div className="flex items-center justify-between rounded-lg px-1 py-0.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-medium text-blue-600">
                      {r.user_name.charAt(0)}
                    </div>
                    <span className="text-sm text-gray-700">{r.user_name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{r.task_count}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </DashboardCard>

        <DashboardCard title="Tareas por área" delay={0.3}>
          <StaggerList className="space-y-3">
            {(data.tasks_by_area ?? []).map((a) => (
              <StaggerItem key={a.area_id}>
                <div className="flex items-center justify-between rounded-lg px-1 py-0.5">
                  <span className="text-sm text-gray-700">{a.area_name}</span>
                  <span className="text-sm font-medium text-gray-900">{a.count}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </DashboardCard>

        <DashboardCard title="Métricas" delay={0.35}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Promedio días para cerrar</span>
              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-semibold text-blue-700">{data.avg_days_to_close ?? 0} días</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completadas este mes</span>
              <span className="rounded-lg bg-green-50 px-2.5 py-1 text-sm font-semibold text-green-700">{data.completed_this_month ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Próximas a vencer</span>
              <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-700">{data.total_due_soon ?? 0}</span>
            </div>
          </div>
        </DashboardCard>
      </div>
    </>
  );
}

function PersonalDashboardView() {
  const [data, setData] = useState<PersonalDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.personal().then((res) => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonDashboard />;
  if (!data) return <p className="text-gray-500">No se pudo cargar el dashboard.</p>;

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tareas activas" value={data.active_tasks ?? 0} icon={<HiOutlineClipboardList className="h-6 w-6 text-blue-600" />} color="bg-blue-50" delay={0} />
        <StatCard label="Completadas" value={data.completed_tasks ?? 0} icon={<HiOutlineCheckCircle className="h-6 w-6 text-green-600" />} color="bg-green-50" delay={0.05} />
        <StatCard label="Vencidas" value={data.overdue_tasks ?? 0} icon={<HiOutlineExclamation className="h-6 w-6 text-red-600" />} color="bg-red-50" delay={0.1} />
        <StatCard label="Próximas a vencer" value={data.due_soon_tasks ?? 0} icon={<HiOutlineClock className="h-6 w-6 text-amber-600" />} color="bg-amber-50" delay={0.15} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Mis tareas por estado" delay={0.2}>
          <StaggerList className="space-y-3">
            {Object.entries(data.tasks_by_status ?? {}).map(([status, count]) => (
              <StaggerItem key={status}>
                <div className="flex items-center justify-between rounded-lg px-1 py-0.5">
                  <Badge variant={STATUS_BADGE_VARIANT[status]}>{TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] ?? status}</Badge>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </DashboardCard>

        <DashboardCard title="Próximas tareas" delay={0.25}>
          {(data.upcoming_tasks ?? []).length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">Sin tareas próximas</p>
          ) : (
            <StaggerList className="space-y-2">
              {(data.upcoming_tasks ?? []).map((t) => (
                <StaggerItem key={t.id}>
                  <Link to={`/tasks/${t.id}`} className="group flex items-center justify-between rounded-xl border border-gray-100 p-3.5 transition-all hover:border-blue-100 hover:bg-blue-50/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700">{t.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={STATUS_BADGE_VARIANT[t.status]}>{TASK_STATUS_LABELS[t.status as keyof typeof TASK_STATUS_LABELS] ?? t.status}</Badge>
                        {t.due_date && <span className="text-xs text-gray-500">Vence: {new Date(t.due_date).toLocaleDateString('es-PE')}</span>}
                      </div>
                    </div>
                    <HiOutlineChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-blue-500" />
                  </Link>
                </StaggerItem>
              ))}
            </StaggerList>
          )}
        </DashboardCard>
      </div>
    </>
  );
}

function ManagerDashboardView() {
  const [personalData, setPersonalData] = useState<PersonalDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.personal().then((res) => {
      setPersonalData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonDashboard />;
  if (!personalData) return <p className="text-gray-500">No se pudo cargar el dashboard.</p>;

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tareas activas" value={personalData.active_tasks ?? 0} icon={<HiOutlineClipboardList className="h-6 w-6 text-blue-600" />} color="bg-blue-50" delay={0} />
        <StatCard label="Completadas" value={personalData.completed_tasks ?? 0} icon={<HiOutlineCheckCircle className="h-6 w-6 text-green-600" />} color="bg-green-50" delay={0.05} />
        <StatCard label="Vencidas" value={personalData.overdue_tasks ?? 0} icon={<HiOutlineExclamation className="h-6 w-6 text-red-600" />} color="bg-red-50" delay={0.1} />
        <StatCard label="Próximas a vencer" value={personalData.due_soon_tasks ?? 0} icon={<HiOutlineClock className="h-6 w-6 text-amber-600" />} color="bg-amber-50" delay={0.15} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Tareas por estado" delay={0.2}>
          <StaggerList className="space-y-3">
            {Object.entries(personalData.tasks_by_status ?? {}).map(([status, count]) => (
              <StaggerItem key={status}>
                <div className="flex items-center justify-between rounded-lg px-1 py-0.5">
                  <Badge variant={STATUS_BADGE_VARIANT[status]}>{TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] ?? status}</Badge>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </DashboardCard>

        <DashboardCard title="Próximas tareas" delay={0.25}>
          {(personalData.upcoming_tasks ?? []).length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-400">Sin tareas próximas</p>
          ) : (
            <StaggerList className="space-y-2">
              {(personalData.upcoming_tasks ?? []).map((t) => (
                <StaggerItem key={t.id}>
                  <Link to={`/tasks/${t.id}`} className="group flex items-center justify-between rounded-xl border border-gray-100 p-3.5 transition-all hover:border-blue-100 hover:bg-blue-50/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700">{t.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={STATUS_BADGE_VARIANT[t.status]}>{TASK_STATUS_LABELS[t.status as keyof typeof TASK_STATUS_LABELS] ?? t.status}</Badge>
                        {t.due_date && <span className="text-xs text-gray-500">Vence: {new Date(t.due_date).toLocaleDateString('es-PE')}</span>}
                      </div>
                    </div>
                    <HiOutlineChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-blue-500" />
                  </Link>
                </StaggerItem>
              ))}
            </StaggerList>
          )}
        </DashboardCard>
      </div>
    </>
  );
}

export function DashboardPage() {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role.slug) {
      case Role.SUPERADMIN:
        return <SuperAdminDashboard />;
      case Role.AREA_MANAGER:
        return <ManagerDashboardView />;
      default:
        return <PersonalDashboardView />;
    }
  };

  return (
    <PageTransition>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">
        ¡Bienvenido, {user?.name}!
      </h2>
      {renderDashboard()}
    </PageTransition>
  );
}
