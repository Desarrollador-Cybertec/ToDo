import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { dashboardApi } from '../../api/dashboard';
import type { ConsolidatedDashboard } from '../../types';
import { PageTransition, FadeIn, SkeletonStatCards, SkeletonTable } from '../../components/ui';

interface ApiSummary {
  total_tasks: number;
  total_completed: number;
  total_active: number;
  total_overdue: number;
  global_completion_rate: number;
}

interface ApiArea {
  area_id: number;
  area_name: string;
  process_identifier: string | null;
  manager: string | null;
  total: number;
  completed: number;
  active: number;
  overdue: number;
  completion_rate: number;
}

interface ApiConsolidated {
  summary: ApiSummary;
  by_area: ApiArea[];
}

export function ConsolidatedPage() {
  const [data, setData] = useState<ApiConsolidated | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.consolidated()
      .then((res) => {
        const raw = res as unknown as ApiConsolidated | ConsolidatedDashboard;
        // Normalize: API may return by_area or areas, and different summary field names
        const normalized: ApiConsolidated = {
          summary: {
            total_tasks: (raw.summary as ApiSummary)?.total_tasks ?? (raw.summary as ConsolidatedDashboard['summary'])?.total ?? 0,
            total_completed: (raw.summary as ApiSummary)?.total_completed ?? (raw.summary as ConsolidatedDashboard['summary'])?.completed ?? 0,
            total_active: (raw.summary as ApiSummary)?.total_active ?? (raw.summary as ConsolidatedDashboard['summary'])?.active ?? 0,
            total_overdue: (raw.summary as ApiSummary)?.total_overdue ?? (raw.summary as ConsolidatedDashboard['summary'])?.overdue ?? 0,
            global_completion_rate: (raw.summary as ApiSummary)?.global_completion_rate ?? (raw.summary as ConsolidatedDashboard['summary'])?.completion_rate ?? 0,
          },
          by_area: ('by_area' in raw ? raw.by_area : 'areas' in raw ? (raw as ConsolidatedDashboard).areas : []) as ApiArea[] ?? [],
        };
        setData(normalized);
      })
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

  const { summary } = data;

  const statCards = [
    { label: 'Total', value: summary.total_tasks, bg: 'bg-gray-50', text: 'text-gray-900' },
    { label: 'Completadas', value: summary.total_completed, bg: 'bg-green-50', text: 'text-green-700' },
    { label: 'Activas', value: summary.total_active, bg: 'bg-blue-50', text: 'text-blue-700' },
    { label: 'Vencidas', value: summary.total_overdue, bg: 'bg-red-50', text: 'text-red-700' },
    { label: 'Cumplimiento', value: `${summary.global_completion_rate}%`, bg: 'bg-amber-50', text: 'text-amber-700' },
  ];

  const areas = data.by_area ?? [];

  return (
    <PageTransition>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Dashboard Consolidado</h2>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`rounded-2xl ${card.bg} p-4 text-center ring-1 ring-inset ring-gray-900/5`}
          >
            <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
            <p className="mt-0.5 text-xs font-medium text-gray-500">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {areas.length === 0 ? (
        <FadeIn className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-400">No hay áreas con datos para mostrar.</p>
        </FadeIn>
      ) : (
        <FadeIn delay={0.2} className="space-y-3">
          {areas.map((area, i) => {
            const rateColor = area.completion_rate >= 80
              ? 'bg-green-50 text-green-700'
              : area.completion_rate >= 50
              ? 'bg-amber-50 text-amber-700'
              : 'bg-red-50 text-red-700';

            return (
              <motion.div
                key={area.area_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-gray-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-sm font-bold text-indigo-600">
                      {area.area_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{area.area_name}</p>
                      <p className="text-xs text-gray-400">
                        {area.manager ? `Encargado: ${area.manager}` : 'Sin encargado'}
                        {area.process_identifier ? ` · ${area.process_identifier}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${rateColor}`}>
                    {area.completion_rate}% cumplimiento
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="rounded-xl bg-gray-50 px-3 py-2 text-center">
                    <p className="text-lg font-bold text-gray-900">{area.total}</p>
                    <p className="text-[11px] text-gray-500">Total</p>
                  </div>
                  <div className="rounded-xl bg-green-50/60 px-3 py-2 text-center">
                    <p className="text-lg font-bold text-green-700">{area.completed ?? 0}</p>
                    <p className="text-[11px] text-gray-500">Completadas</p>
                  </div>
                  <div className="rounded-xl bg-blue-50/60 px-3 py-2 text-center">
                    <p className="text-lg font-bold text-blue-700">{area.active ?? 0}</p>
                    <p className="text-[11px] text-gray-500">Activas</p>
                  </div>
                  <div className="rounded-xl bg-red-50/60 px-3 py-2 text-center">
                    <p className={`text-lg font-bold ${(area.overdue ?? 0) > 0 ? 'text-red-600' : 'text-gray-400'}`}>{area.overdue ?? 0}</p>
                    <p className="text-[11px] text-gray-500">Vencidas</p>
                  </div>
                </div>

                {area.total > 0 && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-green-400 to-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(area.completion_rate, 100)}%` }}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </FadeIn>
      )}
    </PageTransition>
  );
}
