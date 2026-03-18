import { useEffect, useState, useCallback } from 'react';
import { areasApi } from '../../../api/areas';
import type { AreaMember } from '../../../types';
import { StaggerList, StaggerItem, SkeletonCard, Badge } from '../../../components/ui';
import { FadeIn } from '../../../components/ui';
import { HiOutlineUsers } from 'react-icons/hi';

interface TeamMembersSectionProps {
  areaId: number;
  refreshKey: number;
}

export function TeamMembersSection({ areaId, refreshKey }: TeamMembersSectionProps) {
  const [members, setMembers] = useState<AreaMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const areaDetail = await areasApi.get(areaId);
      const rawMembers = areaDetail.members;
      if (Array.isArray(rawMembers)) {
        setMembers(rawMembers);
      } else if (rawMembers && typeof rawMembers === 'object' && 'data' in rawMembers) {
        setMembers((rawMembers as unknown as { data: AreaMember[] }).data ?? []);
      } else {
        setMembers([]);
      }
    } catch {
      setError(true);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [areaId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
        Error al cargar los miembros del equipo.
        <button type="button" onClick={load} className="ml-2 underline hover:text-red-800">Reintentar</button>
      </div>
    );
  }

  return (
    <FadeIn className="mb-8">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
        <HiOutlineUsers className="h-5 w-5 text-indigo-500" />
        Trabajadores del área
        <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-600">
          {members.length}
        </span>
      </h3>
      {members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
          <p className="text-sm text-gray-500">No hay trabajadores en tu área aún</p>
        </div>
      ) : (
        <StaggerList className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <StaggerItem key={member.id}>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-500 text-sm font-medium text-white">
                    {member.user?.name?.charAt(0).toUpperCase() ?? '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{member.user?.name ?? 'Desconocido'}</p>
                    <p className="truncate text-xs text-gray-500">{member.user?.email ?? ''}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                  <Badge variant="green" size="sm">En el equipo</Badge>
                  <span>desde {new Date(member.joined_at).toLocaleDateString('es-PE')}</span>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerList>
      )}
    </FadeIn>
  );
}
