import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { meetingsApi } from '../../api/meetings';
import { MEETING_CLASSIFICATION_LABELS, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../types/enums';
import type { Meeting } from '../../types';
import { HiOutlineArrowLeft } from 'react-icons/hi';

export function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    meetingsApi.get(Number(id))
      .then((res) => setMeeting(res.data))
      .catch(() => navigate('/meetings'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  if (!meeting) return null;

  return (
    <div className="mx-auto max-w-4xl">
      <button type="button" onClick={() => navigate('/meetings')} className="mb-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
        <HiOutlineArrowLeft className="h-4 w-4" /> Volver a reuniones
      </button>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">{meeting.title}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Fecha</p>
            <p className="text-sm text-gray-900">{new Date(meeting.meeting_date).toLocaleDateString('es-PE')}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Clasificación</p>
            <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700">
              {MEETING_CLASSIFICATION_LABELS[meeting.classification]}
            </span>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-gray-400">Creado por</p>
            <p className="text-sm text-gray-900">{meeting.creator.name}</p>
          </div>
          {meeting.area && (
            <div>
              <p className="text-xs font-medium uppercase text-gray-400">Área</p>
              <p className="text-sm text-gray-900">{meeting.area.name}</p>
            </div>
          )}
        </div>
        {meeting.notes && (
          <div className="mt-4">
            <p className="text-xs font-medium uppercase text-gray-400">Notas</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{meeting.notes}</p>
          </div>
        )}
      </div>

      {meeting.tasks && meeting.tasks.length > 0 && (
        <div className="mt-6 rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-gray-900">Compromisos de esta reunión ({meeting.tasks.length})</h3>
          <div className="space-y-3">
            {meeting.tasks.map((task) => (
              <Link key={task.id} to={`/tasks/${task.id}`} className="block rounded-lg border p-4 transition-colors hover:bg-gray-50">
                <p className="font-medium text-gray-900">{task.title}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span>{TASK_STATUS_LABELS[task.status]}</span>
                  <span>{TASK_PRIORITY_LABELS[task.priority]}</span>
                  {task.current_responsible && <span>Responsable: {task.current_responsible.name}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
