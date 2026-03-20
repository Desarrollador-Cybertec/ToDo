import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence } from 'framer-motion';
import { createMeetingSchema, type CreateMeetingFormData } from '../../schemas';
import { meetingsApi } from '../../api/meetings';
import { areasApi } from '../../api/areas';
import { MEETING_CLASSIFICATION_LABELS, Role } from '../../types/enums';
import { ApiError } from '../../api/client';
import type { Area } from '../../types';
import { useAuth } from '../../context/useAuth';
import { HiOutlineArrowLeft, HiOutlineExclamationCircle, HiOutlineOfficeBuilding } from 'react-icons/hi';
import { PageTransition, FadeIn, SlideDown, Spinner, ConfirmModal } from '../../components/ui';
import { useNavigationGuard } from '../../utils/useNavigationGuard';

export function MeetingCreatePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isManager = user?.role?.slug === Role.AREA_MANAGER;
  const [serverError, setServerError] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<CreateMeetingFormData | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [managerArea, setManagerArea] = useState<Area | null>(null);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting, isDirty } } = useForm<CreateMeetingFormData>({
    resolver: zodResolver(createMeetingSchema),
    defaultValues: { classification: 'operational' },
  });

  const navGuard = useNavigationGuard(isDirty && !isSubmitting);

  const loadAreas = useCallback(async () => {
    try {
      const res = await areasApi.listAll();
      setAreas(res);
      if (isManager) {
        const uid = Number(user?.id);
        const found =
          (user?.area_id ? res.find((a) => Number(a.id) === Number(user.area_id)) : null) ??
          res.find(
            (a) =>
              Number(a.manager_user_id) === uid ||
              (a.manager?.id != null && Number(a.manager.id) === uid),
          ) ??
          null;
        setManagerArea(found);
        if (found) setValue('area_id', found.id);
      }
    } catch {
      // silent
    }
  }, [isManager, user?.id, user?.area_id, setValue]);

  useEffect(() => {
    loadAreas();
  }, [loadAreas]);

  const onSubmit = async (data: CreateMeetingFormData) => {
    setPendingFormData(data);
    setShowCreateModal(true);
  };

  const doCreate = async () => {
    if (!pendingFormData) return;
    setShowCreateModal(false);
    setServerError('');
    try {
      await meetingsApi.create({
        ...pendingFormData,
        area_id: pendingFormData.area_id || undefined,
        notes: pendingFormData.notes || undefined,
      });
      navGuard.skip();
      navigate('/meetings');
    } catch (error) {
      setServerError(error instanceof ApiError ? error.data.message : 'Error al crear la reunión');
    } finally {
      setPendingFormData(null);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl">
        <button type="button" onClick={() => navigate('/meetings')} className="mb-4 flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900">
          <HiOutlineArrowLeft className="h-4 w-4" /> Volver a reuniones
        </button>

        <h2 className="mb-6 text-2xl font-bold text-gray-900">Nueva Reunión</h2>

        <AnimatePresence>
          {serverError && (
            <SlideDown>
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600 ring-1 ring-inset ring-red-200">
                <HiOutlineExclamationCircle className="h-4 w-4 shrink-0" />
                {serverError}
              </div>
            </SlideDown>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FadeIn className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-gray-700">Título *</label>
              <input id="title" {...register('title')} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="meeting_date" className="mb-1.5 block text-sm font-medium text-gray-700">Fecha *</label>
                <input id="meeting_date" type="date" {...register('meeting_date')} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                {errors.meeting_date && <p className="mt-1 text-sm text-red-500">{errors.meeting_date.message}</p>}
              </div>
              <div>
                <label htmlFor="classification" className="mb-1.5 block text-sm font-medium text-gray-700">Clasificación *</label>
                <select id="classification" {...register('classification')} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20">
                  {Object.entries(MEETING_CLASSIFICATION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                {errors.classification && <p className="mt-1 text-sm text-red-500">{errors.classification.message}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="area_id" className="mb-1.5 block text-sm font-medium text-gray-700">Área</label>
              {isManager ? (
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700">
                  <HiOutlineOfficeBuilding className="h-4 w-4 shrink-0 text-purple-500" />
                  <span>{managerArea?.name ?? 'Cargando área...'}</span>
                  <input type="hidden" {...register('area_id', { valueAsNumber: true })} />
                </div>
              ) : (
                <select id="area_id" {...register('area_id', { setValueAs: (v: string) => v ? Number(v) : null })} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20">
                  <option value="">Sin área</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              )}
            </div>
            <div>
              <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-gray-700">Notas</label>
              <textarea id="notes" rows={4} {...register('notes')} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
            </div>
          </FadeIn>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowLeaveModal(true)} className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-50">
              {isSubmitting ? <><Spinner size="sm" /> Creando...</> : 'Crear reunión'}
            </button>
          </div>
        </form>

        <ConfirmModal
          open={showLeaveModal || navGuard.isBlocked}
          title="¿Salir sin guardar?"
          message="Los datos ingresados se perderán. ¿Estás seguro de que deseas salir?"
          confirmLabel="Salir"
          cancelLabel="Seguir editando"
          variant="danger"
          onConfirm={() => { if (navGuard.isBlocked) navGuard.confirm(); else navigate('/meetings'); }}
          onCancel={() => { setShowLeaveModal(false); navGuard.cancel(); }}
        />
        <ConfirmModal
          open={showCreateModal}
          title="Confirmar creación"
          message="¿Crear esta reunión?"
          confirmLabel="Crear reunión"
          cancelLabel="Revisar"
          variant="primary"
          onConfirm={doCreate}
          onCancel={() => { setShowCreateModal(false); setPendingFormData(null); }}
        />
      </div>
    </PageTransition>
  );
}
