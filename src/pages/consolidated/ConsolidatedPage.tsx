import { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/dashboard';
import { TASK_STATUS_LABELS } from '../../types/enums';
import type { ConsolidatedDashboard } from '../../types';

export function ConsolidatedPage() {
  const [data, setData] = useState<ConsolidatedDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.consolidated()
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">No se pudo cargar el consolidado.</p>;

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Dashboard Consolidado</h2>

      {/* Summary */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border bg-white p-5 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-900">{data.summary.total}</p>
          <p className="text-sm text-gray-500">Total</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm text-center">
          <p className="text-2xl font-bold text-green-600">{data.summary.completed}</p>
          <p className="text-sm text-gray-500">Completadas</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm text-center">
          <p className="text-2xl font-bold text-blue-600">{data.summary.active}</p>
          <p className="text-sm text-gray-500">Activas</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm text-center">
          <p className="text-2xl font-bold text-red-600">{data.summary.overdue}</p>
          <p className="text-sm text-gray-500">Vencidas</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm text-center">
          <p className="text-2xl font-bold text-amber-600">{data.summary.completion_rate}%</p>
          <p className="text-sm text-gray-500">Cumplimiento</p>
        </div>
      </div>

      {/* Areas table */}
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500">Área/Proceso</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500">Encargado</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-center">Total</th>
              {Object.values(TASK_STATUS_LABELS).map((label) => (
                <th key={label} className="whitespace-nowrap px-3 py-3 font-medium text-gray-500 text-center text-xs">{label}</th>
              ))}
              <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-center">Cierre %</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-center">Vencidas</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-center">Sin avance</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-center">Días más vieja</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium text-gray-500 text-center">Prom. sin reporte</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.areas.map((area) => (
              <tr key={area.area_id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3">
                  <p className="font-medium text-gray-900">{area.area_name}</p>
                  {area.process_identifier && <p className="text-xs text-gray-400">{area.process_identifier}</p>}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">{area.manager_name ?? '—'}</td>
                <td className="px-4 py-3 text-center font-medium text-gray-900">{area.total}</td>
                {Object.keys(TASK_STATUS_LABELS).map((status) => (
                  <td key={status} className="px-3 py-3 text-center text-gray-600">
                    {area.by_status[status] ?? 0}
                  </td>
                ))}
                <td className="px-4 py-3 text-center">
                  <span className={`font-medium ${area.completion_rate >= 80 ? 'text-green-600' : area.completion_rate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                    {area.completion_rate}%
                  </span>
                </td>
                <td className={`px-4 py-3 text-center ${area.overdue > 0 ? 'font-medium text-red-600' : 'text-gray-600'}`}>{area.overdue}</td>
                <td className={`px-4 py-3 text-center ${area.without_progress > 0 ? 'font-medium text-amber-600' : 'text-gray-600'}`}>{area.without_progress}</td>
                <td className="px-4 py-3 text-center text-gray-600">{area.max_age_days}</td>
                <td className="px-4 py-3 text-center text-gray-600">{area.avg_days_without_report}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
