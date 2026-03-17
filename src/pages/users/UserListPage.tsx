import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence } from 'framer-motion';
import { usersApi } from '../../api/users';
import { createUserSchema, type CreateUserFormData } from '../../schemas';
import { ROLE_LABELS } from '../../types/enums';
import { ApiError } from '../../api/client';
import type { User } from '../../types';
import { HiOutlinePlus, HiOutlineExclamationCircle, HiOutlineCheckCircle } from 'react-icons/hi';
import { PageTransition, FadeIn, SlideDown, SkeletonTable, Spinner, Badge } from '../../components/ui';

const ROLE_BADGE: Record<string, 'purple' | 'blue' | 'gray'> = {
  superadmin: 'purple',
  area_manager: 'blue',
  worker: 'gray',
};

export function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      const res = await usersApi.list();
      setUsers(res);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const showMessage = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  });

  const onCreateUser = async (data: CreateUserFormData) => {
    setServerError('');
    try {
      await usersApi.create(data);
      showMessage('Usuario creado exitosamente');
      reset();
      setShowCreateForm(false);
      loadUsers();
    } catch (error) {
      setServerError(error instanceof ApiError ? error.data.message : 'Error al crear usuario');
    }
  };

  const handleToggleActive = async (userId: number) => {
    try {
      await usersApi.toggleActive(userId);
      showMessage('Estado del usuario actualizado');
      loadUsers();
    } catch (error) {
      setServerError(error instanceof ApiError ? error.data.message : 'Error al cambiar estado');
    }
  };

  return (
    <PageTransition>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Usuarios</h2>
        <button
          type="button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
        >
          <HiOutlinePlus className="h-4 w-4" /> Nuevo usuario
        </button>
      </div>

      <AnimatePresence>
        {serverError && (
          <SlideDown>
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-600 ring-1 ring-inset ring-red-200">
              <HiOutlineExclamationCircle className="h-4 w-4 shrink-0" /> {serverError}
            </div>
          </SlideDown>
        )}
        {successMsg && (
          <SlideDown>
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm text-green-600 ring-1 ring-inset ring-green-200">
              <HiOutlineCheckCircle className="h-4 w-4 shrink-0" /> {successMsg}
            </div>
          </SlideDown>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateForm && (
          <SlideDown className="mb-6">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-gray-900">Crear usuario</h3>
              <form onSubmit={handleSubmit(onCreateUser)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-gray-700">Nombre *</label>
                    <input id="name" {...register('name')} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">Correo *</label>
                    <input id="email" type="email" {...register('email')} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">Contraseña *</label>
                    <input id="password" type="password" autoComplete="new-password" {...register('password')} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="password_confirmation" className="mb-1.5 block text-sm font-medium text-gray-700">Confirmar contraseña *</label>
                    <input id="password_confirmation" type="password" autoComplete="new-password" {...register('password_confirmation')} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    {errors.password_confirmation && <p className="mt-1 text-sm text-red-500">{errors.password_confirmation.message}</p>}
                  </div>
                  <div>
                    <label htmlFor="role_id" className="mb-1.5 block text-sm font-medium text-gray-700">Rol *</label>
                    <select id="role_id" {...register('role_id', { valueAsNumber: true })} className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                      <option value="">Seleccionar rol</option>
                      <option value={1}>Super Administrador</option>
                      <option value={2}>Encargado de Área</option>
                      <option value={3}>Trabajador</option>
                    </select>
                    {errors.role_id && <p className="mt-1 text-sm text-red-500">{errors.role_id.message}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                    {isSubmitting ? <><Spinner size="sm" /> Creando...</> : 'Crear'}
                  </button>
                  <button type="button" onClick={() => { setShowCreateForm(false); reset(); }} className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </SlideDown>
        )}
      </AnimatePresence>

      {loading ? (
        <SkeletonTable />
      ) : (
        <FadeIn className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50/80">
              <tr>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Usuario</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Correo</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Rol</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Estado</th>
                <th className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-indigo-100 text-sm font-medium text-blue-700">{u.name.charAt(0)}</span>
                      <span className="font-medium text-gray-900">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{u.email}</td>
                  <td className="px-6 py-4">
                    <Badge variant={ROLE_BADGE[u.role.slug] ?? 'gray'} size="sm">{ROLE_LABELS[u.role.slug]}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={u.active ? 'green' : 'red'} size="sm">{u.active ? 'Activo' : 'Inactivo'}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(u.id)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${u.active ? 'border border-red-200 text-red-600 hover:bg-red-50' : 'border border-green-200 text-green-600 hover:bg-green-50'}`}
                    >
                      {u.active ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </FadeIn>
      )}
    </PageTransition>
  );
}
