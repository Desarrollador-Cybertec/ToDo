import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createAreaSchema, type CreateAreaFormData } from '../../schemas';
import { areasApi } from '../../api/areas';
import { usersApi } from '../../api/users';
import { ApiError } from '../../api/client';
import type { User } from '../../types';

export function AreaCreatePage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    usersApi.list().then((res) => setUsers(res.data)).catch(() => {});
  }, []);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateAreaFormData>({
    resolver: zodResolver(createAreaSchema),
  });

  const onSubmit = async (data: CreateAreaFormData) => {
    setServerError('');
    try {
      await areasApi.create({
        ...data,
        description: data.description || undefined,
        process_identifier: data.process_identifier || undefined,
        manager_user_id: data.manager_user_id || undefined,
      });
      navigate('/areas');
    } catch (error) {
      setServerError(error instanceof ApiError ? error.data.message : 'Error al crear el área');
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Nueva Área</h2>
      {serverError && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{serverError}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">Nombre *</label>
            <input id="name" {...register('name')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-gray-700">Descripción</label>
            <textarea id="description" rows={3} {...register('description')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label htmlFor="process_identifier" className="mb-1.5 block text-sm font-medium text-gray-700">Identificador de proceso</label>
            <input id="process_identifier" {...register('process_identifier')} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label htmlFor="manager_user_id" className="mb-1.5 block text-sm font-medium text-gray-700">Encargado</label>
            <select id="manager_user_id" {...register('manager_user_id', { setValueAs: (v: string) => v ? Number(v) : null })} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none">
              <option value="">Sin encargado</option>
              {users.filter((u) => u.role.slug === 'area_manager' || u.role.slug === 'superadmin').map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/areas')} className="rounded-lg border px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {isSubmitting ? 'Creando...' : 'Crear área'}
          </button>
        </div>
      </form>
    </div>
  );
}
