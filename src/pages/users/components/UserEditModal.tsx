import { AnimatePresence, motion } from 'framer-motion';
import { HiOutlineX } from 'react-icons/hi';
import { ROLE_LABELS, Role } from '../../../types/enums';
import type { Area } from '../../../types';
import { Spinner } from '../../../components/ui';

interface Props {
  editingUserId: number | null;
  editOriginalRoleSlug: string;
  editName: string;
  setEditName: (v: string) => void;
  editEmail: string;
  setEditEmail: (v: string) => void;
  editRoleId: number;
  setEditRoleId: (v: number) => void;
  editAreaId: string;
  setEditAreaId: (v: string) => void;
  editAreaLoading: boolean;
  editActive: boolean;
  setEditActive: (v: boolean) => void;
  editSaving: boolean;
  areas: Area[];
  onCancel: () => void;
  onSave: (userId: number) => void;
}

export function UserEditModal({
  editingUserId,
  editOriginalRoleSlug,
  editName,
  setEditName,
  editEmail,
  setEditEmail,
  editRoleId,
  setEditRoleId,
  editAreaId,
  setEditAreaId,
  editAreaLoading,
  editActive,
  setEditActive,
  editSaving,
  areas,
  onCancel,
  onSave,
}: Props) {
  return (
    <AnimatePresence>
      {editingUserId != null && (
        <motion.div
          key="edit-panel"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={onCancel}
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
              <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
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
                  onClick={() => setEditActive(!editActive)}
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
                  onClick={onCancel}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => onSave(editingUserId)}
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
  );
}
