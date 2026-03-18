import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { usersApi } from '../../api/users';
import { areasApi } from '../../api/areas';
import { createUserSchema, type CreateUserFormData } from '../../schemas';
import { ROLE_LABELS, Role } from '../../types/enums';
import { ApiError } from '../../api/client';
import type { User, Area } from '../../types';
import { HiOutlinePlus, HiOutlineExclamationCircle, HiOutlineCheckCircle, HiOutlinePencil, HiOutlineX, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import { PageTransition, FadeIn, SlideDown, SkeletonTable, Spinner, Badge } from '../../components/ui';

const ROLE_BADGE: Record<string, 'purple' | 'blue' | 'gray'> = {
  superadmin: 'purple',
  area_manager: 'blue',
  worker: 'gray',
};

export function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editOriginalRoleSlug, setEditOriginalRoleSlug] = useState<string>('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRoleId, setEditRoleId] = useState<number>(0);
  const [editAreaId, setEditAreaId] = useState<string>('');
  const [editAreaLoading, setEditAreaLoading] = useState(false);
  const [editActive, setEditActive] = useState(true);
  const [editSaving, setEditSaving] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadUsers = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const [usersRes, areasRes] = await Promise.all([
        usersApi.list(p),
        areasApi.list().catch(() => []),
      ]);
      setUsers(usersRes.data);
      setLastPage(usersRes.meta.last_page);
      setTotal(usersRes.meta.total);
      setAreas(Array.isArray(areasRes) ? areasRes : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(page);
  }, [loadUsers, page]);

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
      loadUsers(page);
    } catch (error) {
      setServerError(error instanceof ApiError ? error.data.message : 'Error al crear usuario');
    }
  };

  const handleToggleActive = async (userId: number) => {
    try {
      await usersApi.toggleActive(userId);
      showMessage('Estado del usuario actualizado');
      loadUsers(page);
    } catch (error) {
      setServerError(error instanceof ApiError ? error.data.message : 'Error al cambiar estado');
    }
  };

  const startEditing = async (u: User) => {
    // Set immediately from list data so modal opens right away
    setEditingUserId(u.id);
    setEditOriginalRoleSlug(u.role.slug);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRoleId(u.role.id);   // use nested role.id — always present
    setEditAreaId('');
    setEditActive(u.active);
    setServerError('');

    // Fetch full detail to get area_id and confirm role_id
    if (u.role.slug === 'worker') {
      setEditAreaLoading(true);
      try {
        const full = await usersApi.get(u.id);
        setEditRoleId(full.role.id);
        setEditAreaId(full.area_id ? String(full.area_id) : '');
      } catch {
        // keep values from list
      } finally {
        setEditAreaLoading(false);
      }
    }
  };

  const cancelEditing = () => {
    setEditingUserId(null);
  };

  const saveUserEdit = async (userId: number) => {
    setEditSaving(true);
    setServerError('');
    try {
      const currentUser = users.find((u) => u.id === userId);
      if (!currentUser) return;

      // Update user info if changed
      const updates: Record<string, string | number> = {};
      if (editName !== currentUser.name) updates.name = editName;
      if (editEmail !== currentUser.email) updates.email = editEmail;
      if (Object.keys(updates).length > 0) {
        await usersApi.update(userId, updates);
      }

      // Change role if different
      if (editRoleId !== currentUser.role_id) {
        await usersApi.changeRole(userId, editRoleId);
      }

      // Toggle active if changed
      if (editActive !== currentUser.active) {
        await usersApi.toggleActive(userId);
      }

      // Assign to area if selected
      if (editAreaId) {
        await areasApi.claimWorker({ area_id: Number(editAreaId), user_id: userId });
      }

      showMessage('Usuario actualizado');
      setEditingUserId(null);
      loadUsers(page);
    } catch (error) {
      setServerError(error instanceof ApiError ? error.data.message : 'Error al actualizar usuario');
    } finally {
      setEditSaving(false);
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
                <tr key={u.id} className="group transition-colors hover:bg-gray-50/50">
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
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(u)}
                        className="rounded-lg border border-gray-200 p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                        title="Editar"
                      >
                        <HiOutlinePencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(u.id)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${u.active ? 'border border-red-200 text-red-600 hover:bg-red-50' : 'border border-green-200 text-green-600 hover:bg-green-50'}`}
                      >
                        {u.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </FadeIn>
      )}

      {/* Pagination */}
      {!loading && lastPage > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {total} usuario{total !== 1 ? 's' : ''} en total
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <HiOutlineChevronLeft className="h-4 w-4" /> Anterior
            </button>
            <span className="text-sm text-gray-600">
              Página {page} de {lastPage}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              disabled={page === lastPage}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente <HiOutlineChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Edit user panel */}
      <AnimatePresence>
          {editingUserId != null && (
              <motion.div
                key="edit-panel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                onClick={cancelEditing}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Editar usuario</h3>
                    <button type="button" onClick={cancelEditing} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                      <HiOutlineX className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">Correo</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>

                    {/* Role: hidden for superadmin, worker↔area_manager for others */}
                    {editOriginalRoleSlug !== Role.SUPERADMIN && (
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-gray-700">Rol</label>
                        <select
                          value={editRoleId}
                          onChange={(e) => setEditRoleId(Number(e.target.value))}
                          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value={2}>{ROLE_LABELS[Role.AREA_MANAGER]}</option>
                          <option value={3}>{ROLE_LABELS[Role.WORKER]}</option>
                        </select>
                      </div>
                    )}

                    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Estado del usuario</p>
                        <p className="text-xs text-gray-500">{editActive ? 'El usuario puede iniciar sesión' : 'El usuario está bloqueado'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditActive((v) => !v)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          editActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                            editActive ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Area: only visible for workers */}
                    {editOriginalRoleSlug === Role.WORKER && (
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                      <label className="mb-1.5 block text-sm font-semibold text-indigo-700">Asignar a un área</label>
                      <p className="mb-2 text-xs text-indigo-600/70">Selecciona un área para agregar a este usuario como miembro.</p>
                      {editAreaLoading ? (
                        <div className="flex items-center gap-2 py-2 text-sm text-indigo-500">
                          <Spinner size="sm" /> Cargando área actual...
                        </div>
                      ) : (
                        <select
                          value={editAreaId}
                          onChange={(e) => setEditAreaId(e.target.value)}
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="">— Sin área —</option>
                          {areas.filter((a) => a.active).map((a) => (
                            <option key={a.id} value={a.id}>
                              {a.name}{a.manager ? ` (Encargado: ${a.manager.name})` : ''}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    )}

                    <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => saveUserEdit(editingUserId)}
                        disabled={editSaving}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
                      >
                        {editSaving ? <><Spinner size="sm" /> Guardando...</> : 'Guardar cambios'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
          )}
        </AnimatePresence>
    </PageTransition>
  );
}
