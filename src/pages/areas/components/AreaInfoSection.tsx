import { useEffect, useState, useCallback } from 'react';
import { areasApi } from '../../../api/areas';
import { usersApi } from '../../../api/users';
import { ApiError } from '../../../api/client';
import { Role } from '../../../types/enums';
import type { Area, User } from '../../../types';
import { HiOutlineCheckCircle } from 'react-icons/hi';
import { AnimatePresence, motion } from 'framer-motion';
import { FadeIn, SlideDown, Badge, SkeletonDetail, Spinner } from '../../../components/ui';

interface AreaInfoSectionProps {
  areaId: number;
  userRole: string;
  refreshKey: number;
}

export function AreaInfoSection({ areaId, userRole, refreshKey }: AreaInfoSectionProps) {
  const [area, setArea] = useState<Area | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [managerCandidates, setManagerCandidates] = useState<User[]>([]);
  const [showManagerSelect, setShowManagerSelect] = useState(false);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [managerSaving, setManagerSaving] = useState(false);
  const [managerMsg, setManagerMsg] = useState('');

  const isSuperadmin = userRole === Role.SUPERADMIN;

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [areaRes, usersRes] = await Promise.all([
        areasApi.get(areaId),
        isSuperadmin ? usersApi.listAll().catch(() => [] as User[]) : Promise.resolve([] as User[]),
      ]);
      setArea(areaRes);
      setManagerCandidates(
        usersRes.filter((u) => u.role.slug === Role.AREA_MANAGER && u.active),
      );
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [areaId, isSuperadmin]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const handleAssignManager = async () => {
    if (!selectedManagerId) return;
    setManagerSaving(true);
    try {
      await areasApi.assignManager(areaId, Number(selectedManagerId));
      setManagerMsg('Encargado asignado');
      setShowManagerSelect(false);
      setSelectedManagerId('');
      load();
      setTimeout(() => setManagerMsg(''), 3000);
    } catch (err) {
      setManagerMsg(err instanceof ApiError ? err.data.message : 'Error al asignar encargado');
    } finally {
      setManagerSaving(false);
    }
  };

  if (loading) return <SkeletonDetail />;
  if (error || !area) {
    return (
      <div className="rounded-2xl border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-600 dark:text-red-400">
        Error al cargar la información del área.
        <button type="button" onClick={load} className="ml-2 underline hover:text-red-800 dark:hover:text-red-200">Reintentar</button>
      </div>
    );
  }

  return (
    <FadeIn className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{area.name}</h2>
          {area.description && <p className="mt-2 text-gray-600 dark:text-gray-400">{area.description}</p>}
        </div>
        <Badge variant={area.active ? 'green' : 'red'} size="md">{area.active ? 'Activa' : 'Inactiva'}</Badge>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Encargado</p>
          <div className="mt-1 flex items-center gap-2">
            {area.manager ? (
              <>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-xs font-medium text-indigo-600 dark:text-indigo-400">{area.manager.name.charAt(0)}</span>
                <p className="text-sm text-gray-900 dark:text-gray-100">{area.manager.name}</p>
              </>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">Sin asignar</p>
            )}
            {isSuperadmin && (
              <button
                type="button"
                onClick={() => {
                  setShowManagerSelect(!showManagerSelect);
                  setSelectedManagerId(area.manager_user_id ? String(area.manager_user_id) : area.manager?.id ? String(area.manager.id) : '');
                }}
                className="rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showManagerSelect ? 'Cancelar' : area.manager ? 'Cambiar' : 'Asignar'}
              </button>
            )}
          </div>
          <AnimatePresence>
            {showManagerSelect && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 overflow-hidden"
              >
                <div className="flex items-center gap-2">
                  <select
                    value={selectedManagerId}
                    onChange={(e) => setSelectedManagerId(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">— Seleccionar —</option>
                    {managerCandidates.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAssignManager}
                    disabled={!selectedManagerId || managerSaving}
                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {managerSaving ? <Spinner size="sm" /> : null}
                    Asignar
                  </button>
                </div>
                {managerMsg && (
                  <p className="mt-1.5 text-xs font-medium text-green-600 dark:text-green-400">{managerMsg}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {area.process_identifier && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Proceso</p>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{area.process_identifier}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {managerMsg && !showManagerSelect && (
          <SlideDown>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 dark:bg-green-900/30 p-2 text-sm text-green-600 dark:text-green-400 ring-1 ring-inset ring-green-200 dark:ring-green-800">
              <HiOutlineCheckCircle className="h-4 w-4 shrink-0" /> {managerMsg}
            </div>
          </SlideDown>
        )}
      </AnimatePresence>
    </FadeIn>
  );
}
