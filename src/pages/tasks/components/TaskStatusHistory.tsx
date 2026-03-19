import { FadeIn, Badge, STATUS_BADGE_VARIANT } from '../../../components/ui';
import { TASK_STATUS_LABELS } from '../../../types/enums';
import type { TaskStatusType } from '../../../types/enums';
import { formatDateTime } from '../../../utils';

interface StatusEntry {
  id: number;
  from_status: TaskStatusType | null;
  to_status: TaskStatusType;
  note?: string | null;
  user_id?: number | null;
  created_at: string;
  user?: { name?: string } | null;
}

export function TaskStatusHistory({
  history,
  isSuperAdmin,
  isManager,
  userId,
}: {
  history: StatusEntry[];
  isSuperAdmin: boolean;
  isManager: boolean;
  userId?: number;
}) {
  if (history.length === 0) return null;

  const visible = (isSuperAdmin || isManager)
    ? history
    : history.filter((h) => h.user_id === userId);

  return (
    <FadeIn delay={0.2} className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-semibold text-gray-900">Historial de estados</h3>
      <div className="relative ml-3 border-l-2 border-gray-200 pl-6">
        {visible.length === 0 && (
          <p className="text-sm text-gray-400">No tienes interacciones registradas en esta tarea.</p>
        )}
        {visible.map((h, index) => (
          <div key={h.id} className={`relative pb-4 ${index === visible.length - 1 ? 'pb-0' : ''}`}>
            <div className="absolute -left-7.75 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 ring-4 ring-white">
              <div className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {h.from_status ? (
                  <>
                    <Badge variant={STATUS_BADGE_VARIANT[h.from_status]} size="sm">{TASK_STATUS_LABELS[h.from_status]}</Badge>
                    <span className="mx-1.5 text-gray-400">→</span>
                  </>
                ) : null}
                <Badge variant={STATUS_BADGE_VARIANT[h.to_status]} size="sm">{TASK_STATUS_LABELS[h.to_status]}</Badge>
              </p>
              <p className="mt-1 text-xs text-gray-500">{h.user?.name ?? 'Sistema'} · {formatDateTime(h.created_at)}</p>
              {h.note && <p className="mt-1 text-xs text-gray-600">{h.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </FadeIn>
  );
}
