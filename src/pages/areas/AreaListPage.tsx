import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { areasApi } from '../../api/areas';
import { useAuth } from '../../context/useAuth';
import { Role } from '../../types/enums';
import type { Area } from '../../types';
import { HiOutlinePlus, HiOutlineUserGroup } from 'react-icons/hi';

export function AreaListPage() {
  const { user } = useAuth();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = user?.role.slug === Role.SUPERADMIN;

  useEffect(() => {
    areasApi.list()
      .then((res) => setAreas(res.data))
      .catch(() => setAreas([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Áreas</h2>
        {isSuperAdmin && (
          <Link to="/areas/create" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">
            <HiOutlinePlus className="h-4 w-4" /> Nueva área
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-200" />)}
        </div>
      ) : areas.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center">
          <p className="text-gray-500">No hay áreas registradas.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <Link key={area.id} to={`/areas/${area.id}`} className="rounded-xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <HiOutlineUserGroup className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{area.name}</h3>
                  {!area.active && <span className="text-xs text-red-500">Inactiva</span>}
                </div>
              </div>
              {area.description && <p className="mt-3 line-clamp-2 text-sm text-gray-500">{area.description}</p>}
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>Encargado: {area.manager?.name ?? 'Sin asignar'}</span>
              </div>
              {area.process_identifier && (
                <p className="mt-1 text-xs text-gray-400">Proceso: {area.process_identifier}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
