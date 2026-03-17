import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { areasApi } from '../../api/areas';
import { useAuth } from '../../context/useAuth';
import { Role } from '../../types/enums';
import type { Area } from '../../types';
import { HiOutlinePlus, HiOutlineUserGroup } from 'react-icons/hi';
import { PageTransition, StaggerList, StaggerItem, EmptyState, SkeletonCard, Badge } from '../../components/ui';

export function AreaListPage() {
  const { user } = useAuth();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = user?.role.slug === Role.SUPERADMIN;

  useEffect(() => {
    areasApi.list()
      .then((res) => setAreas(res))
      .catch(() => setAreas([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageTransition>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Áreas</h2>
        {isSuperAdmin && (
          <Link to="/areas/create" className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md active:scale-[0.98]">
            <HiOutlinePlus className="h-4 w-4" /> Nueva área
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : areas.length === 0 ? (
        <EmptyState
          icon={<HiOutlineUserGroup className="h-12 w-12" />}
          title="No hay áreas registradas"
          description="Crea una nueva área para organizar tus tareas y equipos."
          action={isSuperAdmin ? <Link to="/areas/create" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"><HiOutlinePlus className="h-4 w-4" /> Nueva área</Link> : undefined}
        />
      ) : (
        <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <StaggerItem key={area.id}>
              <Link to={`/areas/${area.id}`} className="block rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-blue-50 to-indigo-50">
                    <HiOutlineUserGroup className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{area.name}</h3>
                    <Badge variant={area.active ? 'green' : 'red'} size="sm">{area.active ? 'Activa' : 'Inactiva'}</Badge>
                  </div>
                </div>
                {area.description && <p className="mt-3 line-clamp-2 text-sm text-gray-500">{area.description}</p>}
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  {area.manager ? (
                    <>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-medium text-indigo-600">{area.manager.name.charAt(0)}</span>
                      <span>{area.manager.name}</span>
                    </>
                  ) : (
                    <span className="text-gray-400">Sin encargado</span>
                  )}
                </div>
                {area.process_identifier && (
                  <p className="mt-1.5 text-xs text-gray-400">Proceso: {area.process_identifier}</p>
                )}
              </Link>
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </PageTransition>
  );
}
