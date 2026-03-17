import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { dashboardApi } from '../../api/dashboard';
import { TASK_STATUS_LABELS } from '../../types/enums';
import type { ConsolidatedDashboard } from '../../types';
import { PageTransition, FadeIn, SkeletonStatCards, SkeletonTable } from '../../components/ui';

export function ConsolidatedPage() {
  const [data, setData] = useState<ConsolidatedDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.consolidated()
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-gray-200" />
        <SkeletonStatCards />
        <SkeletonTable />
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">No se pudo cargar el consolidado.</p>;

  const statCards = [
    { label: 'Total', value: data.summary.total, color: 'from-gray-500 to-gray-600', bg: 'bg-gray-50' },
    { label: 'Completadas', value: data.summary.completed, color: 'from-green-500 to-emerald-600', bg: 'bg-green-50' },
    { label: 'Activas', value: data.summary.active, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50' },
    { label: 'Vencidas', value: data.summary.overdue, color: 'from-red-500 to-rose-600', bg: 'bg-red-50' },
    { label: 'Cumplimiento', value: `${data.summary.completion_rate}%`, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50' },
  ];

  return (
    <PageTransition>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Dashboard Consolidado</h2>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`rounded-2xl ${card.bg} p-5 text-center ring-1 ring-inset ring-gray-900/5`}
          >
            <p className={`bg-linear-to-r ${card.color} bg-clip-text text-3xl font-bold text-transparent`}>{card.value}</p>
            <p className="mt-1 text-sm font-medium text-gray-500">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <FadeIn delay={0.2} className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50/80">
            <tr>
              <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Área/Proceso</th>
              <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Encargado</th>
              <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Total</th>
              {Object.values(TASK_STATUS_LABELS).map((label) => (
                <th key={label} className="whitespace-nowrap px-3 py-3.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 text-center">{label}</th>
              ))}
              <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Cierre %</th>
              <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Vencidas</th>
              <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Sin avance</th>
              <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Días más vieja</th>
              <th className="whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Prom. sin reporte</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.areas.map((area) => (
              <tr key={area.area_id} className="transition-colors hover:bg-gray-50/50">
                <td className="whitespace-nowrap px-4 py-3.5">
                  <p className="font-medium text-gray-900">{area.area_name}</p>
                  {area.process_identifier && <p className="text-xs text-gray-400">{area.process_identifier}</p>}
                </td>
                <td className="whitespace-nowrap px-4 py-3.5">
                  {area.manager_name ? (
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-xs font-medium text-indigo-600">{area.manager_name.charAt(0)}</span>
                      <span className="text-gray-700">{area.manager_name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-center font-semibold text-gray-900">{area.total}</td>
                {Object.keys(TASK_STATUS_LABELS).map((status) => (
                  <td key={status} className="px-3 py-3.5 text-center text-gray-600">
                    {(area.by_status[status] ?? 0) > 0 ? area.by_status[status] : <span className="text-gray-300">0</span>}
                  </td>
                ))}
                <td className="px-4 py-3.5 text-center">
                  <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${area.completion_rate >= 80 ? 'bg-green-50 text-green-600' : area.completion_rate >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                    {area.completion_rate}%
                  </span>
                </td>
                <td className={`px-4 py-3.5 text-center ${area.overdue > 0 ? 'font-semibold text-red-600' : 'text-gray-400'}`}>{area.overdue}</td>
                <td className={`px-4 py-3.5 text-center ${area.without_progress > 0 ? 'font-semibold text-amber-600' : 'text-gray-400'}`}>{area.without_progress}</td>
                <td className="px-4 py-3.5 text-center text-gray-600">{area.max_age_days}</td>
                <td className="px-4 py-3.5 text-center text-gray-600">{area.avg_days_without_report}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </FadeIn>
    </PageTransition>
  );
}
