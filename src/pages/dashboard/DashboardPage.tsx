import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { dashboardApi } from '../../api/dashboard';
import { Role, TASK_STATUS_LABELS } from '../../types/enums';
import type { GeneralDashboard, PersonalDashboard } from '../../types';
import { HiOutlineClipboardList, HiOutlineClock, HiOutlineExclamation, HiOutlineCheckCircle } from 'react-icons/hi';

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SuperAdminDashboard() {
  const [data, setData] = useState<GeneralDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.general().then((res) => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!data) return <p className="text-gray-500">No se pudo cargar el dashboard.</p>;

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tareas activas" value={data.total_active} icon={<HiOutlineClipboardList className="h-6 w-6 text-blue-600" />} color="bg-blue-50" />
        <StatCard label="Completadas" value={data.total_completed} icon={<HiOutlineCheckCircle className="h-6 w-6 text-green-600" />} color="bg-green-50" />
        <StatCard label="Vencidas" value={data.total_overdue} icon={<HiOutlineExclamation className="h-6 w-6 text-red-600" />} color="bg-red-50" />
        <StatCard label="Tasa de cumplimiento" value={`${data.completion_rate}%`} icon={<HiOutlineClock className="h-6 w-6 text-amber-600" />} color="bg-amber-50" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Tareas por estado</h3>
          <div className="space-y-3">
            {Object.entries(data.tasks_by_status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] ?? status}</span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Top responsables</h3>
          <div className="space-y-3">
            {data.top_responsible.map((r) => (
              <div key={r.user_id} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{r.user_name}</span>
                <span className="text-sm font-medium text-gray-900">{r.task_count} tareas</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Tareas por área</h3>
          <div className="space-y-3">
            {data.tasks_by_area.map((a) => (
              <div key={a.area_id} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{a.area_name}</span>
                <span className="text-sm font-medium text-gray-900">{a.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Métricas</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Promedio días para cerrar</span>
              <span className="text-sm font-medium text-gray-900">{data.avg_days_to_close} días</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completadas este mes</span>
              <span className="text-sm font-medium text-gray-900">{data.completed_this_month}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Próximas a vencer</span>
              <span className="text-sm font-medium text-gray-900">{data.total_due_soon}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function PersonalDashboardView() {
  const [data, setData] = useState<PersonalDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.personal().then((res) => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!data) return <p className="text-gray-500">No se pudo cargar el dashboard.</p>;

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tareas activas" value={data.active_tasks} icon={<HiOutlineClipboardList className="h-6 w-6 text-blue-600" />} color="bg-blue-50" />
        <StatCard label="Completadas" value={data.completed_tasks} icon={<HiOutlineCheckCircle className="h-6 w-6 text-green-600" />} color="bg-green-50" />
        <StatCard label="Vencidas" value={data.overdue_tasks} icon={<HiOutlineExclamation className="h-6 w-6 text-red-600" />} color="bg-red-50" />
        <StatCard label="Próximas a vencer" value={data.due_soon_tasks} icon={<HiOutlineClock className="h-6 w-6 text-amber-600" />} color="bg-amber-50" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Mis tareas por estado</h3>
          <div className="space-y-3">
            {Object.entries(data.tasks_by_status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] ?? status}</span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Próximas tareas</h3>
          <div className="space-y-3">
            {data.upcoming_tasks.length === 0 && (
              <p className="text-sm text-gray-400">Sin tareas próximas</p>
            )}
            {data.upcoming_tasks.map((t) => (
              <Link key={t.id} to={`/tasks/${t.id}`} className="block rounded-lg border p-3 transition-colors hover:bg-gray-50">
                <p className="text-sm font-medium text-gray-900">{t.title}</p>
                <div className="mt-1 flex gap-2 text-xs text-gray-500">
                  <span>{TASK_STATUS_LABELS[t.status as keyof typeof TASK_STATUS_LABELS] ?? t.status}</span>
                  {t.due_date && <span>· Vence: {new Date(t.due_date).toLocaleDateString('es-PE')}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function ManagerDashboardView() {
  const [personalData, setPersonalData] = useState<PersonalDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.personal().then((res) => {
      setPersonalData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (!personalData) return <p className="text-gray-500">No se pudo cargar el dashboard.</p>;

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tareas activas" value={personalData.active_tasks} icon={<HiOutlineClipboardList className="h-6 w-6 text-blue-600" />} color="bg-blue-50" />
        <StatCard label="Completadas" value={personalData.completed_tasks} icon={<HiOutlineCheckCircle className="h-6 w-6 text-green-600" />} color="bg-green-50" />
        <StatCard label="Vencidas" value={personalData.overdue_tasks} icon={<HiOutlineExclamation className="h-6 w-6 text-red-600" />} color="bg-red-50" />
        <StatCard label="Próximas a vencer" value={personalData.due_soon_tasks} icon={<HiOutlineClock className="h-6 w-6 text-amber-600" />} color="bg-amber-50" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Tareas por estado</h3>
          <div className="space-y-3">
            {Object.entries(personalData.tasks_by_status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{TASK_STATUS_LABELS[status as keyof typeof TASK_STATUS_LABELS] ?? status}</span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Próximas tareas</h3>
          <div className="space-y-3">
            {personalData.upcoming_tasks.length === 0 && (
              <p className="text-sm text-gray-400">Sin tareas próximas</p>
            )}
            {personalData.upcoming_tasks.map((t) => (
              <Link key={t.id} to={`/tasks/${t.id}`} className="block rounded-lg border p-3 transition-colors hover:bg-gray-50">
                <p className="text-sm font-medium text-gray-900">{t.title}</p>
                <div className="mt-1 flex gap-2 text-xs text-gray-500">
                  <span>{TASK_STATUS_LABELS[t.status as keyof typeof TASK_STATUS_LABELS] ?? t.status}</span>
                  {t.due_date && <span>· Vence: {new Date(t.due_date).toLocaleDateString('es-PE')}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-200" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-xl bg-gray-200" />
        <div className="h-64 rounded-xl bg-gray-200" />
      </div>
    </div>
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
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">
        ¡Bienvenido, {user?.name}!
      </h2>
      {renderDashboard()}
    </div>
  );
}
