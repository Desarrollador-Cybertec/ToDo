import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence } from 'framer-motion';
import { createAreaSchema, type CreateAreaFormData } from '../../schemas';
import { areasApi } from '../../api/areas';
import { usersApi } from '../../api/users';
import { ApiError } from '../../api/client';
import type { User } from '../../types';
import { HiOutlineArrowLeft, HiOutlineExclamationCircle } from 'react-icons/hi';
import { PageTransition, FadeIn, SlideDown, Spinner, ConfirmModal } from '../../components/ui';
import { useNavigationGuard } from '../../utils/useNavigationGuard';

export function AreaCreatePage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<CreateAreaFormData | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    usersApi.listAll().then((res) => setUsers(res)).catch(() => {});
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<CreateAreaFormData>({
    resolver: zodResolver(createAreaSchema),
  });

  const navGuard = useNavigationGuard(isDirty && !isSubmitting);

  const onSubmit = async (data: CreateAreaFormData) => {
    setPendingFormData(data);
    setShowCreateModal(true);
  };

  const doCreate = async () => {
    if (!pendingFormData) return;
    setShowCreateModal(false);
    setServerError('');
    try {
      await areasApi.create({
        ...pendingFormData,
        description: pendingFormData.description || undefined,
        process_identifier: pendingFormData.process_identifier || undefined,
        manager_user_id: pendingFormData.manager_user_id || undefined,
      });
      navGuard.skip();
      navigate('/areas');
    } catch (error) {
      setServerError(error instanceof ApiError ? error.data.message : 'Error al crear el área');
    } finally {
      setPendingFormData(null);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-2xl">
        <button type="button" onClick={() => navigate('/areas')} className="mb-4 flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-900">
          <HiOutlineArrowLeft className="h-4 w-4" /> Volver a áreas
        </button>

        <h2 className="mb-6 text-2xl font-bold text-gray-900">Nueva Área</h2>

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
              <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">Nombre *</label>
              <input id="name" {...register('name')} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700">Descripción</label>
              <textarea id="description" rows={3} {...register('description')} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label htmlFor="process_identifier" className="mb-1.5 block text-sm font-medium text-gray-700">Identificador de proceso</label>
              <input id="process_identifier" {...register('process_identifier')} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
            <div>
              <label htmlFor="manager_user_id" className="mb-1.5 block text-sm font-medium text-gray-700">Encargado</label>
              <select id="manager_user_id" {...register('manager_user_id', { setValueAs: (v: string) => v ? Number(v) : null })} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="">Sin encargado</option>
                {users.filter((u) => u.role.slug === 'area_manager' || u.role.slug === 'superadmin').map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </FadeIn>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowLeaveModal(true)} className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98] disabled:opacity-50">
              {isSubmitting ? <><Spinner size="sm" /> Creando...</> : 'Crear área'}
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
          onConfirm={() => { if (navGuard.isBlocked) navGuard.confirm(); else navigate('/areas'); }}
          onCancel={() => { setShowLeaveModal(false); navGuard.cancel(); }}
        />
        <ConfirmModal
          open={showCreateModal}
          title="Confirmar creación"
          message="¿Crear esta área?"
          confirmLabel="Crear área"
          cancelLabel="Revisar"
          variant="primary"
          onConfirm={doCreate}
          onCancel={() => { setShowCreateModal(false); setPendingFormData(null); }}
        />
      </div>
    </PageTransition>
  );
}
