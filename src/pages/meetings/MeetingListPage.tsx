import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { meetingsApi } from '../../api/meetings';
import { MEETING_CLASSIFICATION_LABELS } from '../../types/enums';
import type { Meeting } from '../../types';
import { HiOutlinePlus, HiOutlineCalendar } from 'react-icons/hi';
import { PageTransition, StaggerList, StaggerItem, EmptyState, SkeletonList, Badge } from '../../components/ui';

const CLASSIFICATION_VARIANT: Record<string, 'purple' | 'blue' | 'green' | 'amber'> = {
  operational: 'blue',
  strategic: 'purple',
  follow_up: 'green',
  other: 'amber',
};

export function MeetingListPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    meetingsApi.list()
      .then((res) => setMeetings(res))
      .catch(() => setMeetings([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageTransition>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reuniones</h2>
        <Link to="/meetings/create" className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
          <HiOutlinePlus className="h-4 w-4" /> Nueva reunión
        </Link>
      </div>

      {loading ? (
        <SkeletonList />
      ) : meetings.length === 0 ? (
        <EmptyState
          icon={<HiOutlineCalendar className="h-12 w-12" />}
          title="No hay reuniones registradas"
          description="Crea una nueva reunión para registrar acuerdos y compromisos."
          action={<Link to="/meetings/create" className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-700"><HiOutlinePlus className="h-4 w-4" /> Nueva reunión</Link>}
        />
      ) : (
        <StaggerList className="space-y-3">
          {meetings.map((m) => (
            <StaggerItem key={m.id}>
              <Link to={`/meetings/${m.id}`} className="block rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm transition-all hover:shadow-md hover:border-purple-100 dark:hover:border-purple-900">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-purple-50 to-indigo-50 dark:to-indigo-950">
                    <HiOutlineCalendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{m.title}</h3>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <HiOutlineCalendar className="h-3.5 w-3.5" />
                        {new Date(m.meeting_date).toLocaleDateString('es-PE')}
                      </span>
                      <Badge variant={CLASSIFICATION_VARIANT[m.classification] ?? 'gray'} size="sm">
                        {MEETING_CLASSIFICATION_LABELS[m.classification]}
                      </Badge>
                      {m.area && <span>Área: {m.area.name}</span>}
                      <span className="flex items-center gap-1">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-[9px] font-medium text-gray-600 dark:text-gray-400">{m.creator.name.charAt(0)}</span>
                        {m.creator.name}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </PageTransition>
  );
}
