import { useEffect, useState, useCallback } from 'react';
import { areasApi } from '../../../api/areas';
import type { User } from '../../../types';
import { SkeletonCard } from '../../../components/ui';
import { FadeIn } from '../../../components/ui';
import { HiOutlineUsers } from 'react-icons/hi';

interface TeamMembersSectionProps {
  areaId: number;
  refreshKey: number;
}

export function TeamMembersSection({ areaId, refreshKey }: TeamMembersSectionProps) {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const users = await areasApi.membersAll(areaId);
      setMembers(users);
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
    <FadeIn delay={0.1} className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h3 className="flex items-center gap-2 font-semibold text-gray-900">
          <HiOutlineUsers className="h-5 w-5 text-indigo-500" />
          Trabajadores del área
        </h3>
        <span className="rounded-lg bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-600">
          {members.length}
        </span>
      </div>
      {members.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-gray-400">No hay trabajadores en esta área aún.</p>
      ) : (
        <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-500 text-sm font-medium text-white">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{member.name}</p>
                <p className="truncate text-xs text-gray-500">{member.email}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </FadeIn>
  );
}
