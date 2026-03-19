import { FadeIn, StaggerList, StaggerItem } from '../../../components/ui';
import { formatDateTime } from '../../../utils';

interface Update {
  id: number;
  comment?: string | null;
  progress_percent: number | null;
  created_at: string;
  user?: { name?: string } | null;
}

export function TaskUpdates({ updates }: { updates: Update[] }) {
  if (updates.length === 0) return null;

  return (
    <FadeIn delay={0.25} className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-semibold text-gray-900">Reportes de avance</h3>
      <StaggerList className="space-y-3">
        {updates.map((u) => (
          <StaggerItem key={u.id}>
            <div className="rounded-xl bg-gray-50 p-4 transition-colors hover:bg-gray-100/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-600">{u.user?.name?.charAt(0) ?? '?'}</span>
                  <span className="text-sm font-medium text-gray-900">{u.user?.name ?? 'Desconocido'}</span>
                </div>
                <span className="text-xs text-gray-400">{formatDateTime(u.created_at)}</span>
              </div>
              <div className="mt-2 pl-9">
                {u.progress_percent !== null && (
                  <div className="mb-1 flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-gray-200">
                      <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${u.progress_percent}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-green-600">{u.progress_percent}%</span>
                  </div>
                )}
                {u.comment && <p className="text-sm text-gray-700">{u.comment}</p>}
              </div>
            </div>
          </StaggerItem>
        ))}
      </StaggerList>
    </FadeIn>
  );
}
