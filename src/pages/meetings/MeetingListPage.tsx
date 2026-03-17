import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { meetingsApi } from '../../api/meetings';
import { MEETING_CLASSIFICATION_LABELS } from '../../types/enums';
import type { Meeting } from '../../types';
import { HiOutlinePlus, HiOutlineCalendar } from 'react-icons/hi';

export function MeetingListPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    meetingsApi.list()
      .then((res) => setMeetings(res.data))
      .catch(() => setMeetings([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Reuniones</h2>
        <Link to="/meetings/create" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
          <HiOutlinePlus className="h-4 w-4" /> Nueva reunión
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />)}
        </div>
      ) : meetings.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <p className="text-gray-500">No hay reuniones registradas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => (
            <Link key={m.id} to={`/meetings/${m.id}`} className="block rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                  <HiOutlineCalendar className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{m.title}</h3>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span>{new Date(m.meeting_date).toLocaleDateString('es-PE')}</span>
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-700">
                      {MEETING_CLASSIFICATION_LABELS[m.classification]}
                    </span>
                    {m.area && <span>Área: {m.area.name}</span>}
                    <span>Creado por: {m.creator.name}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
