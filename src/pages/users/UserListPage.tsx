import { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence } from 'framer-motion';
import { usersApi } from '../../api/users';
import { areasApi } from '../../api/areas';
import { createUserSchema, type CreateUserFormData } from '../../schemas';
import { ROLE_LABELS, Role } from '../../types/enums';
import { ApiError } from '../../api/client';
import type { User, Area } from '../../types';
import { HiOutlinePlus, HiOutlineExclamationCircle, HiOutlineCheckCircle, HiOutlinePencil, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi';
import { PageTransition, FadeIn, SlideDown, SkeletonTable, Badge } from '../../components/ui';
import { UserEditModal } from './components/UserEditModal';
import { UserCreateForm } from './components/UserCreateForm';

const ROLE_BADGE: Record<string, 'purple' | 'blue' | 'gray'> = {
  superadmin: 'purple',
  area_manager: 'blue',
  worker: 'gray',
};

const PAGE_SIZE = 10;

export function UserListPage() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');

  const filteredUsers = useMemo(
    () => roleFilter ? allUsers.filter((u) => u.role.slug === roleFilter) : allUsers,
    [allUsers, roleFilter],
  );
  const total = filteredUsers.length;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const users = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
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

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, areasRes] = await Promise.all([
        usersApi.listAll(),
        areasApi.listAll().catch(() => []),
      ]);
      setAllUsers(usersRes);
      setAreas(Array.isArray(areasRes) ? areasRes : []);
    } catch {
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setPage(1);
  }, [roleFilter]);

  const showMessage = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const createForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  });

  const onCreateUser = async (data: CreateUserFormData) => {
    setServerError('');
    try {
      await usersApi.create(data);
      showMessage('Usuario creado exitosamente');
      createForm.reset();
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
      loadUsers();
    } catch (error) {
      setServerError(error instanceof ApiError ? error.data.message : 'Error al actualizar usuario');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-900">Usuarios</h2>
        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Todos los roles</option>
            <option value="superadmin">{ROLE_LABELS[Role.SUPERADMIN]}</option>
            <option value="area_manager">{ROLE_LABELS[Role.AREA_MANAGER]}</option>
            <option value="worker">{ROLE_LABELS[Role.WORKER]}</option>
          </select>
          <button
          type="button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]"
        >
          <HiOutlinePlus className="h-4 w-4" /> Nuevo usuario
        </button>
        </div>
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
          <UserCreateForm
            form={createForm}
            onSubmit={onCreateUser}
            onCancel={() => { setShowCreateForm(false); createForm.reset(); }}
          />
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
      {!loading && (
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
      <UserEditModal
        editingUserId={editingUserId}
        editOriginalRoleSlug={editOriginalRoleSlug}
        editName={editName}
        setEditName={setEditName}
        editEmail={editEmail}
        setEditEmail={setEditEmail}
        editRoleId={editRoleId}
        setEditRoleId={setEditRoleId}
        editAreaId={editAreaId}
        setEditAreaId={setEditAreaId}
        editAreaLoading={editAreaLoading}
        editActive={editActive}
        setEditActive={(v) => setEditActive(v)}
        editSaving={editSaving}
        areas={areas}
        onCancel={cancelEditing}
        onSave={saveUserEdit}
      />
    </PageTransition>
  );
}
