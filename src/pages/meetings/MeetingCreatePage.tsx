import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createMeetingSchema, type CreateMeetingFormData } from '../../schemas';
import { meetingsApi } from '../../api/meetings';
import { areasApi } from '../../api/areas';
import { MEETING_CLASSIFICATION_LABELS } from '../../types/enums';
import { ApiError } from '../../api/client';
import type { Area } from '../../types';

export function MeetingCreatePage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [areas, setAreas] = useState<Area[]>([]);

  useEffect(() => {
    areasApi.list().then((res) => setAreas(res.data)).catch(() => {});
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateMeetingFormData>({
    resolver: zodResolver(createMeetingSchema),
    defaultValues: { classification: 'operational' },
  });

  const onSubmit = async (data: CreateMeetingFormData) => {
    setServerError('');
    try {
      await meetingsApi.create({
        ...data,
        area_id: data.area_id || undefined,
        notes: data.notes || undefined,
      });
      navigate('/meetings');
    } catch (error) {
      setServerError(error instanceof ApiError ? error.data.message : 'Error al crear la reunión');
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Nueva Reunión</h2>
      {serverError && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{serverError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium text-gray-700">Título *</label>
            <input id="title" {...register('title')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="meeting_date" className="mb-1.5 block text-sm font-medium text-gray-700">Fecha *</label>
              <input id="meeting_date" type="date" {...register('meeting_date')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
              {errors.meeting_date && <p className="mt-1 text-sm text-red-500">{errors.meeting_date.message}</p>}
            </div>
            <div>
              <label htmlFor="classification" className="mb-1.5 block text-sm font-medium text-gray-700">Clasificación *</label>
              <select id="classification" {...register('classification')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
                {Object.entries(MEETING_CLASSIFICATION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.classification && <p className="mt-1 text-sm text-red-500">{errors.classification.message}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="area_id" className="mb-1.5 block text-sm font-medium text-gray-700">Área</label>
            <select id="area_id" {...register('area_id', { setValueAs: (v: string) => v ? Number(v) : null })} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
              <option value="">Sin área</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-gray-700">Notas</label>
            <textarea id="notes" rows={4} {...register('notes')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/meetings')} className="rounded-lg border px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting ? 'Creando...' : 'Crear reunión'}
          </button>
        </div>
      </form>
    </div>
  );
}
