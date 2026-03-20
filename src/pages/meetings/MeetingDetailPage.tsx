import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { meetingsApi } from '../../api/meetings';
import { MEETING_CLASSIFICATION_LABELS, TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '../../types/enums';
import type { Meeting } from '../../types';
import { useAuth } from '../../context/useAuth';
import { ApiError } from '../../api/client';
import { HiOutlineArrowLeft, HiOutlineCalendar, HiOutlineChevronRight, HiOutlinePencil, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';
import { PageTransition, FadeIn, StaggerList, StaggerItem, Badge, STATUS_BADGE_VARIANT, PRIORITY_BADGE_VARIANT, SkeletonDetail, Spinner } from '../../components/ui';
import { MeetingTasksSection } from './components/MeetingTasksSection';

const CLASSIFICATION_VARIANT: Record<string, 'purple' | 'blue' | 'green' | 'amber'> = {
  operational: 'blue',
  strategic: 'purple',
  follow_up: 'green',
  other: 'amber',
};

export function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editClassification, setEditClassification] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');

  const loadMeeting = useCallback(() => {
    meetingsApi.get(Number(id))
      .then((res) => setMeeting(res))
      .catch(() => navigate('/meetings'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    loadMeeting();
  }, [loadMeeting]);

  const isCreator = meeting && Number(meeting.created_by) === Number(user?.id);

  const startEditing = () => {
    if (!meeting) return;
    setEditTitle(meeting.title);
    setEditDate(meeting.meeting_date?.slice(0, 10) ?? '');
    setEditClassification(meeting.classification);
    setEditNotes(meeting.notes ?? '');
    setEditError('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setEditError('');
  };

  const saveEdit = async () => {
    if (!meeting) return;
    setEditSaving(true);
    setEditError('');
    try {
      const updates: Record<string, string> = {};
      if (editTitle !== meeting.title) updates.title = editTitle;
      if (editDate !== (meeting.meeting_date?.slice(0, 10) ?? '')) updates.meeting_date = editDate;
      if (editClassification !== meeting.classification) updates.classification = editClassification;
      if ((editNotes || '') !== (meeting.notes || '')) updates.notes = editNotes;
      if (Object.keys(updates).length > 0) {
        await meetingsApi.update(meeting.id, updates);
        loadMeeting();
      }
      setEditing(false);
    } catch (error) {
      setEditError(error instanceof ApiError ? error.data.message : 'Error al actualizar la reunión');
    } finally {
      setEditSaving(false);
    }
  };

  if (loading) return <SkeletonDetail />;
  if (!meeting) return null;

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl">
        <button type="button" onClick={() => navigate('/meetings')} className="mb-4 flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900">
          <HiOutlineArrowLeft className="h-4 w-4" /> Volver a reuniones
        </button>

        <FadeIn className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          {editing ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Editar reunión</h3>
              {editError && (
                <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{editError}</p>
              )}
              <div>
                <label htmlFor="edit-title" className="mb-1.5 block text-sm font-medium text-gray-700">Título</label>
                <input id="edit-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="edit-date" className="mb-1.5 block text-sm font-medium text-gray-700">Fecha</label>
                  <input id="edit-date" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none" />
                </div>
                <div>
                  <label htmlFor="edit-classification" className="mb-1.5 block text-sm font-medium text-gray-700">Clasificación</label>
                  <select id="edit-classification" value={editClassification} onChange={(e) => setEditClassification(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none">
                    {Object.entries(MEETING_CLASSIFICATION_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="edit-notes" className="mb-1.5 block text-sm font-medium text-gray-700">Notas</label>
                <textarea id="edit-notes" rows={4} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button type="button" onClick={cancelEditing} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">
                  <HiOutlineX className="h-4 w-4" /> Cancelar
                </button>
                <button type="button" onClick={saveEdit} disabled={editSaving || !editTitle.trim()} className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50">
                  {editSaving ? <Spinner size="sm" /> : <HiOutlineCheck className="h-4 w-4" />}
                  {editSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
          <>
          <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900">{meeting.title}</h2>
          {isCreator && (
            <button type="button" onClick={startEditing} className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-600 active:scale-[0.98]">
              <HiOutlinePencil className="h-4 w-4" /> Editar
            </button>
          )}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Fecha</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-900">
                <HiOutlineCalendar className="h-4 w-4 text-gray-400" />
                {new Date(meeting.meeting_date).toLocaleDateString('es-PE')}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Clasificación</p>
              <div className="mt-1">
                <Badge variant={CLASSIFICATION_VARIANT[meeting.classification] ?? 'gray'} size="md">
                  {MEETING_CLASSIFICATION_LABELS[meeting.classification]}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Creado por</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-50 text-xs font-medium text-purple-600">{meeting.creator.name.charAt(0)}</span>
                <p className="text-sm text-gray-900">{meeting.creator.name}</p>
              </div>
            </div>
            {meeting.area && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Área</p>
                <p className="mt-1 text-sm text-gray-900">{meeting.area.name}</p>
              </div>
            )}
          </div>
          {meeting.notes && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Notas</p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-gray-700">{meeting.notes}</p>
            </div>
          )}
          </>
          )}
        </FadeIn>

        {meeting.tasks && meeting.tasks.length > 0 && (
          <FadeIn delay={0.1} className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              Compromisos de esta reunión
              <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600">{meeting.tasks.length}</span>
            </h3>
            <StaggerList className="space-y-3">
              {meeting.tasks.map((task) => (
                <StaggerItem key={task.id}>
                  <Link to={`/tasks/${task.id}`} className="group flex items-center justify-between rounded-xl border border-gray-100 p-4 transition-all hover:border-blue-100 hover:bg-blue-50/30">
                    <div>
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Badge variant={STATUS_BADGE_VARIANT[task.status]} size="sm">{TASK_STATUS_LABELS[task.status]}</Badge>
                        <Badge variant={PRIORITY_BADGE_VARIANT[task.priority]} size="sm">{TASK_PRIORITY_LABELS[task.priority]}</Badge>
                        {task.current_responsible && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-50 text-[9px] font-medium text-indigo-600">{task.current_responsible.name.charAt(0)}</span>
                            {task.current_responsible.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <HiOutlineChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-blue-500" />
                  </Link>
                </StaggerItem>
              ))}
            </StaggerList>
          </FadeIn>
        )}

        <MeetingTasksSection
          meetingId={meeting.id}
          areaId={meeting.area_id ?? meeting.area?.id ?? null}
          onTasksCreated={loadMeeting}
        />
      </div>
    </PageTransition>
  );
}
